
'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { addTimeToTotal, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime } from 'date-fns-tz';
import { differenceInCalendarDays, format } from 'date-fns';
import { logUserActivity } from '@/services/activityLogService';

const HEARTBEAT_INTERVAL = 5000; // 5 seconds

export const useStreakTracker = () => {
    const { user } = useAuth();
    const streakContext = useContext(StreakContext);
    const { timezone } = useTimezone();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    if (!streakContext) {
        return;
    }
    const { streakData, setStreakData } = streakContext;

    // Effect for handling the daily rollover logic.
    // This now only runs on the client when data changes.
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(new Date(streakData.lastActivityDate), timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        if (daysDifference > 0) {
            // It's a new day. Add the *entire* previous day's time to the total.
            const timeFromYesterday = streakData.timeSpentToday;
            const streakContinued = daysDifference === 1 && streakData.todayStreakCompleted;
            
            const updatedData: Partial<StreakData> = {
                timeSpentToday: 0,
                todayStreakCompleted: false,
                currentStreak: streakContinued ? streakData.currentStreak : 0,
                lastActivityDate: new Date(),
                insight: undefined,
                timeSpentTotal: (streakData.timeSpentTotal || 0) + timeFromYesterday,
            };

            // Update the database with the new day's reset state.
            updateStreakData(user.uid, updatedData);
        }
    }, [user, streakData, timezone]);

    // Effect for logging activity when daily goal is completed.
    // This is now triggered by a state change, making it safer.
    useEffect(() => {
        if (!user || !streakData) return;

        const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');
        const wasGoalCompletedToday = streakData.todayStreakCompleted;
        const lastCompletedDay = streakData.completedDays?.[streakData.completedDays.length - 1];

        // Only log if the goal is completed AND it hasn't been logged for today yet.
        if (wasGoalCompletedToday && lastCompletedDay !== todayStr) {
            logUserActivity(user.uid, 'task_completed', { title: "Daily Streak Goal" });
            
            const completedDaysSet = new Set(streakData.completedDays || []);
            completedDaysSet.add(todayStr);
            const updatedData = { completedDays: Array.from(completedDaysSet) };
            
            // Only update the completedDays array in the database.
            updateStreakData(user.uid, updatedData);
        }
    }, [streakData?.todayStreakCompleted, user, timezone, streakData?.completedDays]);


    // Main heartbeat effect for tracking active engagement.
    useEffect(() => {
        const startHeartbeat = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            
            timerRef.current = setInterval(() => {
                if (user) {
                    // Tell the server we are active. The server handles all calculations.
                    addTimeToTotal(user.uid, HEARTBEAT_INTERVAL / 1000);
                }
            }, HEARTBEAT_INTERVAL);
        };

        const stopHeartbeat = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopHeartbeat();
            } else {
               startHeartbeat();
            }
        };
        
        if (user && streakData && !document.hidden) {
            startHeartbeat();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        
        return () => {
            stopHeartbeat(); 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData]);
};

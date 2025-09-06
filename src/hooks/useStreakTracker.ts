
'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime } from 'date-fns-tz';
import { differenceInCalendarDays, format } from 'date-fns';
import { logUserActivity } from '@/services/activityLogService';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export const useStreakTracker = () => {
    const { user } = useAuth();
    const streakContext = useContext(StreakContext);
    const { timezone } = useTimezone();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    if (!streakContext) {
        return;
    }
    const { streakData, setStreakData } = streakContext;

    const saveData = useCallback(async (dataToSave: Partial<StreakData>) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, dataToSave);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    // Effect for handling the daily rollover logic.
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(new Date(streakData.lastActivityDate), timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        if (daysDifference > 0) {
            const updatedData: StreakData = { 
                ...streakData,
                timeSpentToday: 0,
                timeSpentTotal: (streakData.timeSpentTotal || 0) + streakData.timeSpentToday,
                todayStreakCompleted: false,
                currentStreak: daysDifference > 1 ? 0 : streakData.currentStreak, 
                lastActivityDate: new Date(),
            };
            
            setStreakData(updatedData);
            saveData(updatedData);
        }
    }, [user, streakData, setStreakData, saveData, timezone]);

    // Effect for logging activity when daily goal is completed.
    useEffect(() => {
        if (streakData?.todayStreakCompleted && user) {
            const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');
            if (streakData.completedDays?.includes(todayStr)) {
                 logUserActivity(user.uid, 'task_completed', { title: "Daily Streak Goal" });
            }
        }
    }, [streakData?.todayStreakCompleted, streakData?.completedDays, user, timezone]);

    // Main timer effect for tracking active engagement.
    useEffect(() => {
        const startTimer = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            
            timerRef.current = setInterval(() => {
                setStreakData(prevData => {
                    if (!prevData || !user) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return prevData;
                    }

                    const newTimeSpentToday = (prevData.timeSpentToday || 0) + 1;
                    
                    let dataToUpdate: Partial<StreakData> = {
                        timeSpentToday: newTimeSpentToday,
                        lastActivityDate: new Date()
                    };
                    
                    const wasGoalCompletedToday = prevData.todayStreakCompleted;

                    if (newTimeSpentToday >= STREAK_GOAL_SECONDS && !wasGoalCompletedToday) {
                      const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');
                      const completedDaysSet = new Set(prevData.completedDays || []);
                      
                      const newStreak = (prevData.currentStreak || 0) + 1;
                      completedDaysSet.add(todayStr);

                      dataToUpdate = {
                         ...dataToUpdate,
                         todayStreakCompleted: true,
                         currentStreak: newStreak,
                         longestStreak: Math.max(newStreak, prevData.longestStreak || 0),
                         completedDays: Array.from(completedDaysSet),
                      };
                    }

                    return { ...prevData, ...dataToUpdate };
                });
            }, 1000);
        };

        const stopTimerAndSave = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if(streakData) {
                const { insight, ...dataToSave } = streakData;
                saveData(dataToSave);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimerAndSave();
            } else {
               startTimer();
            }
        };
        
        if (user && streakData) {
            startTimer();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        
        return () => {
            stopTimerAndSave(); 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, saveData, setStreakData, timezone]);
};

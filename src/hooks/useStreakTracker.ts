
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
    const lastSavedTimeRef = useRef<Date | null>(null);

    if (!streakContext) {
        // This can happen briefly during context setup, so we just return.
        return;
    }
    const { streakData, setStreakData } = streakContext;

    const saveData = useCallback(async (dataToSave: Partial<StreakData>) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, dataToSave);
            lastSavedTimeRef.current = new Date();
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
            const yesterdayTimeSpent = streakData.timeSpentToday;
            const streakContinued = daysDifference === 1 && streakData.todayStreakCompleted;
            
            const updatedData: StreakData = {
                ...streakData,
                timeSpentTotal: (streakData.timeSpentTotal || 0) + yesterdayTimeSpent,
                timeSpentToday: 0,
                todayStreakCompleted: false,
                currentStreak: streakContinued ? streakData.currentStreak : 0,
                lastActivityDate: new Date(),
                insight: undefined, // Clear insight for the new day
            };
            
            setStreakData(updatedData);
            saveData(updatedData);
        }
    }, [user, streakData, setStreakData, saveData, timezone]);

    // Effect for logging activity when daily goal is completed.
    useEffect(() => {
        if (!user || !streakData?.todayStreakCompleted) return;

        const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');
        // Find the last completed day to prevent duplicate logging
        const lastCompletedDay = streakData.completedDays?.[streakData.completedDays.length - 1];

        if (lastCompletedDay === todayStr) {
             // Check if the activity for today has already been logged.
             // This is a simple check; a more robust system might store logged dates.
             // For now, we assume if the last completed day is today, we might have logged it.
             // A better approach would be to check if insight for today's streak has been generated.
            return;
        }

        // A simplistic way to prevent re-logging: check if the streak has increased.
        // This assumes logging happens right after streak increment.
        if(streakData.insight?.lastUpdatedStreak === streakData.currentStreak) return;


        logUserActivity(user.uid, 'task_completed', { title: "Daily Streak Goal" });

    }, [streakData?.todayStreakCompleted, streakData?.completedDays, user, timezone, streakData?.currentStreak, streakData?.insight]);

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
            // Save the latest state when timer stops
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
        
        // Only start the timer if we have a user and data, and the tab is visible.
        if (user && streakData && !document.hidden) {
            startTimer();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        
        return () => {
            stopTimerAndSave(); 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, saveData, setStreakData, timezone]);
};

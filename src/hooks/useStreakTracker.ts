
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
    const { streakData, setStreakData, isLoading } = streakContext;
    
    const saveData = useCallback(async (data: Partial<StreakData>) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, data);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    useEffect(() => {
        const initializeStreakForNewUser = async () => {
            if (user && !isLoading && streakData === null) {
                console.log("Initializing streak data for a new user...");
                const newStreakData: StreakData = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: new Date(),
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                    completedDays: [],
                };
                await saveData(newStreakData);
                setStreakData(newStreakData);
            }
        };
        initializeStreakForNewUser();
    }, [user, isLoading, streakData, saveData, setStreakData]);
    
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(new Date(streakData.lastActivityDate), timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        let needsUpdate = false;
        let updatedData = { ...streakData };

        if (daysDifference > 0) {
            // It's a new day. Reset daily progress regardless of previous values.
            updatedData.timeSpentToday = 0;
            updatedData.todayStreakCompleted = false;
            needsUpdate = true;
            
            if (daysDifference > 1) {
                // More than a day has passed, so the streak is broken.
                updatedData.currentStreak = 0;
            }
        }
        
        if (needsUpdate) {
            updatedData.lastActivityDate = new Date();
            setStreakData(updatedData);
            saveData(updatedData);
        }

    }, [user, streakData, setStreakData, saveData, timezone]);


    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setStreakData(prevData => {
                if (!prevData || prevData.todayStreakCompleted || !user) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return prevData;
                }

                const newTimeSpent = (prevData.timeSpentToday || 0) + 1;
                const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');

                if (newTimeSpent >= STREAK_GOAL_SECONDS && !prevData.todayStreakCompleted) {
                    const completedDaysSet = new Set(prevData.completedDays || []);
                    const wasAlreadyCompletedToday = completedDaysSet.has(todayStr);
                    completedDaysSet.add(todayStr);

                    const newStreak = wasAlreadyCompletedToday 
                        ? prevData.currentStreak 
                        : (prevData.currentStreak || 0) + 1;

                    const updatedData: StreakData = {
                        ...prevData,
                        timeSpentToday: newTimeSpent,
                        todayStreakCompleted: true,
                        currentStreak: newStreak,
                        longestStreak: Math.max(newStreak, prevData.longestStreak || 0),
                        lastActivityDate: new Date(),
                        completedDays: Array.from(completedDaysSet),
                    };

                    if (!wasAlreadyCompletedToday) {
                        logUserActivity(user.uid, 'task_completed', { title: "Daily Streak Goal" });
                    }
                    
                    saveData(updatedData);
                    return updatedData;
                } else {
                     return { ...prevData, timeSpentToday: newTimeSpent };
                }
            });
        }, 1000);
    }, [setStreakData, saveData, timezone, user]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if(streakData && streakData.timeSpentToday > 0) {
            saveData({ timeSpentToday: streakData.timeSpentToday, lastActivityDate: new Date() });
        }
    }, [streakData, saveData]);

    useEffect(() => {
        if (!user || !streakData) {
            if(timerRef.current) stopTimer();
            return;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimer();
            } else {
                if (!streakData.todayStreakCompleted) {
                   startTimer();
                }
            }
        };

        if (!streakData.todayStreakCompleted) {
            startTimer();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            stopTimer(); 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, startTimer, stopTimer]);
};


'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { updateStreakData, getStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime } from 'date-fns-tz';
import { differenceInCalendarDays, format } from 'date-fns';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export const useStreakTracker = () => {
    const { user } = useAuth();
    const streakContext = useContext(StreakContext);
    const { timezone } = useTimezone();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Ensure streakContext is defined before destructuring
    if (!streakContext) {
        return; 
    }
    const { streakData, setStreakData, setIsLoading } = streakContext;
    
    const saveData = useCallback(async (data: StreakData) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, data);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    // Effect to initialize streak data for a new user or check the streak on load
    useEffect(() => {
        const initializeStreak = async () => {
            if (!user) return;

            setIsLoading(true);
            let data = await getStreakData(user.uid);
            
            if (!data) {
                // First time user, create a new streak record
                data = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: new Date(),
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                    completedDays: [], // Initialize empty array
                };
                await saveData(data);
            }

            const nowInUserTz = toZonedTime(new Date(), timezone);
            const lastActivityInUserTz = toZonedTime(data.lastActivityDate, timezone);
            const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);

            let needsUpdate = false;
            if (daysDifference > 0) {
                 data.timeSpentToday = 0;
                 data.todayStreakCompleted = false;
                 needsUpdate = true;
            }
             if (daysDifference > 1) {
                 data.currentStreak = 0;
                 needsUpdate = true;
            }
             if (needsUpdate) {
                data.lastActivityDate = new Date();
                await saveData(data);
            }

            setStreakData(data);
            setIsLoading(false);
        };
        initializeStreak();
    }, [user, setStreakData, setIsLoading, saveData, timezone]);


    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setStreakData(prevData => {
                if (!prevData || prevData.todayStreakCompleted) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return prevData;
                }

                const newTimeSpent = (prevData.timeSpentToday || 0) + 1;
                const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');

                if (newTimeSpent >= STREAK_GOAL_SECONDS) {
                    const completedDaysSet = new Set(prevData.completedDays || []);
                    completedDaysSet.add(todayStr);

                    const updatedData: StreakData = {
                        ...prevData,
                        timeSpentToday: newTimeSpent,
                        todayStreakCompleted: true,
                        currentStreak: (prevData.currentStreak || 0) + 1,
                        longestStreak: Math.max((prevData.currentStreak || 0) + 1, prevData.longestStreak || 0),
                        lastActivityDate: new Date(),
                        completedDays: Array.from(completedDaysSet),
                    };
                    saveData(updatedData);
                    if (timerRef.current) clearInterval(timerRef.current);
                    return updatedData;
                } else {
                    return { ...prevData, timeSpentToday: newTimeSpent };
                }
            });
        }, 1000);
    }, [setStreakData, saveData, timezone]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        // Save final time when timer stops
        if(streakData && streakData.timeSpentToday > 0) {
            saveData({ timeSpentToday: streakData.timeSpentToday });
        }
    }, [streakData, saveData]);

    // Effect for handling page visibility to pause/resume the timer
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!user || !streakData || streakData.todayStreakCompleted) return;

            if (document.hidden) {
                stopTimer();
            } else {
                startTimer();
            }
        };

        // Start timer if page is visible and goal isn't met
        if (user && streakData && !streakData.todayStreakCompleted) {
            startTimer();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            stopTimer(); // Cleanup on unmount
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, startTimer, stopTimer]);
};

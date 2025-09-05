
'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { updateStreakData } from '@/services/streakService';
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

    if (!streakContext) {
        // This can happen briefly on first load, so we just return.
        // The hook will re-run once the context is available.
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

    // Effect to initialize streak data for a new user, ONLY if it's not loading and data is null.
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
    
    // Effect to check and reset streak on new day
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(streakData.lastActivityDate, timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        let needsUpdate = false;
        let updatedData = { ...streakData };

        if (daysDifference > 0) {
            // Reset daily progress if it's a new day
            if (updatedData.timeSpentToday > 0 || updatedData.todayStreakCompleted) {
                updatedData.timeSpentToday = 0;
                updatedData.todayStreakCompleted = false;
                needsUpdate = true;
            }
        }
        
        if (daysDifference > 1) {
            // Reset streak if more than one day has passed
            if (updatedData.currentStreak > 0) {
                updatedData.currentStreak = 0;
                needsUpdate = true;
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
                if (!prevData || prevData.todayStreakCompleted) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return prevData;
                }

                const newTimeSpent = (prevData.timeSpentToday || 0) + 1;
                const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');

                if (newTimeSpent >= STREAK_GOAL_SECONDS) {
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
        if(streakData && streakData.timeSpentToday > 0 && !streakData.todayStreakCompleted) {
            saveData({ timeSpentToday: streakData.timeSpentToday });
        }
    }, [streakData, saveData]);

    // Effect for handling page visibility to pause/resume the timer
    useEffect(() => {
        if (!user || !streakData || streakData.todayStreakCompleted) {
            // If timer is running but shouldn't be, clear it
            if(timerRef.current) stopTimer();
            return;
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimer();
            } else {
                startTimer();
            }
        };

        startTimer();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            stopTimer(); // Cleanup on unmount
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, startTimer, stopTimer]);
};

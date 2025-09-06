
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
                    timeSpentTotal: 0, // Initialize new XP counter
                    todayStreakCompleted: false,
                    completedDays: [],
                };
                await saveData(newStreakData);
                setStreakData(newStreakData);
            }
        };
        initializeStreakForNewUser();
    }, [user, isLoading, streakData, saveData, setStreakData]);
    
    // This effect handles the daily rollover logic
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(new Date(streakData.lastActivityDate), timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        if (daysDifference > 0) {
            // It's a new day
            const newTotalTime = (streakData.timeSpentTotal || 0) + streakData.timeSpentToday;
            
            const updatedData = { 
                ...streakData,
                timeSpentToday: 0, // Reset for the new day
                timeSpentTotal: newTotalTime, // Accumulate XP
                todayStreakCompleted: false,
                currentStreak: daysDifference > 1 ? 0 : streakData.currentStreak, // Reset streak if more than 1 day passed
                lastActivityDate: new Date(),
            };
            
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
                    const updatedData = { ...prevData, timeSpentToday: newTimeSpent, lastActivityDate: new Date() };
                    // We only save the time progress periodically, not every second, to reduce Firestore writes.
                    // A good strategy is to save on visibility change (implemented below).
                    return updatedData;
                }
            });
        }, 1000);
    }, [setStreakData, saveData, timezone, user]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        // Save the latest progress when the timer stops
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

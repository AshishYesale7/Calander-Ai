
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
const SAVE_INTERVAL_SECONDS = 60; // Save progress every 60 seconds

export const useStreakTracker = () => {
    const { user } = useAuth();
    const streakContext = useContext(StreakContext);
    const { timezone } = useTimezone();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // This prevents a crash if the context is not available (e.g., during subscription page)
    if (!streakContext) {
        return; 
    }
    const { streakData, setStreakData, isLoading } = streakContext;
    
    const saveData = useCallback(async (dataToSave: Partial<StreakData>) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, dataToSave);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    // Effect to initialize data for a new user
    useEffect(() => {
        const initializeStreakForNewUser = async () => {
            if (user && !isLoading && streakData === null) {
                const newStreakData: StreakData = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: new Date(),
                    timeSpentToday: 0,
                    timeSpentTotal: 0,
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
            // It's a new day. Add yesterday's work to total before resetting.
            const newTotalTime = (streakData.timeSpentTotal || 0) + streakData.timeSpentToday;
            
            const updatedData: StreakData = { 
                ...streakData,
                timeSpentToday: 0, // Reset daily timer
                timeSpentTotal: newTotalTime,
                todayStreakCompleted: false, // Reset daily goal completion
                currentStreak: daysDifference > 1 ? 0 : streakData.currentStreak, 
                lastActivityDate: new Date(),
            };
            
            setStreakData(updatedData);
            saveData(updatedData);
        }

    }, [user, streakData, setStreakData, saveData, timezone]);


    // This effect is the main timer that runs when the user is active
    useEffect(() => {
        let lastSaveTime = Date.now();

        const startTimer = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            
            timerRef.current = setInterval(() => {
                setStreakData(prevData => {
                    if (!prevData || !user) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return prevData;
                    }

                    // Increment the daily timer
                    const newTimeSpentToday = (prevData.timeSpentToday || 0) + 1;
                    
                    let dataToUpdate: Partial<StreakData> = {
                        timeSpentToday: newTimeSpentToday,
                        lastActivityDate: new Date()
                    };

                    // Check if the streak goal is met for the first time today
                    if (newTimeSpentToday >= STREAK_GOAL_SECONDS && !prevData.todayStreakCompleted) {
                        const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');
                        const completedDaysSet = new Set(prevData.completedDays || []);
                        
                        const wasAlreadyCompletedToday = completedDaysSet.has(todayStr);
                        
                        // Only increment streak if this is a new day being completed
                        const newStreak = !wasAlreadyCompletedToday
                            ? (prevData.currentStreak || 0) + 1
                            : (prevData.currentStreak || 0);

                        if (!wasAlreadyCompletedToday) {
                            completedDaysSet.add(todayStr);
                            logUserActivity(user.uid, 'task_completed', { title: "Daily Streak Goal" });
                        }

                        dataToUpdate = {
                           ...dataToUpdate,
                           todayStreakCompleted: true,
                           currentStreak: newStreak,
                           longestStreak: Math.max(newStreak, prevData.longestStreak || 0),
                           completedDays: Array.from(completedDaysSet),
                        };
                    }
                    
                    const now = Date.now();
                    if (now - lastSaveTime > SAVE_INTERVAL_SECONDS * 1000) {
                        // Batch updates to Firestore to reduce writes
                        saveData({ ...dataToUpdate, timeSpentTotal: prevData.timeSpentTotal }); 
                        lastSaveTime = now;
                    }

                    return { ...prevData, ...dataToUpdate };
                });
            }, 1000);
        };

        const stopTimer = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            // Save final state when timer stops
            if(streakData) {
                saveData({ 
                    timeSpentToday: streakData.timeSpentToday, 
                    timeSpentTotal: streakData.timeSpentTotal, 
                    lastActivityDate: streakData.lastActivityDate 
                });
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimer();
            } else {
               startTimer();
            }
        };

        if (user && streakData) {
            startTimer();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        
        return () => {
            stopTimer(); 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, saveData, setStreakData, timezone]);
};

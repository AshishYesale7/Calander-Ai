
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
        // This can happen if the hook is used outside the provider, which shouldn't happen
        // in the app's structure but is a safe guard.
        return;
    }
    const { streakData, setStreakData, isLoading } = streakContext;

    const saveData = useCallback(async (dataToSave: Partial<StreakData>) => {
        if (!user) return;
        try {
            // This function now only writes to Firestore.
            await updateStreakData(user.uid, dataToSave);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    // Effect to initialize data for a new user, if it doesn't exist in Firestore.
    useEffect(() => {
        const initializeStreakForNewUser = async () => {
            // Only run if auth is done, we have a user, and their data is null (meaning they are new)
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
                // Save the new record to Firestore and update the local state.
                await saveData(newStreakData);
                setStreakData(newStreakData);
            }
        };
        initializeStreakForNewUser();
    }, [user, isLoading, streakData, saveData, setStreakData]);
    
    // Effect for handling the daily rollover logic.
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(new Date(streakData.lastActivityDate), timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        if (daysDifference > 0) {
            // Add yesterday's time to total before resetting.
            const newTotalTime = (streakData.timeSpentTotal || 0) + streakData.timeSpentToday;
            
            const updatedData: StreakData = { 
                ...streakData,
                timeSpentToday: 0, // Reset for the new day
                timeSpentTotal: newTotalTime, // Update total XP
                todayStreakCompleted: false,
                // Reset streak if user missed a day
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
            // Check if this goal completion has already been logged for today
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

                    // Check if the goal has just been completed.
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
            }, 1000); // Ticks every second
        };

        const stopTimerAndSave = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            // Save the latest progress to Firestore when the user becomes inactive.
            if(streakData) {
                // Ensure we save all relevant fields, not just time.
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
        
        // The timer should only run if there is a user and data has been loaded.
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

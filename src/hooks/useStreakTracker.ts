
'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime, format as formatTz, differenceInCalendarDays } from 'date-fns-tz';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export const useStreakTracker = () => {
    const { user } = useAuth();
    const { streakData, setStreakData, setIsLoading } = useContext(StreakContext)!;
    const { timezone } = useTimezone();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const saveData = useCallback(async (data: StreakData) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, data);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    // This effect handles the timer and the main streak logic
    useEffect(() => {
        // Stop if there's no user or streak data is still loading
        if (!user || !streakData) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const tick = () => {
            setStreakData(prevData => {
                if (!prevData) return null;

                // 1. Check for Daily Reset
                const nowInUserTz = toZonedTime(new Date(), timezone);
                const lastActivityInUserTz = toZonedTime(prevData.lastActivityDate, timezone);
                const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);

                let updatedData: StreakData = { ...prevData };

                if (daysDifference > 0) {
                    // It's a new day
                    if (daysDifference > 1) {
                        // More than one day has passed, reset the streak
                        updatedData.currentStreak = 0;
                    }
                    // Reset daily progress
                    updatedData.timeSpentToday = 0;
                    updatedData.todayStreakCompleted = false;
                }
                
                // 2. Track Time and Update Streak
                // Only track time if the streak for today is not yet completed
                if (!updatedData.todayStreakCompleted) {
                    const newTimeSpent = (updatedData.timeSpentToday || 0) + 1;
                    updatedData.timeSpentToday = newTimeSpent;

                    // Check if the goal is met
                    if (newTimeSpent >= STREAK_GOAL_SECONDS) {
                        // Mark as completed for today to prevent multiple increments
                        updatedData.todayStreakCompleted = true;
                        
                        // Increment the main streak counter
                        updatedData.currentStreak = (updatedData.currentStreak || 0) + 1;
                        
                        // Update the longest streak if necessary
                        if (updatedData.currentStreak > (updatedData.longestStreak || 0)) {
                            updatedData.longestStreak = updatedData.currentStreak;
                        }
                    }
                }

                // 3. Update Last Activity Date
                updatedData.lastActivityDate = new Date();

                // 4. Save to Firestore (non-blocking)
                saveData(updatedData);

                return updatedData;
            });
        };

        // Start the timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(tick, 1000); // Run every second

        // Cleanup on unmount
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };

    }, [user, streakData, setStreakData, saveData, timezone]);

};

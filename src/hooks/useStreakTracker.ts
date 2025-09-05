
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import { isSameDay, subDays, startOfDay } from 'date-fns';
import type { StreakData } from '@/types';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export const useStreakTracker = () => {
    const { user } = useAuth();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<Date | null>(null);

    const handleStreakLogic = useCallback(async (userId: string) => {
        try {
            let streakData = await getStreakData(userId);
            const now = new Date();
            const today = startOfDay(now);

            // Initialize data for a new user
            if (!streakData) {
                streakData = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: today,
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                };
                await updateStreakData(userId, streakData);
                return; // Exit after initializing
            }

            const lastActivityDay = startOfDay(streakData.lastActivityDate);

            // If the last activity was NOT today or yesterday, the streak is broken.
            if (!isSameDay(lastActivityDay, today) && !isSameDay(lastActivityDay, subDays(today, 1))) {
                await updateStreakData(userId, { currentStreak: 0, timeSpentToday: 0, todayStreakCompleted: false });
            }
            // If the last activity was yesterday, we need to reset today's progress.
            else if (isSameDay(lastActivityDay, subDays(today, 1))) {
                 await updateStreakData(userId, { timeSpentToday: 0, todayStreakCompleted: false });
            }


        } catch (error) {
            console.error("Error in streak logic:", error);
        }
    }, []);

    const startTracking = useCallback(() => {
        if (!user || timerRef.current) return;

        lastUpdateRef.current = new Date();

        timerRef.current = setInterval(async () => {
            if (document.hidden) { // Don't track time if the tab is not active
                lastUpdateRef.current = new Date(); // Reset timer when tab becomes active again
                return;
            }

            const now = new Date();
            const elapsedSeconds = (now.getTime() - (lastUpdateRef.current?.getTime() || now.getTime())) / 1000;
            lastUpdateRef.current = now;

            const streakData = await getStreakData(user.uid);
            if (!streakData) return;
            
            const newTimeSpent = (streakData.timeSpentToday || 0) + elapsedSeconds;

            const updatePayload: Partial<StreakData> = {
                timeSpentToday: newTimeSpent,
                lastActivityDate: now,
            };

            // Check if streak goal is met for the first time today
            if (newTimeSpent >= STREAK_GOAL_SECONDS && !streakData.todayStreakCompleted) {
                updatePayload.todayStreakCompleted = true;
                
                // Simplified Streak Increment Logic
                const newStreakCount = (streakData.currentStreak || 0) + 1;
                updatePayload.currentStreak = newStreakCount;

                if (updatePayload.currentStreak > (streakData.longestStreak || 0)) {
                    updatePayload.longestStreak = updatePayload.currentStreak;
                }
            }
            
            await updateStreakData(user.uid, updatePayload);
        }, 10000); // Update every 10 seconds
    }, [user]);

    const stopTracking = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (user) {
            handleStreakLogic(user.uid);
            startTracking();
        } else {
            stopTracking();
        }
        
        // Cleanup on unmount
        return () => stopTracking();
    }, [user, handleStreakLogic, startTracking, stopTracking]);
};

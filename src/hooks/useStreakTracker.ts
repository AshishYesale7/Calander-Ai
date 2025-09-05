
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
            // This logic is crucial for when a user returns after a long time.
            if (!isSameDay(lastActivityDay, today) && !isSameDay(lastActivityDay, subDays(today, 1))) {
                await updateStreakData(userId, { currentStreak: 0, timeSpentToday: 0, todayStreakCompleted: false });
            }

        } catch (error) {
            console.error("Error in initial streak logic:", error);
        }
    }, []);

    const startTracking = useCallback(() => {
        if (!user || timerRef.current) return;

        lastUpdateRef.current = new Date();

        timerRef.current = setInterval(async () => {
            if (document.hidden) {
                lastUpdateRef.current = new Date();
                return;
            }

            const now = new Date();
            const elapsedSeconds = (now.getTime() - (lastUpdateRef.current?.getTime() || now.getTime())) / 1000;
            lastUpdateRef.current = now;

            const streakData = await getStreakData(user.uid);
            if (!streakData) return;

            const today = startOfDay(now);
            const lastActivityDay = startOfDay(streakData.lastActivityDate);
            let timeToday = streakData.timeSpentToday || 0;
            let streakCompletedToday = streakData.todayStreakCompleted || false;

            // *** CRUCIAL FIX: DAILY RESET LOGIC ***
            // If the last recorded activity was from a previous day, reset today's progress.
            if (!isSameDay(lastActivityDay, today)) {
                timeToday = 0;
                streakCompletedToday = false;
            }

            const newTimeSpent = timeToday + elapsedSeconds;

            const updatePayload: Partial<StreakData> = {
                timeSpentToday: newTimeSpent,
                lastActivityDate: now,
            };

            // If the goal is met AND it hasn't been marked as complete for today yet
            if (newTimeSpent >= STREAK_GOAL_SECONDS && !streakCompletedToday) {
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
            // This runs once on mount to handle cases like a broken streak after days of inactivity.
            handleStreakLogic(user.uid);
            // This starts the continuous tracking.
            startTracking();
        } else {
            stopTracking();
        }
        
        return () => stopTracking();
    }, [user, handleStreakLogic, startTracking, stopTracking]);
};

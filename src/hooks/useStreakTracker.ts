
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export const useStreakTracker = () => {
    const { user } = useAuth();
    const { timezone } = useTimezone();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<Date | null>(null);

    const handleInitialStreakLogic = useCallback(async (userId: string) => {
        try {
            let streakData = await getStreakData(userId);
            if (!streakData) {
                // First-time user, initialize their streak data.
                const nowInUserTz = toZonedTime(new Date(), timezone);
                const startOfTodayInUserTz = fromZonedTime(formatTz(nowInUserTz, 'yyyy-MM-dd', { timeZone: timezone }), timezone);

                streakData = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: startOfTodayInUserTz, // Start with today
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                };
                await updateStreakData(userId, streakData);
            }
        } catch (error) {
            console.error("Error in initial streak setup:", error);
        }
    }, [timezone]);


    const startTracking = useCallback(() => {
        if (!user || timerRef.current) return;

        lastUpdateRef.current = new Date();

        timerRef.current = setInterval(async () => {
            if (document.hidden) {
                lastUpdateRef.current = new Date(); // Keep updating to track time away accurately
                return;
            }

            const nowUtc = new Date();
            const elapsedSeconds = (nowUtc.getTime() - (lastUpdateRef.current?.getTime() || nowUtc.getTime())) / 1000;
            lastUpdateRef.current = nowUtc;

            const streakData = await getStreakData(user.uid);
            if (!streakData) return;
            
            const nowInUserTz = toZonedTime(nowUtc, timezone);
            const lastActivityInUserTz = toZonedTime(streakData.lastActivityDate, timezone);

            const todayFormatted = formatTz(nowInUserTz, 'yyyy-MM-dd', { timeZone: timezone });
            const lastDayFormatted = formatTz(lastActivityInUserTz, 'yyyy-MM-dd', { timeZone: timezone });

            let timeToday = streakData.timeSpentToday || 0;
            let streakCompletedToday = streakData.todayStreakCompleted || false;
            let currentStreak = streakData.currentStreak || 0;

            // --- Daily Reset Logic (Timezone-Aware) ---
            if (todayFormatted !== lastDayFormatted) {
                // If the last activity was NOT yesterday, the streak is broken.
                const yesterdayFormatted = formatTz(new Date(nowInUserTz.setDate(nowInUserTz.getDate() - 1)), 'yyyy-MM-dd', { timeZone: timezone });
                if (lastDayFormatted !== yesterdayFormatted) {
                    currentStreak = 0;
                }
                
                // Reset daily progress regardless of streak status.
                timeToday = 0;
                streakCompletedToday = false;
            }

            const newTimeSpent = timeToday + elapsedSeconds;

            const updatePayload: Partial<StreakData> = {
                timeSpentToday: newTimeSpent,
                lastActivityDate: nowUtc,
                todayStreakCompleted: streakCompletedToday,
                currentStreak: currentStreak,
            };

            // If the goal is met AND it hasn't been marked as complete for today yet
            if (newTimeSpent >= STREAK_GOAL_SECONDS && !streakCompletedToday) {
                updatePayload.todayStreakCompleted = true;
                updatePayload.currentStreak = currentStreak + 1;
                
                if (updatePayload.currentStreak > (streakData.longestStreak || 0)) {
                    updatePayload.longestStreak = updatePayload.currentStreak;
                }
            }
            
            await updateStreakData(user.uid, updatePayload);

        }, 10000); // Update every 10 seconds
    }, [user, timezone]);

    const stopTracking = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (user) {
            handleInitialStreakLogic(user.uid);
            startTracking();
        } else {
            stopTracking();
        }
        
        return () => stopTracking();
    }, [user, handleInitialStreakLogic, startTracking, stopTracking]);
};

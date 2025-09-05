
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';

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
                const nowInUserTz = utcToZonedTime(new Date(), timezone);
                const startOfTodayInUserTz = zonedTimeToUtc(formatTz(nowInUserTz, 'yyyy-MM-dd'), timezone);

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
            
            // Get the current date and the last activity date IN THE USER'S TIMEZONE
            const nowInUserTz = utcToZonedTime(nowUtc, timezone);
            const lastActivityInUserTz = utcToZonedTime(streakData.lastActivityDate, timezone);

            const todayFormatted = formatTz(nowInUserTz, 'yyyy-MM-dd');
            const lastDayFormatted = formatTz(lastActivityInUserTz, 'yyyy-MM-dd');

            let timeToday = streakData.timeSpentToday || 0;
            let streakCompletedToday = streakData.todayStreakCompleted || false;

            // --- Daily Reset Logic (Timezone-Aware) ---
            if (todayFormatted !== lastDayFormatted) {
                timeToday = 0;
                streakCompletedToday = false;
            }

            const newTimeSpent = timeToday + elapsedSeconds;

            const updatePayload: Partial<StreakData> = {
                timeSpentToday: newTimeSpent,
                lastActivityDate: nowUtc,
                todayStreakCompleted: streakCompletedToday,
            };

            // If the goal is met AND it hasn't been marked as complete for today yet
            if (newTimeSpent >= STREAK_GOAL_SECONDS && !streakCompletedToday) {
                updatePayload.todayStreakCompleted = true;
                
                // --- Streak Increment Logic ---
                // Get yesterday's date in the user's timezone
                const yesterdayInUserTz = new Date(nowInUserTz);
                yesterdayInUserTz.setDate(yesterdayInUserTz.getDate() - 1);
                const yesterdayFormatted = formatTz(yesterdayInUserTz, 'yyyy-MM-dd');
                
                let newStreakCount = streakData.currentStreak || 0;

                // If the last activity was yesterday, we continue the streak.
                // If it was from before yesterday, the streak is broken and starts again at 1.
                // If the last activity was today, we don't increment again.
                if (lastDayFormatted === yesterdayFormatted) {
                    newStreakCount += 1;
                } else if (lastDayFormatted !== todayFormatted) {
                    newStreakCount = 1;
                }

                updatePayload.currentStreak = newStreakCount;

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


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
            const nowInUserTz = toZonedTime(new Date(), timezone);
            const startOfTodayInUserTz = fromZonedTime(formatTz(nowInUserTz, 'yyyy-MM-dd', { timeZone: timezone }), timezone);

            if (!streakData) {
                // First-time user, initialize their streak data.
                streakData = {
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActivityDate: startOfTodayInUserTz,
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                };
                await updateStreakData(userId, streakData);
                return; // Exit after initializing
            }

            // --- Timezone-Aware Daily Reset Logic ---
            const lastActivityInUserTz = toZonedTime(streakData.lastActivityDate, timezone);
            const todayFormatted = formatTz(nowInUserTz, 'yyyy-MM-dd', { timeZone: timezone });
            const lastDayFormatted = formatTz(lastActivityInUserTz, 'yyyy-MM-dd', { timeZone: timezone });

            // If the last recorded activity was not today, we need to perform daily reset checks.
            if (todayFormatted !== lastDayFormatted) {
                const yesterdayInUserTz = new Date(nowInUserTz.setDate(nowInUserTz.getDate() - 1));
                const yesterdayFormatted = formatTz(yesterdayInUserTz, 'yyyy-MM-dd', { timeZone: timezone });

                const updatePayload: Partial<StreakData> = {
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                };
                
                // If the last activity was NOT yesterday, the streak is broken.
                if (lastDayFormatted !== yesterdayFormatted) {
                    updatePayload.currentStreak = 0;
                }
                
                await updateStreakData(userId, updatePayload);
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
                lastUpdateRef.current = new Date();
                return;
            }

            const nowUtc = new Date();
            const elapsedSeconds = (nowUtc.getTime() - (lastUpdateRef.current?.getTime() || nowUtc.getTime())) / 1000;
            lastUpdateRef.current = nowUtc;

            const streakData = await getStreakData(user.uid);
            if (!streakData) return;
            
            const timeToday = streakData.timeSpentToday || 0;
            const streakCompletedToday = streakData.todayStreakCompleted || false;
            
            // If streak is already done for today, just update the activity time and exit.
            if(streakCompletedToday) {
                await updateStreakData(user.uid, { lastActivityDate: nowUtc });
                return;
            }

            const newTimeSpent = timeToday + elapsedSeconds;

            const updatePayload: Partial<StreakData> = {
                timeSpentToday: newTimeSpent,
                lastActivityDate: nowUtc,
            };

            // If the goal is met AND it hasn't been marked as complete for today yet
            if (newTimeSpent >= STREAK_GOAL_SECONDS && !streakCompletedToday) {
                updatePayload.todayStreakCompleted = true;
                const newStreak = (streakData.currentStreak || 0) + 1;
                updatePayload.currentStreak = newStreak;
                
                if (newStreak > (streakData.longestStreak || 0)) {
                    updatePayload.longestStreak = newStreak;
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


'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

export const useStreakTracker = () => {
    const { user } = useAuth();
    const isUpdatingRef = useRef(false);

    const incrementStreakOnRefresh = useCallback(async (userId: string) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        try {
            const streakData = await getStreakData(userId);
            const nowUtc = new Date();

            let newStreak = 1;
            let longestStreak = 1;

            if (streakData) {
                newStreak = (streakData.currentStreak || 0) + 1;
                longestStreak = Math.max(streakData.longestStreak || 0, newStreak);
            }

            const updatePayload: StreakData = {
                currentStreak: newStreak,
                longestStreak: longestStreak,
                lastActivityDate: nowUtc,
                timeSpentToday: 0, // Resetting this field as it's no longer used for logic
                todayStreakCompleted: false, // Resetting this field
            };

            await updateStreakData(userId, updatePayload);
        } catch (error) {
            console.error("Error incrementing streak on refresh:", error);
        } finally {
            isUpdatingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (user) {
            incrementStreakOnRefresh(user.uid);
        }
    }, [user, incrementStreakOnRefresh]);
};

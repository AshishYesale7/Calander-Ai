
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

export const useStreakTracker = () => {
    const { user } = useAuth();
    
    // This hook is now only responsible for a one-time increment on refresh.
    // The continuous tracking and state management is handled by StreakContext.
    const incrementStreakOnRefresh = useCallback(async (userId: string) => {
        try {
            const streakData = await getStreakData(userId);
            let newStreak = 1;
            let longestStreak = 1;
            
            if (streakData) {
                newStreak = (streakData.currentStreak || 0) + 1;
                longestStreak = Math.max(streakData.longestStreak || 0, newStreak);
            }

            const updatePayload: Partial<StreakData> = {
                currentStreak: newStreak,
                longestStreak: longestStreak,
                lastActivityDate: new Date(),
                // These fields are now managed by the StreakContext, 
                // but we can set them to reasonable defaults here.
                timeSpentToday: 0, 
                todayStreakCompleted: false,
            };

            await updateStreakData(userId, updatePayload);
        } catch (error) {
            console.error("Error incrementing streak on refresh:", error);
        }
    }, []);

    useEffect(() => {
        if (user) {
            // No-op for now. The logic is moved to StreakProvider.
            // This hook can be removed or repurposed if the "increment on refresh"
            // behavior is no longer desired.
        }
    }, [user, incrementStreakOnRefresh]);
};

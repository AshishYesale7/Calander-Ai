
'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { useTimezone } from './use-timezone';
import { toZonedTime } from 'date-fns-tz';
import { differenceInCalendarDays } from 'date-fns';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export const useStreakTracker = () => {
    const { user } = useAuth();
    const streakContext = useContext(StreakContext);

    if (!streakContext) {
        return; 
    }
    const { streakData, setStreakData } = streakContext;
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
    
    const handleInitialStreakLogic = useCallback(() => {
        if (!streakData) return;

        setStreakData(prevData => {
            if (!prevData) return null;

            const nowInUserTz = toZonedTime(new Date(), timezone);
            const lastActivityInUserTz = toZonedTime(prevData.lastActivityDate, timezone);
            const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);

            if (daysDifference > 0) {
                // It's a new day, reset daily progress.
                let updatedData: StreakData = {
                    ...prevData,
                    timeSpentToday: 0,
                    todayStreakCompleted: false,
                    lastActivityDate: new Date(),
                };
                
                // If more than one day passed, reset the streak.
                if (daysDifference > 1) {
                    updatedData.currentStreak = 0;
                }

                saveData(updatedData);
                return updatedData;
            }
            return prevData; // No change needed if it's the same day
        });
    }, [streakData, setStreakData, timezone, saveData]);

    // Effect for the one-time initial check
    useEffect(() => {
        if (user && streakData) {
            handleInitialStreakLogic();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, streakData]); // This should only run when streakData is first loaded

    // This effect handles the continuous timer
    useEffect(() => {
        if (!user || !streakData) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const tick = () => {
            setStreakData(prevData => {
                if (!prevData || prevData.todayStreakCompleted) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return prevData;
                }

                const newTimeSpent = (prevData.timeSpentToday || 0) + 1;

                if (newTimeSpent >= STREAK_GOAL_SECONDS) {
                    // Goal met for the first time today
                    const updatedData: StreakData = {
                        ...prevData,
                        timeSpentToday: newTimeSpent,
                        todayStreakCompleted: true,
                        currentStreak: (prevData.currentStreak || 0) + 1,
                        longestStreak: Math.max((prevData.currentStreak || 0) + 1, prevData.longestStreak || 0),
                        lastActivityDate: new Date(),
                    };
                    saveData(updatedData);
                    return updatedData;
                } else {
                    // Still tracking time, just update locally. We'll save on the next tick that completes the goal or on unmount.
                    return { ...prevData, timeSpentToday: newTimeSpent };
                }
            });
        };

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(tick, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [user, streakData, setStreakData, saveData]);
};

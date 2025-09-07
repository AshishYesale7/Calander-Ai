
'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StreakContext } from '@/context/StreakContext';
import { addTimeToTotal, updateStreakData } from '@/services/streakService';
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
    const timeSpentInSessionRef = useRef(0);

    if (!streakContext) {
        return;
    }
    const { streakData, setStreakData } = streakContext;

    const saveData = useCallback(async (dataToSave: Partial<StreakData>) => {
        if (!user) return;
        try {
            await updateStreakData(user.uid, dataToSave);
        } catch (error) {
            console.error("Failed to save streak data:", error);
        }
    }, [user]);

    // Effect for handling the daily rollover logic.
    useEffect(() => {
        if (!streakData || !user) return;

        const nowInUserTz = toZonedTime(new Date(), timezone);
        const lastActivityInUserTz = toZonedTime(new Date(streakData.lastActivityDate), timezone);
        const daysDifference = differenceInCalendarDays(nowInUserTz, lastActivityInUserTz);
        
        if (daysDifference > 0) {
            const yesterdayTimeSpent = streakData.timeSpentToday;
            const streakContinued = daysDifference === 1 && streakData.todayStreakCompleted;
            
            const updatedData: Partial<StreakData> = {
                timeSpentToday: 0, // Reset for the new day
                todayStreakCompleted: false,
                currentStreak: streakContinued ? streakData.currentStreak : 0,
                lastActivityDate: new Date(),
                insight: undefined,
            };

            // Add yesterday's remaining time to total before resetting
            if (yesterdayTimeSpent > 0) {
                addTimeToTotal(user.uid, yesterdayTimeSpent);
            }
            
            setStreakData(prev => ({...prev!, ...updatedData}));
            saveData(updatedData);
        }
    }, [user, streakData, setStreakData, saveData, timezone]);

    // Effect for logging activity when daily goal is completed.
    useEffect(() => {
        if (!user || !streakData) return;

        const todayStr = format(toZonedTime(new Date(), timezone), 'yyyy-MM-dd');
        const wasGoalCompletedToday = streakData.todayStreakCompleted;
        const lastCompletedDay = streakData.completedDays?.[streakData.completedDays.length - 1];

        if (wasGoalCompletedToday && lastCompletedDay !== todayStr) {
            logUserActivity(user.uid, 'task_completed', { title: "Daily Streak Goal" });
            const completedDaysSet = new Set(streakData.completedDays || []);
            completedDaysSet.add(todayStr);
            const updatedData = { completedDays: Array.from(completedDaysSet) };
            setStreakData(prev => ({...prev!, ...updatedData}));
            saveData(updatedData);
        }
    }, [streakData?.todayStreakCompleted, user, timezone, streakData?.completedDays, setStreakData, saveData]);


    // Main timer effect for tracking active engagement.
    useEffect(() => {
        const startTimer = () => {
            if (timerRef.current) clearInterval(timerRef.current);
            
            timerRef.current = setInterval(() => {
                timeSpentInSessionRef.current += 1;
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

                    if (newTimeSpentToday >= STREAK_GOAL_SECONDS && !wasGoalCompletedToday) {
                      const newStreak = (prevData.currentStreak || 0) + 1;
                      dataToUpdate = {
                         ...dataToUpdate,
                         todayStreakCompleted: true,
                         currentStreak: newStreak,
                         longestStreak: Math.max(newStreak, prevData.longestStreak || 0),
                      };
                    }

                    return { ...prevData, ...dataToUpdate };
                });
            }, 1000);
        };

        const stopTimerAndSave = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (user && timeSpentInSessionRef.current > 0) {
                addTimeToTotal(user.uid, timeSpentInSessionRef.current);
                timeSpentInSessionRef.current = 0; // Reset session counter
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimerAndSave();
            } else {
               startTimer();
            }
        };
        
        if (user && streakData && !document.hidden) {
            startTimer();
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        
        return () => {
            stopTimerAndSave(); 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, streakData, saveData, setStreakData]);
};

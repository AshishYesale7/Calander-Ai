
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useStreak } from '@/context/StreakContext';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, toDate } from 'date-fns';
import { generateStreakInsight } from '@/ai/flows/generate-streak-insight-flow';
import { useApiKey } from '@/hooks/use-api-key';
import { getLeaderboardData, updateStreakData } from '@/services/streakService';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const DailyFlameIcon = ({ isComplete }: { isComplete: boolean }) => (
    <svg height="28px" width="28px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 388.219 388.219" xmlSpace="preserve">
        <path style={{fill: isComplete ? '#FF793B' : '#AFAFAF'}} d="M160.109,182.619c0.8,6.8-6,11.6-12,8c-22-12.8-32.8-36.4-47.2-56.8c-23.2,36.8-40.8,72.4-40.8,110.4 c0,77.2,54.8,136,132,136s136-58.8,136-136c0-96.8-101.2-113.6-100-236C187.309,37.019,148.909,101.419,160.109,182.619z"></path>
        <path style={{fill: isComplete ? '#C6490F' : '#8C8C8C'}} d="M192.109,388.219c-81.2,0-140-60.4-140-144c0-42,20.4-80,42-114.8c1.6-2.4,4-3.6,6.4-3.6 c2.8,0,5.2,1.2,6.8,3.2c3.6,4.8,6.8,10,10,15.2c10,15.6,19.6,30.4,34.8,39.2l0,0c-11.6-82.8,27.6-151.2,71.2-182 c2.4-1.6,5.6-2,8.4-0.4c2.8,1.2,4.4,4,4.4,7.2c-0.8,62,26.4,96,52.4,128.4c23.6,29.2,47.6,59.2,47.6,107.6 C336.109,326.219,274.109,388.219,192.109,388.219z M101.309,148.619c-18,29.6-33.2,61.6-33.2,95.6c0,74,52,128,124,128 c72.8,0,128-55.2,128-128c0-42.8-20.4-68-44-97.6c-24.4-30.4-51.6-64.4-55.6-122c-34.4,31.2-62,88.4-52.4,156.8l0,0 c0.8,6.4-2,12.4-7.2,15.6c-5.2,3.2-11.6,3.2-16.8,0c-18.4-10.8-29.2-28-40-44.4C102.909,151.419,102.109,150.219,101.309,148.619z"></path>
        <path style={{fill: isComplete ? '#FF793B' : '#AFAFAF'}} d="M278.109,304.219c14-21.6,22-47.6,22-76"></path>
        <path style={{fill: isComplete ? '#C6490F' : '#8C8C8C'}} d="M278.109,312.219c-1.6,0-3.2-0.4-4.4-1.2c-3.6-2.4-4.8-7.2-2.4-11.2c13.6-20.8,20.8-45.6,20.8-71.6 c0-4.4,3.6-8,8-8s8,3.6,8,8c0,29.2-8,56.8-23.2,80.4C283.309,311.019,280.909,312.219,278.109,312.219z"></path>
        <path style={{fill: isComplete ? '#FF793B' : '#AFAFAF'}} d="M253.709,332.219c2.8-2.4,6-5.2,8.4-8"></path>
        <path style={{fill: isComplete ? '#C6490F' : '#8C8C8C'}} d="M253.709,340.219c-2.4,0-4.4-0.8-6-2.8c-2.8-3.2-2.4-8.4,0.8-11.2c2.4-2.4,5.6-4.8,7.6-7.2 c2.8-3.2,8-3.6,11.2-0.8c3.2,2.8,3.6,8,0.8,11.2c-2.8,3.2-6.4,6.4-9.2,8.8C257.309,339.419,255.709,340.219,253.709,340.219z"></path>
    </svg>
);

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export default function DailyStreakCard() {
    const { user } = useAuth();
    const { streakData, setStreakData, isLoading } = useStreak();
    const { apiKey } = useApiKey();
    const [isInsightLoading, setIsInsightLoading] = useState(false);

    const fetchAndSetInsight = useCallback(async () => {
        if (!user || !streakData) return;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const lastInsightDate = streakData.lastActivityDate ? format(toDate(streakData.lastActivityDate), 'yyyy-MM-dd') : null;
        
        const needsNewInsight = !streakData.insight || 
                                todayStr !== lastInsightDate || 
                                (streakData.todayStreakCompleted && !streakData.insight?.includes(`${streakData.currentStreak} day`));
        
        if (!needsNewInsight) {
            return;
        }

        setIsInsightLoading(true);
        try {
            const leaderboard = await getLeaderboardData();
            const userRankData = leaderboard.find(u => u.id === user.uid);
            
            const result = await generateStreakInsight({
                currentStreak: streakData.currentStreak,
                longestStreak: streakData.longestStreak,
                rank: userRankData ? leaderboard.indexOf(userRankData) + 1 : undefined,
                totalUsers: leaderboard.length,
            });
            
            const updatedData = { ...streakData, insight: result.insight };
            setStreakData(updatedData);
            await updateStreakData(user.uid, { insight: result.insight });

        } catch (error) {
            console.error("Failed to fetch streak insight:", error);
        } finally {
            setIsInsightLoading(false);
        }
    }, [user, streakData, apiKey, setStreakData]);

    useEffect(() => {
        if (streakData && !isLoading) {
            fetchAndSetInsight();
        }
    }, [streakData, isLoading, fetchAndSetInsight]);
    

    const weekDays = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, []);

    const weekDaysWithStatus = useMemo(() => {
        const completedDaysSet = new Set(streakData?.completedDays || []);
        return weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            return {
                dayChar: format(day, 'E').charAt(0),
                isCompleted: completedDaysSet.has(dayStr),
            };
        });
    }, [weekDays, streakData]);
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const progressPercent = useMemo(() => {
        if (!streakData) return 0;
        return Math.min(100, (streakData.timeSpentToday / STREAK_GOAL_SECONDS) * 100);
    }, [streakData]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full p-6">
                    <Skeleton className="h-48 w-full" />
                </div>
            )
        }
        
        if (!streakData) {
             return <p className="text-center text-white/70 p-6">Start a session to track your streak!</p>;
        }

        return (
            <div className="relative p-6 text-white w-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0
                  border-l-[10px] border-l-transparent
                  border-b-[10px] border-b-amber-600
                  border-r-[10px] border-r-transparent"
                />

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold">
                            {streakData.currentStreak} day streak
                        </h3>
                        <div className="text-white/80 text-sm mt-1 h-5">
                          {isInsightLoading && !streakData.insight ? (
                              <LoadingSpinner size="sm" className="text-white/80"/>
                          ) : (
                              <p className="animate-in fade-in duration-500">{streakData.insight}</p>
                          )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-black/25 rounded-xl space-y-4">
                    <div className="flex justify-around">
                        {weekDaysWithStatus.map(({ dayChar, isCompleted }, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                                <span className="text-sm font-semibold text-white/70">{dayChar}</span>
                                <div className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                                )}>
                                    <DailyFlameIcon isComplete={isCompleted} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <div className="relative h-2 w-full bg-gray-600/50 rounded-full">
                            <div
                                className="absolute top-0 left-0 h-full bg-amber-400 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 rounded-full bg-white border-2 border-amber-400"></div>
                            </div>
                        </div>
                        <p className="text-xs text-center text-amber-200 mt-2 font-mono">
                            {formatTime(streakData.timeSpentToday || 0)} / {formatTime(STREAK_GOAL_SECONDS)} min
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card className="bg-amber-600 border-amber-700 shadow-lg">
            <CardContent className="p-0">
                {renderContent()}
            </CardContent>
        </Card>
    );
}

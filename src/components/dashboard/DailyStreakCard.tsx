
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

const TrophyFlameIcon = ({ isComplete, className }: { isComplete: boolean, className?: string }) => (
    <div className={cn("relative", className)}>
        <svg 
            className={cn(!isComplete && 'filter grayscale', "w-full h-full")} 
            version="1.1" 
            id="Layer_1" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 512 512" 
            xmlSpace="preserve"
        >
            <path style={{fill: '#971D2E'}} d="M34.595,462.184c0,27.51,22.307,49.816,49.816,49.816h343.178v-33.211L34.595,462.184z"></path>
            <path style={{fill: '#BE2428'}} d="M427.589,412.368v66.422H84.411c-27.51,0-49.816-7.439-49.816-16.605 c0-27.51,22.307-49.816,49.816-49.816H427.589z"></path>
            <path style={{fill: '#FFD46E'}} d="M427.589,412.368V512c27.51,0,49.816-22.307,49.816-49.816 C477.405,434.674,455.099,412.368,427.589,412.368z"></path>
            <path style={{fill: '#FFE9B7'}} d="M427.589,412.368c9.166,0,16.605,22.307,16.605,49.816c0,27.51-7.439,49.816-16.605,49.816 c-27.51,0-49.816-22.307-49.816-49.816C377.773,434.674,400.08,412.368,427.589,412.368z"></path>
            <path style={{fill: '#EC5123'}} d="M401.939,205.099L353.562,60.355l-18,11.037l-77.99,340.964 c84.876-0.841,153.412-69.898,153.412-154.973C410.984,239.04,407.796,221.439,401.939,205.099z"></path>
            <path style={{fill: '#F27524'}} d="M370.666,205.099c4.594,16.34,7.107,33.941,7.107,52.285c0,84.931-53.669,153.899-120.201,154.973 c-0.52,0.011-1.052,0.011-1.572,0.011c-85.595,0-154.984-69.388-154.984-154.984c0-18.343,3.188-35.945,9.044-52.285l48.377-144.744 l37.772,23.17L256,8.303l59.791,75.222l19.771-12.133L370.666,205.099z"></path>
            <path style={{fill: '#FFD46E'}} d="M325.488,202.475L256,115.053v230.893c48.831,0,88.562-39.731,88.562-88.562 C344.562,237.192,337.953,218.195,325.488,202.475z"></path>
            <path style={{fill: '#FFE9B7'}} d="M299.429,202.475c7.793,15.72,11.923,34.716,11.923,54.909c0,48.831-24.831,88.562-55.351,88.562 c-48.831,0-88.562-39.731-88.562-88.562c0-20.192,6.609-39.189,19.118-54.953L256,115.053L299.429,202.475z"></path>
            <g> <circle style={{fill: '#EC5123'}} cx="444.195" cy="257.384" r="8.303"></circle> <circle style={{fill: '#EC5123'}} cx="315.791" cy="131.371" r="8.303"></circle> </g>
            <g> <circle style={{fill: '#F27524'}} cx="158.438" cy="8.303" r="8.303"></circle> <circle style={{fill: '#F27524'}} cx="67.805" cy="257.384" r="8.303"></circle> <circle style={{fill: '#F27524'}} cx="67.805" cy="224.173" r="8.303"></circle> </g>
            <g> <circle style={{fill: '#FFD46E'}} cx="256" cy="224.173" r="8.303"></circle> <circle style={{fill: '#FFD46E'}} cx="289.211" cy="257.384" r="8.303"></circle> </g>
        </svg>
    </div>
);


const STREAK_GOAL_SECONDS = 300; // 5 minutes

export default function DailyStreakCard() {
    const { user } = useAuth();
    const { streakData, setStreakData, isLoading } = useStreak();
    const { apiKey } = useApiKey();
    const [isInsightLoading, setIsInsightLoading] = useState(false);

    const fetchAndSetInsight = useCallback(async () => {
        if (!user || !streakData) return;
        
        const todayStr = format(new Date(), 'dd-MM-yyyy');
        const lastInsightDate = streakData.insight?.date;
        const insightText = streakData.insight?.text;
        
        const needsNewInsight = !insightText || 
                                todayStr !== lastInsightDate ||
                                (streakData.todayStreakCompleted && streakData.insight?.lastUpdatedStreak !== streakData.currentStreak);

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
            
            const newInsight = {
                text: result.insight,
                date: todayStr,
                lastUpdatedStreak: streakData.currentStreak
            };

            const updatedData = { ...streakData, insight: newInsight };
            setStreakData(updatedData);
            await updateStreakData(user.uid, { insight: newInsight });

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
            const dayStr = format(day, 'dd-MM-yyyy');
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
             <div className="relative p-6 text-white w-full overflow-hidden">
                <TrophyFlameIcon isComplete={streakData.todayStreakCompleted} className="absolute -top-6 -right-6 w-28 h-28 opacity-20 transform rotate-12" />
                
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold">
                            {streakData.currentStreak} day streak
                        </h3>
                        <div className="text-white/80 text-sm mt-1 h-5">
                          {isInsightLoading && !streakData.insight?.text ? (
                              <LoadingSpinner size="sm" className="text-white/80"/>
                          ) : (
                              <p className="animate-in fade-in duration-500">{streakData.insight?.text}</p>
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
                                    <TrophyFlameIcon isComplete={isCompleted} className="w-full h-full" />
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

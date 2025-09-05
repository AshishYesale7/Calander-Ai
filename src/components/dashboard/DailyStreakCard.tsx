
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStreak } from '@/context/StreakContext';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { format, startOfWeek, getDay, isSameDay, addDays } from 'date-fns';
import { generateStreakInsight } from '@/ai/flows/generate-streak-insight-flow';
import { useApiKey } from '@/hooks/use-api-key';
import { getLeaderboardData } from '@/services/streakService';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const FlameIcon = ({ isComplete }: { isComplete: boolean }) => (
    <svg width="48" height="48" viewBox="0 0 512 512" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg">
        <path style={{fill: isComplete ? '#971D2E' : '#4A4A4A'}} d="M34.595,462.184c0,27.51,22.307,49.816,49.816,49.816h343.178v-33.211L34.595,462.184z"></path>
        <path style={{fill: isComplete ? '#BE2428' : '#6B6B6B'}} d="M427.589,412.368v66.422H84.411c-27.51,0-49.816-7.439-49.816-16.605 c0-27.51,22.307-49.816,49.816-49.816H427.589z"></path>
        <path style={{fill: isComplete ? '#FFD46E' : '#D1D1D1'}} d="M427.589,412.368V512c27.51,0,49.816-22.307,49.816-49.816 C477.405,434.674,455.099,412.368,427.589,412.368z"></path>
        <path style={{fill: isComplete ? '#FFE9B7' : '#EAEAEA'}} d="M427.589,412.368c9.166,0,16.605,22.307,16.605,49.816c0,27.51-7.439,49.816-16.605,49.816 c-27.51,0-49.816-22.307-49.816-49.816C377.773,434.674,400.08,412.368,427.589,412.368z"></path>
        <path style={{fill: isComplete ? '#EC5123' : '#8C8C8C'}} d="M401.939,205.099L353.562,60.355l-18,11.037l-77.99,340.964 c84.876-0.841,153.412-69.898,153.412-154.973C410.984,239.04,407.796,221.439,401.939,205.099z"></path>
        <path style={{fill: isComplete ? '#F27524' : '#AFAFAF'}} d="M370.666,205.099c4.594,16.34,7.107,33.941,7.107,52.285c0,84.931-53.669,153.899-120.201,154.973 c-0.52,0.011-1.052,0.011-1.572,0.011c-85.595,0-154.984-69.388-154.984-154.984c0-18.343,3.188-35.945,9.044-52.285l48.377-144.744 l37.772,23.17L256,8.303l59.791,75.222l19.771-12.133L370.666,205.099z"></path>
        <path style={{fill: isComplete ? '#FFD46E' : '#D1D1D1'}} d="M325.488,202.475L256,115.053v230.893c48.831,0,88.562-39.731,88.562-88.562 C344.562,237.192,337.953,218.195,325.488,202.475z"></path>
        <path style={{fill: isComplete ? '#FFE9B7' : '#EAEAEA'}} d="M299.429,202.475c7.793,15.72,11.923,34.716,11.923,54.909c0,48.831-24.831,88.562-55.351,88.562 c-48.831,0-88.562-39.731-88.562-88.562c0-20.192,6.609-39.189,19.118-54.953L256,115.053L299.429,202.475z"></path>
        <g>
            <circle style={{fill: isComplete ? '#EC5123' : '#8C8C8C'}} cx="444.195" cy="257.384" r="8.303"></circle>
            <circle style={{fill: isComplete ? '#EC5123' : '#8C8C8C'}} cx="315.791" cy="131.371" r="8.303"></circle>
        </g>
        <g>
            <circle style={{fill: isComplete ? '#F27524' : '#AFAFAF'}} cx="158.438" cy="8.303" r="8.303"></circle>
            <circle style={{fill: isComplete ? '#F27524' : '#AFAFAF'}} cx="67.805" cy="257.384" r="8.303"></circle>
            <circle style={{fill: isComplete ? '#F27524' : '#AFAFAF'}} cx="67.805" cy="224.173" r="8.303"></circle>
        </g>
        <g>
            <circle style={{fill: isComplete ? '#FFD46E' : '#D1D1D1'}} cx="256" cy="224.173" r="8.303"></circle>
            <circle style={{fill: isComplete ? '#FFD46E' : '#D1D1D1'}} cx="289.211" cy="257.384" r="8.303"></circle>
        </g>
    </svg>
)

export default function DailyStreakCard() {
    const { user } = useAuth();
    const { streakData, isLoading } = useStreak();
    const { apiKey } = useApiKey();
    const [insight, setInsight] = useState<string | null>(null);
    const [isInsightLoading, setIsInsightLoading] = useState(false);

    useEffect(() => {
        const fetchInsight = async () => {
            if (!user || !streakData) return;

            setIsInsightLoading(true);
            try {
                const leaderboard = await getLeaderboardData();
                const userRankData = leaderboard.find(u => u.id === user.uid);
                
                const result = await generateStreakInsight({
                    currentStreak: streakData.currentStreak,
                    longestStreak: streakData.longestStreak,
                    rank: userRankData ? leaderboard.indexOf(userRankData) + 1 : undefined,
                    totalUsers: leaderboard.length,
                    apiKey
                });
                setInsight(result.insight);
            } catch (error) {
                console.error("Failed to fetch streak insight:", error);
                setInsight("Keep up the great work! Consistency is key."); // Fallback
            } finally {
                setIsInsightLoading(false);
            }
        };

        if (streakData && !isLoading) {
            fetchInsight();
        }
    }, [user, streakData, apiKey, isLoading]);


    // Memoize the calculation of the current week's days
    const weekDays = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday as start of the week
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, []);

    const weekDaysWithStatus = useMemo(() => {
        const now = new Date();
        return weekDays.map((day) => {
            // A simple mock: for this design, we mark the current day as "completed"
            // and past days as not completed to show progress through the week.
            const isCompleted = isSameDay(day, now);
            return {
                dayChar: format(day, 'E').charAt(0),
                isCompleted: isCompleted,
                isToday: isSameDay(day, now)
            };
        });
    }, [weekDays]);

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
                {/* Pointer at the top */}
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
                          {isInsightLoading ? (
                              <LoadingSpinner size="sm" className="text-white/80"/>
                          ) : (
                              <p className="animate-in fade-in duration-500">{insight}</p>
                          )}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <FlameIcon isComplete={streakData.todayStreakCompleted} />
                    </div>
                </div>

                <div className="mt-6 p-4 bg-black/25 rounded-xl">
                    <div className="flex justify-around">
                        {weekDaysWithStatus.map(({ dayChar, isCompleted }, index) => (
                            <div key={index} className="flex flex-col items-center gap-2">
                                <span className="text-sm font-semibold text-white/70">{dayChar}</span>
                                <div className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center transition-all",
                                    isCompleted ? "bg-amber-500" : "bg-white/20"
                                )}>
                                    {isCompleted && <Check className="h-5 w-5 text-white" />}
                                </div>
                            </div>
                        ))}
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

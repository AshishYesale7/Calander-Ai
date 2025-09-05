
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useStreak } from '@/context/StreakContext';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { format, startOfWeek, getDay, isSameDay, addDays } from 'date-fns';
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

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export default function DailyStreakCard() {
    const { user } = useAuth();
    const { streakData, setStreakData, isLoading } = useStreak();
    const { apiKey } = useApiKey();
    const [isInsightLoading, setIsInsightLoading] = useState(false);

    const fetchAndSetInsight = useCallback(async () => {
        if (!user || !streakData) return;
        
        // Prevent fetching insight if one already exists for the day
        if (streakData.insight && streakData.lastActivityDate && isSameDay(new Date(), streakData.lastActivityDate) && !streakData.todayStreakCompleted) {
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
                apiKey
            });
            
            setStreakData(prev => prev ? { ...prev, insight: result.insight } : null);
            await updateStreakData(user.uid, { insight: result.insight });

        } catch (error) {
            console.error("Failed to fetch streak insight:", error);
            // Fallback is handled inside the flow now
            const fallbackInsight = "Keep up the great work!";
            setStreakData(prev => prev ? { ...prev, insight: fallbackInsight } : null);
            await updateStreakData(user.uid, { insight: fallbackInsight });
        } finally {
            setIsInsightLoading(false);
        }
    }, [user, streakData, apiKey, setStreakData]);

    useEffect(() => {
        if (streakData && !isLoading && !streakData.insight) {
            fetchAndSetInsight();
        }
    }, [streakData, isLoading, fetchAndSetInsight]);
    
    useEffect(() => {
        if (streakData?.todayStreakCompleted) {
            if (streakData.insight?.includes(`${streakData.currentStreak} day`)) {
                return;
            }
            fetchAndSetInsight();
        }
    }, [streakData?.todayStreakCompleted, streakData?.currentStreak, streakData?.insight, fetchAndSetInsight]);


    const weekDays = useMemo(() => {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, []);

    const weekDaysWithStatus = useMemo(() => {
        const now = new Date();
        return weekDays.map((day) => {
            const isToday = isSameDay(day, now);
            const isCompleted = isToday ? streakData?.todayStreakCompleted ?? false : day < now;
            return {
                dayChar: format(day, 'E').charAt(0),
                isCompleted,
                isToday,
            };
        });
    }, [weekDays, streakData]);
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    <div className="flex-shrink-0">
                        <FlameIcon isComplete={streakData.todayStreakCompleted} />
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
                        <div className="relative h-2 w-full bg-gray-500/50 rounded-full">
                            <div 
                                className="absolute h-2 bg-white rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-white shadow border-2 border-amber-600"></div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-white/70 mt-2">
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

    
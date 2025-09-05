
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStreak } from '@/context/StreakContext';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

const STREAK_GOAL_SECONDS = 300; // 5 minutes

export default function DailyStreakCard() {
    const { user } = useAuth();
    const { streakData, isLoading } = useStreak();

    const progressPercentage = streakData
        ? Math.min(100, (streakData.timeSpentToday / STREAK_GOAL_SECONDS) * 100)
        : 0;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-8 w-24" />
                             <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            )
        }
        
        if (!streakData) {
             return <p className="text-center text-muted-foreground">Start a session to track your streak!</p>;
        }

        const isCompleted = streakData.todayStreakCompleted;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500",
                        isCompleted ? 'bg-orange-400/20' : 'bg-muted'
                    )}>
                        <Flame className={cn(
                            "h-10 w-10 transition-colors duration-500",
                            isCompleted ? 'text-orange-400' : 'text-muted-foreground'
                        )} />
                    </div>
                    <div>
                        <p className="text-4xl font-bold">{streakData.currentStreak}</p>
                        <p className="text-muted-foreground -mt-1">Day Streak</p>
                    </div>
                </div>
                <div>
                     <p className="text-sm text-muted-foreground mb-1">
                        {isCompleted ? "Today's streak complete. Well done!" : "Spend 5 minutes today to complete your streak."}
                    </p>
                    <Progress value={progressPercentage} className={cn("[&>div]:bg-orange-400", isCompleted && "[&>div]:bg-green-500")}/>
                </div>
            </div>
        );
    }

    return (
        <Card className="frosted-glass">
            <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">Daily Streak</CardTitle>
                <CardDescription>Stay consistent, stay sharp.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}

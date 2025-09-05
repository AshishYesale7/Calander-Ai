
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Droplet } from "lucide-react";

interface DailyStreakCardProps {
    currentStreak: number;
}

export default function DailyStreakCard({ currentStreak }: DailyStreakCardProps) {
    // Let's make the target dynamic and reasonable. E.g. next multiple of 5 or 10.
    const targetStreak = Math.max(10, Math.ceil((currentStreak + 1) / 5) * 5); 
    const progress = (currentStreak / targetStreak) * 100;

    return (
        <Card className="frosted-glass bg-card/60 p-6">
            <CardHeader className="p-0 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Daily Streak</CardTitle>
                    <CardDescription className="text-sm mt-1">Solve {targetStreak} problems to hit your next goal!</CardDescription>
                </div>
                 <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Droplet className="h-6 w-6 text-cyan-400" />
                </div>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{currentStreak}</span>
                    <span className="text-lg text-muted-foreground">of {targetStreak}</span>
                </div>
                <Progress value={progress} className="mt-2 h-2 bg-muted/50 [&>div]:bg-cyan-400" />
            </CardContent>
        </Card>
    );
}

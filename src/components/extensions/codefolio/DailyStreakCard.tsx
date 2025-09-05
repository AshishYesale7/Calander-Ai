
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Droplet } from "lucide-react";

interface DailyStreakCardProps {
    currentStreak: number;
}

export default function DailyStreakCard({ currentStreak }: DailyStreakCardProps) {
    const targetStreak = Math.max(20, Math.ceil((currentStreak + 1) / 10) * 10); // Target is next multiple of 10, or 20
    const progress = (currentStreak / targetStreak) * 100;

    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Daily Streak</CardTitle>
                     <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Droplet className="h-5 w-5 text-cyan-400" />
                    </div>
                </div>
                <CardDescription>Solve 20 Problems</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{currentStreak}</span>
                    <span className="text-lg text-muted-foreground">of {targetStreak}</span>
                </div>
                <Progress value={progress} className="mt-2 h-2 bg-muted/50 [&>div]:bg-cyan-400" />
            </CardContent>
        </Card>
    );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const progress = [true, true, true, false, false, false, false];

export default function WeeklyTargetCard() {
    const achieved = progress.filter(Boolean).length;
    const total = weekDays.length;

    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Weekly Target</CardTitle>
                    <Badge variant="secondary">{achieved}/{total} Achieved</Badge>
                </div>
                <CardDescription>9 Sept - 15 Sept</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    {weekDays.map((day, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                           <div className="relative h-10 w-10">
                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="hsl(var(--muted) / 0.5)"
                                        strokeWidth="3"
                                    />
                                    {progress[index] && (
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="hsl(var(--accent))"
                                            strokeWidth="3"
                                            strokeDasharray="100, 100"
                                            className="animate-in fade-in duration-500"
                                        />
                                    )}
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{day}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

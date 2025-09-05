
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// Mock data for demonstration. In a real app, this would come from user's activity.
const progress = [true, true, true, false, false, false, false]; 

export default function WeeklyTargetCard() {
    const achieved = progress.filter(Boolean).length;
    const total = weekDays.length;

    return (
        <Card className="frosted-glass bg-card/60 p-6">
            <CardHeader className="p-0 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Weekly Target</CardTitle>
                    <CardDescription className="text-sm mt-1">1 Sept - 7 Sept</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50">
                    {achieved}/{total} Achieved
                </Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <div className="flex justify-between items-center">
                    {weekDays.map((day, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                           <div className={cn(
                               "relative h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 flex items-center justify-center transition-colors duration-300",
                               progress[index] ? "bg-accent/80 border-accent" : "bg-muted/50 border-border"
                           )}>
                                {progress[index] && (
                                    <div className="absolute inset-0 rounded-full bg-background/30 animate-in fade-in zoom-in-50"></div>
                                )}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{day}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

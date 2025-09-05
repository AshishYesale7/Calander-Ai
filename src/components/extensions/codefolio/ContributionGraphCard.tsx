
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, subMonths, getDay, isSameDay, startOfDay, endOfMonth } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { getUserActivity, type ActivityLog } from "@/services/activityLogService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const ContributionGraphCard = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { startDate, endDate } = useMemo(() => {
        const today = startOfDay(new Date());
        const start = startOfWeek(startOfDay(subMonths(today, 3)), { weekStartsOn: 1 }); // Start on Monday
        const end = endOfMonth(today);
        return { startDate: start, endDate: end };
    }, []);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserActivity(user.uid, startDate, endDate)
                .then(setActivity)
                .catch(err => console.error("Failed to fetch user activity", err))
                .finally(() => setIsLoading(false));
        }
    }, [user, startDate, endDate]);

    const contributions = useMemo(() => {
        const map = new Map<string, number>();
        activity.forEach(log => {
            const dateString = format(startOfDay(log.timestamp), 'yyyy-MM-dd');
            map.set(dateString, (map.get(dateString) || 0) + 1);
        });
        return map;
    }, [activity]);
    
    const { daysInGrid, monthLabels } = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const padding = (getDay(startDate) + 6) % 7; // Monday is 0
        
        const gridDays = [...Array(padding).fill(null), ...days];

        const labels: { name: string, colStart: number }[] = [];
        let lastMonth = -1;
        
        gridDays.forEach((day, index) => {
            if (day) {
                const month = day.getMonth();
                if (month !== lastMonth) {
                    const colIndex = Math.floor(index / 7);
                    if (colIndex > 0) { // Only add label if it's not the very first column
                        labels.push({
                            name: format(day, 'MMM'),
                            colStart: colIndex + 1,
                        });
                    }
                    lastMonth = month;
                }
            }
        });
        
        return { daysInGrid: gridDays, monthLabels: labels };
    }, [startDate, endDate]);
    
    const { currentStreak, totalContributions } = useMemo(() => {
        if (activity.length === 0) return { currentStreak: 0, totalContributions: 0 };
    
        const contributionDates = new Set(
            activity.map(log => format(startOfDay(log.timestamp), 'yyyy-MM-dd'))
        );
        const total = contributionDates.size;
    
        let streak = 0;
        let currentDate = startOfDay(new Date());
        
        if (!contributionDates.has(format(currentDate, 'yyyy-MM-dd'))) {
            currentDate = startOfDay(new Date(currentDate.setDate(currentDate.getDate() - 1)));
        }

        while (contributionDates.has(format(currentDate, 'yyyy-MM-dd'))) {
            streak++;
            currentDate = startOfDay(new Date(currentDate.setDate(currentDate.getDate() - 1)));
        }
    
        return { currentStreak: streak, totalContributions: total };
    }, [activity]);

    const getLevelColor = (level: number) => {
        if (level >= 4) return 'bg-cyan-500/90';
        if (level === 3) return 'bg-cyan-500/70';
        if (level === 2) return 'bg-cyan-500/50';
        if (level === 1) return 'bg-cyan-500/30';
        return 'bg-muted/30 border border-white/5';
    };

    return (
        <Card className="frosted-glass bg-card/60 p-6">
            <CardHeader className="p-0 flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Droplet className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold">Contribution Graph</CardTitle>
                        <CardDescription className="text-sm mt-1">{totalContributions} contributions in the last 4 months</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="bg-background/80">{currentStreak} Day{currentStreak === 1 ? '' : 's'} streak</Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                {isLoading ? (
                    <div className="h-32 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <TooltipProvider>
                    <div className="grid grid-cols-[auto,1fr] gap-x-3">
                        <div className="flex flex-col gap-[9px] text-xs text-muted-foreground justify-around mt-[25px]">
                           <span>Mon</span>
                           <span>Wed</span>
                           <span>Fri</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="grid grid-flow-col gap-x-2.5 pl-px mb-1">
                                {monthLabels.map((month) => (
                                   <div 
                                       key={month.name} 
                                       className="text-xs text-muted-foreground"
                                       style={{ gridColumnStart: month.colStart }}
                                    >
                                       {month.name}
                                   </div>
                               ))}
                            </div>
                            <div className="grid grid-flow-col grid-rows-7 gap-1 w-full">
                               {daysInGrid.map((day, i) => {
                                    if (!day) return <div key={`pad-${i}`} className="w-full aspect-square" />

                                    const dateString = format(day, 'yyyy-MM-dd');
                                    const level = contributions.get(dateString) || 0;
                                    return (
                                       <Tooltip key={i} delayDuration={100}>
                                           <TooltipTrigger asChild>
                                               <div className={cn("w-full aspect-square rounded-[2px]", getLevelColor(level))} />
                                           </TooltipTrigger>
                                           <TooltipContent className="p-2">
                                               <p className="text-sm font-semibold">{level} contribution{level !== 1 && 's'} on</p>
                                               <p className="text-sm text-muted-foreground">{format(day, 'EEEE, MMM d, yyyy')}</p>
                                           </TooltipContent>
                                       </Tooltip>
                                    )
                               })}
                           </div>
                        </div>
                    </div>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    );
};

export default ContributionGraphCard;



'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, getDay, isSameDay, startOfDay, endOfDay, subYears, getISOWeek, getMonth } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { getUserActivity, type ActivityLog } from "@/services/activityLogService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";


const ContributionGraphCard = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // We want to show the last full year of activity up to today.
    const { startDate, endDate } = useMemo(() => {
        const today = endOfDay(new Date());
        const start = startOfWeek(subYears(today, 1), { weekStartsOn: 1 }); // Start on a Monday
        return { startDate: start, endDate: today };
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
    
    const { columns, monthLabels } = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const cols: Date[][] = [];
        
        if (days.length > 0) {
            let week: Date[] = Array(7).fill(null);
            // Adjust for the first week if it doesn't start on Monday (day 1)
            const firstDayIndex = (getDay(days[0]) + 6) % 7; // Monday is 0
            for(let i = 0; i < firstDayIndex; i++) {
                week[i] = null as any;
            }

            days.forEach(day => {
                const dayIndex = (getDay(day) + 6) % 7; // Monday is 0
                week[dayIndex] = day;
                if (dayIndex === 6) { // Sunday, end of the week
                    cols.push(week);
                    week = Array(7).fill(null);
                }
            });
            // Push the last, possibly incomplete week
            if (week.some(d => d !== null)) {
                cols.push(week);
            }
        }

        const labels: { key: string; name: string, colStart: number }[] = [];
        let lastMonth = -1;
        
        cols.forEach((week, colIndex) => {
            const firstDayOfMonth = week.find(day => day && day.getDate() === 1);
            if (firstDayOfMonth) {
                const month = getMonth(firstDayOfMonth);
                if (month !== lastMonth) {
                     labels.push({
                        key: format(firstDayOfMonth, 'MMM-yyyy'),
                        name: format(firstDayOfMonth, 'MMM'),
                        colStart: colIndex + 1,
                    });
                    lastMonth = month;
                }
            } else {
                 // Fallback for months starting mid-week
                const firstValidDay = week.find(d => d);
                if(firstValidDay) {
                    const month = getMonth(firstValidDay);
                    if (month !== lastMonth && !labels.some(l => l.name === format(firstValidDay, 'MMM'))) {
                         labels.push({
                            key: format(firstValidDay, 'MMM-yyyy'),
                            name: format(firstValidDay, 'MMM'),
                            colStart: colIndex + 1,
                        });
                        lastMonth = month;
                    }
                }
            }
        });
        
        return { columns: cols, monthLabels: labels };
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
                        <CardDescription className="text-sm mt-1">{totalContributions} contributions in the last year</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="bg-background/80">{currentStreak} Day{currentStreak === 1 ? '' : 's'} streak</Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                {isLoading ? (
                    <div className="h-36 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <TooltipProvider>
                    <div className="flex gap-x-3">
                        <div className="flex flex-col gap-[9px] text-xs text-muted-foreground justify-around pt-8">
                           <span>Mon</span>
                           <span>Wed</span>
                           <span>Fri</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             <div className="grid grid-flow-col gap-x-2.5 pl-px mb-1" style={{ gridTemplateColumns: `repeat(${columns.length}, 12px)` }}>
                                {monthLabels.map((month) => (
                                    <div 
                                        key={month.key} 
                                        className="text-xs text-muted-foreground text-left"
                                        style={{ gridColumnStart: month.colStart }}
                                    >
                                        {month.name}
                                    </div>
                                ))}
                            </div>
                            <ScrollArea className="w-full" style={{ ['--scrollbar-size' as any]: '8px' }}>
                                <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                                {columns.map((week, weekIndex) => (
                                    week.map((day, dayIndex) => {
                                        if (!day) return <div key={`pad-${weekIndex}-${dayIndex}`} className="w-2.5 h-2.5" />;
                                        const dateString = format(day, 'yyyy-MM-dd');
                                        const level = contributions.get(dateString) || 0;
                                        return (
                                            <Tooltip key={dateString} delayDuration={100}>
                                                <TooltipTrigger asChild>
                                                    <div className={cn("w-2.5 h-2.5 rounded-[1px]", getLevelColor(level))} />
                                                </TooltipTrigger>
                                                <TooltipContent className="p-2">
                                                    <p className="text-sm font-semibold">{level} contribution{level !== 1 && 's'} on</p>
                                                    <p className="text-sm text-muted-foreground">{format(day, 'EEEE, MMM d, yyyy')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })
                                ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    );
};

export default ContributionGraphCard;

    
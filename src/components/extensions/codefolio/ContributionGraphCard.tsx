
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, getDay, isSameDay, startOfDay, endOfDay, subYears, getMonth } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { getUserActivity, type ActivityLog } from "@/services/activityLogService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";


const ContributionGraphCard = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
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
    
    const { weeks, monthLabels } = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks: Date[][] = [];
        
        // Group days into weeks, starting on Monday
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        const labels: { name: string; weekIndex: number }[] = [];
        let lastMonth = -1;
        
        weeks.forEach((week, weekIndex) => {
            const firstDayOfMonth = week.find(day => {
                const month = getMonth(day);
                if (month !== lastMonth && getDay(day) >= 1 && getDay(day) <= 3) {
                     // Only add label if month changes near start of week
                    lastMonth = month;
                    return true;
                }
                 if(day.getDate() === 1) {
                    lastMonth = getMonth(day);
                    return true;
                }
                return false;
            });

            if (firstDayOfMonth) {
                const monthName = format(firstDayOfMonth, 'MMM');
                if(!labels.some(l => l.name === monthName && weekIndex < l.weekIndex + 4)) {
                     labels.push({
                        name: monthName,
                        weekIndex: weekIndex,
                    });
                }
            }
        });
        
        return { weeks, monthLabels };
    }, [startDate, endDate]);
    
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [isLoading, weeks]);


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
        return 'bg-muted/30 border border-black/10';
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
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-y-2 text-xs text-muted-foreground pt-8 shrink-0">
                           <span>Mon</span>
                           <span className="mt-[6px]">Wed</span>
                           <span className="mt-[6px]">Fri</span>
                        </div>
                        <div className="w-full overflow-hidden">
                             <div ref={scrollContainerRef} className="overflow-x-auto pb-2" style={{ ['scrollbarWidth' as any]: 'thin' }}>
                                <div className="relative">
                                     <div className="grid grid-flow-col auto-cols-[16px] gap-x-1 mb-1 h-6">
                                        {monthLabels.map((month) => (
                                            <div 
                                                key={month.name + month.weekIndex}
                                                className="text-xs text-muted-foreground text-left"
                                                style={{ gridColumnStart: month.weekIndex + 1 }}
                                            >
                                                {month.name}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-flow-col auto-cols-[12px] gap-1 w-max">
                                    {weeks.map((week, weekIndex) => (
                                        <div key={weekIndex} className="grid grid-rows-7 gap-1">
                                            {week.map((day) => {
                                                if (!day) return <div key={`pad-${weekIndex}`} className="w-3 h-3" />;
                                                const dateString = format(day, 'yyyy-MM-dd');
                                                const level = contributions.get(dateString) || 0;
                                                return (
                                                    <Tooltip key={dateString} delayDuration={100}>
                                                        <TooltipTrigger asChild>
                                                            <div className={cn("w-3 h-3 rounded-[2px]", getLevelColor(level))} />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="p-2">
                                                            <p className="text-sm font-semibold">{level} contribution{level !== 1 && 's'} on</p>
                                                            <p className="text-sm text-muted-foreground">{format(day, 'EEEE, MMM d, yyyy')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    </div>
                                </div>
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


'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, getDay, isSameDay, startOfDay, endOfDay, subYears, getMonth, endOfMonth } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { getUserActivity, type ActivityLog } from "@/services/activityLogService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ContributionGraphCard = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const { startDate, endDate } = useMemo(() => {
        const today = endOfDay(new Date());
        const start = startOfWeek(subYears(today, 1), { weekStartsOn: 1 }); 
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
    
    const { weeks, monthLabels, monthSeparators } = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const weeks: Date[][] = [];
        
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }

        const monthLabels: { name: string; weekIndex: number }[] = [];
        const monthSeparators: number[] = [];
        let lastMonth = -1;
        
        weeks.forEach((week, weekIndex) => {
            const firstDayOfWeek = week[0];
            const month = getMonth(firstDayOfWeek);
            
            if (month !== lastMonth) {
                const monthChangesInWeek = week.some(day => getMonth(day) !== lastMonth && lastMonth !== -1);
                if (weekIndex === 0 || getMonth(week[0]) !== lastMonth) {
                    lastMonth = month;
                    const monthName = format(firstDayOfWeek, 'MMM');
                     if (!monthLabels.find(m => m.weekIndex > weekIndex - 4 && m.name === monthName)) {
                        monthLabels.push({ name: monthName, weekIndex });
                    }
                }
                if (weekIndex > 0) {
                    monthSeparators.push(weekIndex);
                }
            }
        });
        
        return { weeks, monthLabels, monthSeparators };
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
        return 'bg-muted/30 border border-white/10';
    };

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
                    <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <TooltipProvider>
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-y-1 text-xs text-muted-foreground pt-8 shrink-0">
                           {weekDays.map(day => <div key={day} className="h-5 flex items-center">{day}</div>)}
                        </div>
                        <div className="w-full overflow-hidden">
                             <div ref={scrollContainerRef} className="overflow-x-auto pb-2" style={{ ['scrollbarWidth' as any]: 'thin' }}>
                                <div className="relative">
                                     <div className="grid grid-flow-col auto-cols-[20px] gap-x-1 mb-1 h-6">
                                        {monthLabels.map((month) => (
                                            <div 
                                                key={`${month.name}-${month.weekIndex}`}
                                                className="text-xs text-muted-foreground text-left"
                                                style={{ gridColumnStart: month.weekIndex + 1 }}
                                            >
                                                {month.name}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-flow-col auto-cols-[20px] gap-1 w-max">
                                    {weeks.map((week, weekIndex) => (
                                        <div key={weekIndex} className="contents">
                                            <div className="grid grid-rows-7 gap-1">
                                                {week.map((day, dayIndex) => {
                                                    if (!day) return <div key={`pad-${weekIndex}-${dayIndex}`} className="w-5 h-5" />;
                                                    const dateString = format(day, 'yyyy-MM-dd');
                                                    const level = contributions.get(dateString) || 0;
                                                    return (
                                                        <Tooltip key={dateString} delayDuration={100}>
                                                            <TooltipTrigger asChild>
                                                                <div className={cn("w-5 h-5 rounded-[2px] flex items-center justify-center", getLevelColor(level))}>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="p-2">
                                                                <p className="text-sm font-semibold">{level} contribution{level !== 1 && 's'} on</p>
                                                                <p className="text-sm text-muted-foreground">{format(day, 'EEEE, MMM d, yyyy')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                             {monthSeparators.includes(weekIndex) && (
                                                <div className="w-px bg-border/20 mx-1"></div>
                                            )}
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

    

    
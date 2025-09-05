
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, getDay, isSameDay, startOfDay, endOfDay, subYears, getMonth, lastDayOfMonth } from 'date-fns';
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
        const start = startOfDay(subYears(today, 1));
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
    
    const { dayGrid, monthLabels } = useMemo(() => {
        const firstDay = startOfWeek(startDate, { weekStartsOn: 1 });
        const allDays = eachDayOfInterval({ start: firstDay, end: endDate });

        const dayGrid: (Date | null)[][] = [];
        const monthLabels: { name: string; weekIndex: number }[] = [];
        
        let currentMonth = -1;
        let weekIndex = 0;

        allDays.forEach((day) => {
            const dayOfWeek = (getDay(day) + 6) % 7; // Monday is 0
            const month = getMonth(day);

            if (dayOfWeek === 0) {
                dayGrid.push(new Array(7).fill(null));
                if(dayGrid.length > 1) weekIndex++;
            }
            
            if (month !== currentMonth) {
                currentMonth = month;
                monthLabels.push({ name: format(day, 'MMM'), weekIndex: dayGrid.length -1 });
            }
            
            if (!dayGrid[dayGrid.length -1]) {
                 dayGrid[dayGrid.length -1] = new Array(7).fill(null);
            }
            dayGrid[dayGrid.length - 1][dayOfWeek] = day;
        });

        return { dayGrid, monthLabels };

    }, [startDate, endDate]);
    
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [isLoading, dayGrid]);


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
        return 'bg-muted/30';
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
                    <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <TooltipProvider>
                    <div className="flex gap-2">
                        <div className="flex flex-col text-xs text-muted-foreground shrink-0 pt-7">
                           <div className="h-5">Mon</div>
                           <div className="h-5">Tue</div>
                           <div className="h-5">Wed</div>
                           <div className="h-5">Thu</div>
                           <div className="h-5">Fri</div>
                           <div className="h-5">Sat</div>
                           <div className="h-5">Sun</div>
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
                                    <div className="grid grid-flow-col auto-cols-min gap-x-1 w-max">
                                    {dayGrid.map((week, weekIndex) => {
                                        const isMonthEnd = week.some(day => day && isSameDay(day, lastDayOfMonth(day)));
                                        return (
                                            <React.Fragment key={weekIndex}>
                                                <div className="grid grid-rows-7 gap-1 w-[20px]">
                                                    {week.map((day, dayIndex) => {
                                                        if (!day) {
                                                          return <div key={`${weekIndex}-${dayIndex}`} className="w-5 h-5" />;
                                                        }
                                                        const dateString = format(day, 'yyyy-MM-dd');
                                                        const level = contributions.get(dateString) || 0;
                                                        return (
                                                            <Tooltip key={dateString} delayDuration={100}>
                                                                <TooltipTrigger asChild>
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded-[2px] flex items-center justify-center border border-white/10", 
                                                                        getLevelColor(level)
                                                                    )}>
                                                                        <span className="text-[9px] text-white/50">{format(day, 'd')}</span>
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
                                                {isMonthEnd && <div className="w-[1px] h-full bg-border/50 mx-1" />}
                                            </React.Fragment>
                                        )
                                    })}
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

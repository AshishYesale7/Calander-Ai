
'use client';
import React, { useMemo, useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, getDay, isSameDay, startOfDay, endOfDay, subYears } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { getUserActivity, type ActivityLog } from "@/services/activityLogService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStreak } from "@/context/StreakContext";

const ContributionGraphCard = () => {
    const { user } = useAuth();
    const { streakData, isLoading: isStreakLoading } = useStreak();
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isActivityLoading, setIsActivityLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const { startDate, endDate } = useMemo(() => {
        const today = endOfDay(new Date());
        const start = startOfDay(subYears(today, 1));
        return { startDate: start, endDate: today };
    }, []);

    useEffect(() => {
        if (user) {
            setIsActivityLoading(true);
            getUserActivity(user.uid, startDate, endDate)
                .then(setActivity)
                .catch(err => console.error("Failed to fetch user activity", err))
                .finally(() => setIsActivityLoading(false));
        }
    }, [user, startDate, endDate]);

    const contributions = useMemo(() => {
        const map = new Map<string, number>();
        activity.forEach(log => {
            const dateString = format(startOfDay(new Date(log.timestamp)), 'yyyy-MM-dd');
            map.set(dateString, (map.get(dateString) || 0) + 1);
        });
        return map;
    }, [activity]);
    
    const { weeks, monthLabels } = useMemo(() => {
        const weeks: (Date | null)[][] = [];
        const monthLabels: { name: string; weekIndex: number }[] = [];
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        
        if (days.length === 0) {
            return { weeks: [], monthLabels: [] };
        }

        let currentWeek: (Date | null)[] = new Array(7).fill(null);
        let currentMonth = -1;

        days.forEach((day) => {
            const dayOfWeek = (getDay(day) + 6) % 7; // Monday is 0
            const month = day.getMonth();

            if (month !== currentMonth) {
                currentMonth = month;
                if (dayOfWeek > 0 && currentWeek.some(d => d !== null)) {
                    weeks.push(currentWeek);
                    currentWeek = new Array(7).fill(null);
                }
                monthLabels.push({ name: format(day, 'MMM'), weekIndex: weeks.length });
            }
            
            currentWeek[dayOfWeek] = day;

            if (dayOfWeek === 6) { 
                weeks.push(currentWeek);
                currentWeek = new Array(7).fill(null);
            }
        });

        if (currentWeek.some(d => d !== null)) {
            weeks.push(currentWeek);
        }

        return { weeks, monthLabels };
    }, [startDate, endDate]);
    
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [isActivityLoading, weeks]);


    const totalContributions = useMemo(() => {
        if (activity.length === 0) return 0;
        const contributionDates = new Set(
            activity.map(log => format(startOfDay(new Date(log.timestamp)), 'yyyy-MM-dd'))
        );
        return contributionDates.size;
    }, [activity]);

    const getLevelColor = (level: number) => {
        if (level >= 4) return 'bg-cyan-500/90';
        if (level === 3) return 'bg-cyan-500/70';
        if (level === 2) return 'bg-cyan-500/50';
        if (level === 1) return 'bg-cyan-500/30';
        return 'bg-muted/30';
    };

    return (
        <Card className="frosted-glass bg-card/60 p-4 border-0 shadow-none">
            <CardHeader className="p-0 flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Droplet className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                        <CardTitle className="text-md font-semibold">App Activity</CardTitle>
                        <CardDescription className="text-xs mt-1">{totalContributions} contributions in the last year</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="bg-background/80">
                    {isStreakLoading ? <LoadingSpinner size="sm" /> : `${streakData?.currentStreak || 0} Day Streak`}
                </Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                {isActivityLoading ? (
                    <div className="h-36 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <TooltipProvider>
                    <div className="flex gap-2">
                        <div className="w-full overflow-hidden">
                             <div ref={scrollContainerRef} className="overflow-x-auto pb-2" style={{ ['scrollbarWidth' as any]: 'thin' }}>
                                <div className="relative">
                                     <div className="grid grid-flow-col auto-cols-[16px] gap-x-1 mb-1 h-5">
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
                                    {weeks.map((week, weekIndex) => {
                                        return (
                                            <React.Fragment key={weekIndex}>
                                                <div className="grid grid-rows-7 gap-1 w-4">
                                                    {week.map((day, dayIndex) => {
                                                        if (!day) {
                                                          return <div key={`${weekIndex}-${dayIndex}`} className="w-4 h-4" />;
                                                        }
                                                        const dateString = format(day, 'yyyy-MM-dd');
                                                        const level = contributions.get(dateString) || 0;
                                                        return (
                                                            <Tooltip key={dateString} delayDuration={100}>
                                                                <TooltipTrigger asChild>
                                                                    <div className={cn(
                                                                        "w-4 h-4 rounded-[2px] flex items-center justify-center border border-white/10", 
                                                                        getLevelColor(level)
                                                                    )}>
                                                                        
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="p-2">
                                                                    <p className="text-sm font-semibold">{level} contribution{level !== 1 && 's'} on</p>
                                                                    <p className="text-sm text-muted-foreground">{format(new Date(dateString), 'EEEE, MMM d, yyyy')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </div>
                                            </React.Fragment>
                                        )
                                    })}
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="flex flex-col text-xs text-muted-foreground shrink-0 pt-6 gap-0.5">
                           <div className="h-4 flex items-center">Mon</div>
                           <div className="h-4 flex items-center">Tue</div>
                           <div className="h-4 flex items-center">Wed</div>
                           <div className="h-4 flex items-center">Thu</div>
                           <div className="h-4 flex items-center">Fri</div>
                           <div className="h-4 flex items-center">Sat</div>
                           <div className="h-4 flex items-center">Sun</div>
                        </div>
                    </div>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    );
};

export default ContributionGraphCard;

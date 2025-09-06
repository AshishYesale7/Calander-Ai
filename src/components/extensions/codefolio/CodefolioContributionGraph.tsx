
'use client';
import React, { useMemo, useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Code, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, getDay, isSameDay, startOfDay, endOfDay, subYears, getMonth, lastDayOfMonth } from 'date-fns';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CodefolioContributionGraphProps {
    contributions?: Record<string, number>;
}

const CodefolioContributionGraph = ({ contributions }: CodefolioContributionGraphProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const { startDate, endDate } = useMemo(() => {
        const today = endOfDay(new Date());
        const start = startOfDay(subYears(today, 1));
        return { startDate: start, endDate: today };
    }, []);
    
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
            const month = getMonth(day);

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
    }, [weeks]);

    const { currentStreak, totalContributions } = useMemo(() => {
        if (!contributions || Object.keys(contributions).length === 0) {
            return { currentStreak: 0, totalContributions: 0 };
        }
    
        const contributionDates = new Set(Object.keys(contributions));
        const total = Object.values(contributions).reduce((sum, count) => sum + count, 0);
    
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
    }, [contributions]);

    const getLevelColor = (level: number) => {
        if (level >= 4) return 'bg-sky-500/90';
        if (level === 3) return 'bg-sky-500/70';
        if (level === 2) return 'bg-sky-500/50';
        if (level === 1) return 'bg-sky-500/30';
        return 'bg-muted/30';
    };

    return (
        <Card className="frosted-glass bg-card/60 p-4 border-0 shadow-none">
            <CardHeader className="p-0 flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                        <Code className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                        <CardTitle className="text-md font-semibold">Coding Activity</CardTitle>
                        <CardDescription className="text-xs mt-1">{totalContributions} submissions in the last year</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="bg-background/80">{currentStreak} Day{currentStreak === 1 ? '' : 's'} streak</Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                {!contributions ? (
                    <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">No submission data available.</div>
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
                                                        const level = contributions[dateString] || 0;
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
                                                                    <p className="text-sm font-semibold">{level} submission{level !== 1 && 's'} on</p>
                                                                    <p className="text-sm text-muted-foreground">{format(day, 'EEEE, MMM d, yyyy')}</p>
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

export default CodefolioContributionGraph;

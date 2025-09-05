
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, subMonths, getDay, isSameDay, startOfDay } from 'date-fns';
import { useAuth } from "@/context/AuthContext";
import { getUserActivity, type ActivityLog } from "@/services/activityLogService";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const ContributionGraphCard = () => {
    const { user } = useAuth();
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const today = new Date();
    // Go back 4 months from the end of the current month for a full view
    const fourMonthsAgo = subMonths(today, 3);
    const startDate = startOfWeek(startOfDay(fourMonthsAgo), { weekStartsOn: 1 }); // Start on Monday

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserActivity(user.uid, startDate, today)
                .then(setActivity)
                .catch(err => console.error("Failed to fetch user activity", err))
                .finally(() => setIsLoading(false));
        }
    }, [user, startDate]);

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: today });
    }, [startDate, today]);

    const contributions = useMemo(() => {
        const map = new Map<string, number>();
        activity.forEach(log => {
            const dateString = format(startOfDay(log.timestamp), 'yyyy-MM-dd');
            map.set(dateString, (map.get(dateString) || 0) + 1);
        });
        return map;
    }, [activity]);

    const { grid, monthLabels } = useMemo(() => {
        const grid: (Date | null)[][] = Array.from({ length: 7 }, () => []);
        let currentWeek: (Date | null)[] = Array(getDay(days[0]) === 0 ? 6 : getDay(days[0]) - 1).fill(null);
        
        days.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                for(let i=0; i<7; i++) grid[i].push(currentWeek[i]);
                currentWeek = [];
            }
        });
        
        while (currentWeek.length > 0 && currentWeek.length < 7) {
            currentWeek.push(null);
        }
        if (currentWeek.length > 0) {
            for(let i=0; i<7; i++) grid[i].push(currentWeek[i]);
        }

        const labels: { name: string, colStart: number }[] = [];
        let lastMonth = -1;
        let weekIndex = 0;
        days.forEach(day => {
            if (getDay(day) === 1) weekIndex++; // New week starts on Monday
            const month = day.getMonth();
            if (month !== lastMonth && getDay(day) < 7) { // Only add label at the start of a month
                labels.push({ name: format(day, 'MMM'), colStart: weekIndex });
                lastMonth = month;
            }
        });
        
        return { grid, monthLabels: labels };
    }, [days]);
    
    const { currentStreak, totalContributions } = useMemo(() => {
        if (activity.length === 0) return { currentStreak: 0, totalContributions: 0 };
    
        const contributionDates = new Set(
            activity.map(log => format(startOfDay(log.timestamp), 'yyyy-MM-dd'))
        );
        const total = contributionDates.size;
    
        let streak = 0;
        let currentDate = startOfDay(new Date());
    
        if (contributionDates.has(format(currentDate, 'yyyy-MM-dd'))) {
            streak++;
            currentDate = startOfDay(new Date(currentDate.setDate(currentDate.getDate() - 1)));
            while (contributionDates.has(format(currentDate, 'yyyy-MM-dd'))) {
                streak++;
                currentDate = startOfDay(new Date(currentDate.setDate(currentDate.getDate() - 1)));
            }
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
                        <CardDescription className="text-sm mt-1">{totalContributions} contributions in the last 4 months</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="bg-background/80">{currentStreak} Day{currentStreak === 1 ? '' : 's'} streak</Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                {isLoading ? (
                    <div className="h-32 flex items-center justify-center"><LoadingSpinner /></div>
                ) : (
                    <div className="flex flex-col overflow-hidden">
                        <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-x-px pl-[30px] mb-1">
                           {monthLabels.map((month) => (
                               <div 
                                   key={month.name} 
                                   className="text-xs text-muted-foreground col-span-4"
                                >
                                   {month.name}
                               </div>
                           ))}
                        </div>
                         <div className="flex gap-x-2">
                             <div className="flex flex-col gap-px text-xs text-muted-foreground justify-around">
                                <span>Mon</span>
                                <span>Wed</span>
                                <span>Fri</span>
                             </div>
                             <div className="grid grid-flow-col grid-rows-7 auto-cols-auto gap-px w-full">
                                {days.map((day, i) => {
                                     const dateString = format(day, 'yyyy-MM-dd');
                                     const level = contributions.get(dateString) || 0;
                                     return (
                                         <div key={i}>
                                            <div className={cn("w-full aspect-square rounded-[2px]", getLevelColor(level))} />
                                         </div>
                                     )
                                })}
                            </div>
                         </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ContributionGraphCard;

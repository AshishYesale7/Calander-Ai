
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { eachDayOfInterval, format, startOfWeek, subMonths, getDay } from 'date-fns';

const ContributionGraphCard = () => {
    const today = new Date();
    const fourMonthsAgo = subMonths(today, 3);
    const startDate = startOfWeek(fourMonthsAgo, { weekStartsOn: 1 }); // Start on Monday

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: today });
    }, [startDate, today]);

    const contributions = useMemo(() => {
        const map = new Map<string, number>();
        days.forEach(day => {
            const dateString = format(day, 'yyyy-MM-dd');
            const shouldHaveContribution = Math.random() > 0.3; // 70% chance of contribution
            if (shouldHaveContribution) {
                map.set(dateString, Math.floor(Math.random() * 4) + 1); // Random level from 1 to 4
            } else {
                map.set(dateString, 0);
            }
        });
        return map;
    }, [days]);

    const grid = useMemo(() => {
        const grid: (Date | null)[][] = Array.from({ length: 7 }, () => []);
        let currentWeek: (Date | null)[] = Array(getDay(days[0])).fill(null);

        days.forEach(day => {
            if (currentWeek.length === 7) {
                for(let i=0; i<7; i++) grid[i].push(currentWeek[i]);
                currentWeek = [];
            }
            currentWeek.push(day);
        });
        
        while(currentWeek.length < 7) currentWeek.push(null);
        for(let i=0; i<7; i++) grid[i].push(currentWeek[i]);

        return grid;
    }, [days]);
    
    const monthLabels = useMemo(() => {
      const labels: { name: string, colStart: number }[] = [];
      let lastMonth = -1;
      let weekIndex = 0;
      days.forEach(day => {
          const month = day.getMonth();
          if (month !== lastMonth) {
              labels.push({ name: format(day, 'MMM'), colStart: weekIndex + 1 });
              lastMonth = month;
          }
          if (day.getDay() === 6) { // It's Saturday, end of a week in this view
              weekIndex++;
          }
      });
      return labels;
    }, [days]);

    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-cyan-500/30';
            case 2: return 'bg-cyan-500/50';
            case 3: return 'bg-cyan-500/70';
            case 4: return 'bg-cyan-500/90';
            default: return 'bg-muted/50';
        }
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
                        <CardDescription className="text-sm mt-1">past 4 months</CardDescription>
                    </div>
                </div>
                <Badge variant="outline" className="bg-background/80">0 Days streak</Badge>
            </CardHeader>
            <CardContent className="p-0 mt-4">
                <div className="flex flex-col">
                    <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-px">
                       {monthLabels.map((month, index) => (
                           <div 
                               key={month.name} 
                               className="text-xs text-muted-foreground"
                               style={{ gridColumnStart: month.colStart }}
                            >
                               {month.name}
                           </div>
                       ))}
                    </div>
                     <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-7 gap-px">
                        {days.map(day => {
                             const dateString = format(day, 'yyyy-MM-dd');
                             const level = contributions.get(dateString) || 0;
                             return (
                                 <div 
                                     key={dateString}
                                     className={cn("w-full aspect-square rounded-[2px]", getLevelColor(level))}
                                 />
                             )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ContributionGraphCard;

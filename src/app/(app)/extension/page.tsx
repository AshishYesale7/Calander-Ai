
'use client';

import { BarChart, LineChart, Code, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, CartesianGrid, Line, XAxis, YAxis } from 'recharts';
import type { CodingActivity, PlatformStats } from '@/types';
import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subMonths, addMonths } from 'date-fns';

const MOCK_SOLVED_PROBLEMS_DATA: { month: string; solved: number }[] = [
  { month: 'Jan', solved: 30 },
  { month: 'Feb', solved: 45 },
  { month: 'Mar', solved: 60 },
  { month: 'Apr', solved: 50 },
  { month: 'May', solved: 75 },
  { month: 'Jun', solved: 90 },
];

const MOCK_PLATFORM_STATS: PlatformStats[] = [
    { id: '1', name: 'LeetCode', username: 'code-master', problemsSolved: 150, contests: 10 },
    { id: '2', name: 'Codeforces', username: 'cf-user', problemsSolved: 200, contests: 25 },
    { id: '3', name: 'HackerRank', username: 'hr-champ', problemsSolved: 120, contests: 5 },
];

const MOCK_CODING_ACTIVITY: CodingActivity[] = Array.from({ length: 120 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
        date,
        count: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : 0,
    };
}).reverse();


const chartConfig = {
  solved: {
    label: 'Problems Solved',
    color: 'hsl(var(--accent))',
  },
};

const ContributionGraph = ({ activity }: { activity: CodingActivity[] }) => {
    const months = useMemo(() => {
        const end = new Date();
        const start = subMonths(end, 4);
        const monthStarts = [];
        let current = start;
        while(current <= end) {
            monthStarts.push(startOfMonth(current));
            current = startOfMonth(addMonths(current, 1));
        }
        return monthStarts;
    }, []);

    const activityByDate = useMemo(() => {
        return new Map(activity.map(a => [format(a.date, 'yyyy-MM-dd'), a.count]));
    }, [activity]);

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-muted/50';
        if (count <= 1) return 'bg-green-500/30';
        if (count <= 3) return 'bg-green-500/60';
        return 'bg-green-500/90';
    };

    return (
        <div className="flex justify-start gap-3 overflow-x-auto p-1">
            {months.map(monthStart => {
                 const monthEnd = endOfMonth(monthStart);
                 const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
                 const firstDayOfWeek = getDay(monthStart); // 0 (Sun) to 6 (Sat)
                 
                 return (
                    <div key={format(monthStart, 'yyyy-MM')} className="flex flex-col">
                        <div className="text-sm font-medium text-center mb-2">{format(monthStart, 'MMM')}</div>
                         <div className="grid grid-cols-7 grid-rows-6 gap-1.5">
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="w-4 h-4" />
                            ))}
                            {daysInMonth.map(day => {
                                const dayKey = format(day, 'yyyy-MM-dd');
                                const count = activityByDate.get(dayKey) || 0;
                                const isToday = isSameDay(day, new Date());
                                return (
                                    <div
                                        key={dayKey}
                                        className={`w-4 h-4 rounded-sm ${getIntensityClass(count)} ${isToday ? 'ring-2 ring-accent' : ''}`}
                                        title={`${dayKey}: ${count} contributions`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                 )
            })}
        </div>
    );
};

export default function ExtensionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
          <Code className="mr-3 h-8 w-8 text-accent" />
          Extension
        </h1>
        <p className="text-foreground/80 mt-1">
          Track your coding progress across different platforms.
        </p>
      </div>

      <Card className="frosted-glass shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              Solved Problems
            </CardTitle>
            <CardDescription>Past 6 Months</CardDescription>
          </div>
           <div className="text-right">
                <p className="text-2xl font-bold text-accent">500</p>
                <p className="text-xs text-muted-foreground">Total Solved</p>
           </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-60 w-full">
            <LineChart accessibilityLayer data={MOCK_SOLVED_PROBLEMS_DATA}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line dataKey="solved" type="monotone" stroke="var(--color-solved)" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="frosted-glass shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
           <div>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Contribution Graph
            </CardTitle>
            <CardDescription>Past 4 Months</CardDescription>
          </div>
          <div className="text-right">
                <p className="text-2xl font-bold text-accent">15</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
           </div>
        </CardHeader>
        <CardContent>
          <ContributionGraph activity={MOCK_CODING_ACTIVITY} />
        </CardContent>
      </Card>
      
       <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">Platforms</CardTitle>
          <CardDescription>Your stats from connected coding platforms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_PLATFORM_STATS.map(platform => (
            <div key={platform.id} className="flex items-center justify-between p-3 rounded-md bg-background/50 border">
              <div>
                <p className="font-semibold">{platform.name}</p>
                <p className="text-sm text-muted-foreground">{platform.username}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-primary">{platform.problemsSolved}</p>
                <p className="text-xs text-muted-foreground">Problems</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}

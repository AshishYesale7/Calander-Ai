
'use client';
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { Contest } from "@/ai/flows/fetch-coding-stats-flow";
import { startOfDay } from 'date-fns';

interface ContestCalendarProps {
    contests?: Contest[];
}

export default function ContestCalendar({ contests = [] }: ContestCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    
    const contestDays = useMemo(() => {
        return contests.map(c => startOfDay(new Date(c.startTimeSeconds * 1000)));
    }, [contests]);

    return (
        <Card className="frosted-glass bg-card/60">
            <CardContent className="p-2">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                    classNames={{
                        head_cell: "w-full text-muted-foreground rounded-md text-xs font-normal",
                        cell: "w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        day_today: "bg-accent/20 text-accent-foreground",
                        day_hidden: "invisible",
                    }}
                    modifiers={{
                        contests: contestDays,
                    }}
                    modifiersStyles={{
                        contests: {
                            position: 'relative',
                            color: 'hsl(var(--accent))'
                        },
                    }}
                    components={{
                        DayContent: ({ date, ...props }) => {
                            const dayStart = startOfDay(date).getTime();
                            const contestCount = contestDays.filter(d => d.getTime() === dayStart).length;
                            
                            return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {contestCount > 0 ? (
                                        <div className="relative">
                                            {date.getDate()}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                {Array.from({ length: Math.min(contestCount, 3) }).map((_, i) => (
                                                    <div key={i} className="h-0.5 w-0.5 rounded-full bg-accent" />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        date.getDate()
                                    )}
                                </div>
                            );
                        },
                    }}
                />
            </CardContent>
        </Card>
    );
}


'use client';
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

export default function ContestCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    
    // In a real app, this would come from an API
    const contestDays = [
        new Date(2024, 8, 11), // Sep 11
        new Date(2024, 8, 12), // Sep 12
        new Date(2024, 8, 18),
        new Date(2024, 8, 20),
        new Date(2024, 8, 21),
    ];

    return (
        <Card className="frosted-glass bg-card/60">
            <CardContent className="p-2">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                    month={new Date(2024, 8, 1)} // September 2024
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
                            const hasContest = contestDays.some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth());
                            const contestCount = contestDays.filter(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth()).length;
                            return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {props.activeModifiers.contests ? (
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

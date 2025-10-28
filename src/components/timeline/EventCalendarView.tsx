
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, RefreshCw } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import type { DayContentRenderer } from "react-day-picker";
import { cn } from '@/lib/utils';

interface EventCalendarViewProps {
  events: TimelineEvent[];
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  onDayClick: (day: Date, hasEvents: boolean) => void;
  onSync: () => void;
  isSyncing: boolean;
}

export default function EventCalendarView({
  events: allEventsFromProps,
  month,
  onMonthChange,
  onDayClick,
  onSync,
  isSyncing,
}: EventCalendarViewProps) {
  const processedEvents = useMemo(() => {
    return allEventsFromProps
      .map(e => ({ ...e, date: e.date instanceof Date && !isNaN(e.date.valueOf()) ? e.date : parseISO(e.date as unknown as string) }))
      .filter(e => e.date instanceof Date && !isNaN(e.date.valueOf()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEventsFromProps]);

  const uniqueEventDaysForDots = useMemo(() => {
    return Array.from(new Set(processedEvents.map(event => startOfDay(event.date).toISOString()))).map(iso => parseISO(iso));
  }, [processedEvents]);

  const handleDayClickInternal = (day: Date | undefined) => {
    if (day) {
      const eventsOnDay = processedEvents.filter(event => isSameDay(startOfDay(event.date), startOfDay(day)));
      onDayClick(day, eventsOnDay.length > 0);
    }
  };

  const DayWithDotRenderer: DayContentRenderer = (dayProps) => {
    const isEventDay = uniqueEventDaysForDots.some(eventDay => isSameDay(dayProps.date, eventDay));
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{format(dayProps.date, "d")}</span>
        {isEventDay && !dayProps.outside && (
          <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full"></span>
        )}
      </div>
    );
  };

  return (
    <Card 
      className={cn("w-full h-full flex flex-col frosted-glass")}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-xl text-primary">
              Event Calendar
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onSync} disabled={isSyncing} className="h-8 w-8">
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                  <span className="sr-only">Sync with Google Calendar</span>
              </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 flex-1 overflow-auto">
        <Calendar
          mode="single"
          onSelect={(day) => handleDayClickInternal(day)}
          month={month}
          onMonthChange={onMonthChange}
          className="rounded-md w-full p-0 [&_button]:text-base"
          classNames={{
            day_today: "bg-accent text-accent-foreground ring-2 ring-accent/70",
          }}
          components={{ DayContent: DayWithDotRenderer }}
          showOutsideDays={true}
        />
      </CardContent>
    </Card>
  );
}

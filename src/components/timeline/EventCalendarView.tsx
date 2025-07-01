
'use client';

import type { TimelineEvent } from '@/types';
import { useState, useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, Clock, ExternalLink as LinkIcon, RefreshCw } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import type { DayContentRenderer } from "react-day-picker";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Note: Dialog related imports (Dialog, DialogTrigger etc.) are removed as the modal is now handled by parent.

interface EventCalendarViewProps {
  events: TimelineEvent[];
  onDeleteEvent?: (eventId: string) => void; // Kept if details are shown in parent modal, but not used here
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  onDayClick: (day: Date, hasEvents: boolean) => void; // New prop
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
  // Removed selectedDate and isModalOpen state, as day click is handled by parent
  const { toast } = useToast();

  const processedEvents = useMemo(() => {
    return allEventsFromProps
      .map(e => ({ ...e, date: e.date instanceof Date && !isNaN(e.date.valueOf()) ? e.date : parseISO(e.date as unknown as string) }))
      .filter(e => e.date instanceof Date && !isNaN(e.date.valueOf())) // Ensure valid dates
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEventsFromProps]);

  const uniqueEventDaysForDots = useMemo(() => {
    return Array.from(new Set(processedEvents.map(event => startOfDay(event.date).toISOString()))).map(iso => parseISO(iso));
  }, [processedEvents]);

  const handleDayClickInternal = (day: Date | undefined) => {
    if (day) {
      const eventsOnDay = processedEvents.filter(event => isSameDay(startOfDay(event.date), startOfDay(day)));
      onDayClick(day, eventsOnDay.length > 0); // Call parent's handler
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
    <Card className="frosted-glass w-full shadow-xl">
      <CardHeader className="p-4 border-b border-border/30">
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-2xl text-primary">
            Event Calendar
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onSync} disabled={isSyncing} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              <span className="sr-only">Sync with Google Calendar</span>
          </Button>
        </div>
         <CardDescription>
          Click on a day to see its hourly timetable. Dots indicate days with events.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <Calendar
          mode="single"
          // selected prop is removed as selection highlighting is not primary for this component anymore
          onSelect={(day) => handleDayClickInternal(day)} // onSelect now triggers the internal handler
          month={month}
          onMonthChange={onMonthChange}
          className="rounded-md w-full p-0 [&_button]:text-base"
          classNames={{
            // day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90", // Selection styling can be removed or kept if needed
            day_today: "bg-accent text-accent-foreground ring-2 ring-accent/70",
          }}
          components={{ DayContent: DayWithDotRenderer }}
          showOutsideDays={true}
        />
      </CardContent>
      {/* Modal/Dialog related to selectedDate and eventsForSelectedDay is removed. It's now handled by the parent. */}
    </Card>
  );
}

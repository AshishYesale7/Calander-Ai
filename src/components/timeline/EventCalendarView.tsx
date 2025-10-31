
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, RefreshCw, PlusCircle, Calendar as CalendarIcon, List } from 'lucide-react';
import { format, parseISO, startOfDay, isSameDay, getYear, setYear, setMonth, addYears, subYears, addDays, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import type { DayContentRenderer } from "react-day-picker";
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimelineListView from './TimelineListView';

interface EventCalendarViewProps {
  events: TimelineEvent[];
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  onDayClick: (day: Date) => void;
  onSync: () => void;
  isSyncing: boolean;
  onToggleTrash: () => void;
  onAddEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
  onEditEvent: (event: TimelineEvent) => void;
}

export default function EventCalendarView({
  events: allEventsFromProps,
  month,
  onMonthChange,
  onDayClick,
  isSyncing,
  onSync,
  onToggleTrash,
  onAddEvent,
  onDeleteEvent,
  onEditEvent,
}: EventCalendarViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [calendarView, setCalendarView] = useState<'month' | 'year' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setIsCompact(entries[0].contentRect.width < 350);
      }
    });
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, []);
  
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
      onDayClick(day);
      setSelectedDay(day);
      setCalendarView('day');
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    onMonthChange(setMonth(month, monthIndex));
    setCalendarView('month');
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (calendarView === 'year') {
        onMonthChange(direction === 'prev' ? subYears(month, 1) : addYears(month, 1));
    } else if (calendarView === 'month') {
        onMonthChange(direction === 'prev' ? subMonths(month, 1) : addMonths(month, 1));
    } else if (calendarView === 'day') {
        const newDay = direction === 'prev' ? subDays(selectedDay, 1) : addDays(selectedDay, 1);
        setSelectedDay(newDay);
        // Also update the main month view if the day crosses into a new month
        if (newDay.getMonth() !== month.getMonth() || newDay.getFullYear() !== month.getFullYear()) {
            onMonthChange(newDay);
        }
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
  
  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return processedEvents.filter(e => isSameDay(e.date, selectedDay));
  }, [processedEvents, selectedDay]);

  return (
    <Card 
      ref={cardRef}
      className={cn("w-full h-full flex flex-col frosted-glass")}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button onClick={onAddEvent} size={isCompact ? 'icon' : 'default'} className="bg-accent hover:bg-accent/90">
              <PlusCircle className={cn("h-5 w-5", !isCompact && "mr-2")} />
              {!isCompact && <span>New Event</span>}
              <span className="sr-only">Add New Event</span>
          </Button>
          <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onSync} disabled={isSyncing} className="h-9 w-9">
                  <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
                  <span className="sr-only">Sync with Google Calendar</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onToggleTrash} className="h-9 w-9">
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Open Trash</span>
              </Button>
            </div>
        </div>
        <CardTitle className="font-headline text-xl text-primary mt-4">
          Event Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 flex-1 overflow-auto">
        <Tabs defaultValue="calendar" className="relative h-full flex flex-col">
            <div className="flex justify-center">
              <TabsList className="inline-flex h-auto p-1 rounded-full bg-black/50 backdrop-blur-sm border border-border/30 w-auto">
                <TabsTrigger value="calendar" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
                  <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
                </TabsTrigger>
                <div className="w-px h-6 bg-border/50 self-center" />
                <TabsTrigger value="list" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
                  <List className="mr-2 h-4 w-4" /> List
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="mt-4 flex-1">
              <TabsContent value="calendar" className="h-full flex-1">
                  <div className="flex justify-center">
                    <Calendar
                        mode={calendarView}
                        onDayClick={handleDayClickInternal}
                        month={month}
                        onMonthChange={onMonthChange}
                        selected={selectedDay}
                        onSelect={handleDayClickInternal}
                        onMonthSelect={handleMonthSelect}
                        onYearChange={(dir) => handleNavigation(dir)}
                        onPrevClick={() => handleNavigation('prev')}
                        onNextClick={() => handleNavigation('next')}
                        onCaptionClick={() => setCalendarView(prev => prev === 'year' ? 'month' : 'year')}
                        events={eventsForSelectedDay}
                        className="p-0 [&>div]:w-full"
                        classNames={{
                          head_cell: "w-full md:w-9 text-muted-foreground rounded-md text-xs font-normal",
                          cell: "h-9 w-9 md:h-10 md:w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 md:h-10 md:w-10 p-0 font-normal aria-selected:opacity-100",
                          caption_label: "text-sm md:text-base font-medium cursor-pointer hover:text-accent transition-colors",
                          day_today: "bg-accent text-accent-foreground ring-2 ring-accent/70",
                        }}
                        components={{ DayContent: DayWithDotRenderer }}
                        showOutsideDays={true}
                    />
                  </div>
              </TabsContent>
              <TabsContent value="list" className="mt-0 h-full flex-1">
                  <TimelineListView events={processedEvents} onDeleteEvent={onDeleteEvent} onEditEvent={onEditEvent} />
              </TabsContent>
            </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

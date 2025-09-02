
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Bot, Trash2, RefreshCw, Globe } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import type { DayContentRenderer } from "react-day-picker";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { timezones } from '@/lib/timezones';
import { useTimezone } from '@/hooks/use-timezone';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventCalendarViewProps {
  events: TimelineEvent[];
  month: Date;
  onMonthChange: (newMonth: Date) => void;
  onDayClick: (day: Date, hasEvents: boolean) => void;
  onSync: () => void;
  isSyncing: boolean;
  isTrashOpen: boolean;
  onToggleTrash: () => void;
}

const TimezoneSelector = () => {
    const { timezone, setTimezone } = useTimezone();
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Select timezone">
                    <Globe className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]" align="end">
                <Command>
                    <CommandInput placeholder="Search timezone..." />
                    <CommandList>
                      <ScrollArea className="h-72">
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandGroup>
                            {timezones.map((tz) => (
                                <CommandItem
                                    key={tz}
                                    value={tz}
                                    onSelect={(currentValue) => {
                                        setTimezone(currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            timezone === tz ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tz}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                      </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function EventCalendarView({
  events: allEventsFromProps,
  month,
  onMonthChange,
  onDayClick,
  onSync,
  isSyncing,
  isTrashOpen,
  onToggleTrash,
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
    <Card className={cn(
        "frosted-glass w-full shadow-xl transition-all duration-300",
        isTrashOpen ? "rounded-r-none border-r-0" : "rounded-r-lg border-r"
    )}>
      <CardHeader className="p-4 border-b border-border/30">
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-2xl text-primary">
            Event Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onSync} disabled={isSyncing} className="h-8 w-8">
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                <span className="sr-only">Sync with Google Calendar</span>
            </Button>
            <TimezoneSelector />
            <Button variant="ghost" size="icon" onClick={onToggleTrash} className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Open Trash</span>
            </Button>
          </div>
        </div>
         <CardDescription>
          Click on a day to see its hourly timetable. Dots indicate days with events.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
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

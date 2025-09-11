
'use client';

import { useMemo, useState } from 'react';
import type { TimelineEvent } from '@/types';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  isSameDay,
  getDay,
  differenceInCalendarDays,
  startOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';

interface PlannerMonthViewProps {
  month: Date;
  events: TimelineEvent[];
  viewTheme: 'light' | 'dark';
}

interface ProcessedEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  span: number;
  row: number;
}

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return '#EF4444'; // red-500
    case 'deadline': return '#F97316'; // orange-500
    case 'application': return '#8B5CF6'; // violet-500
    case 'project': return '#3B82F6'; // blue-500
    case 'goal': return '#22C55E'; // green-500
    default: return '#6B7280'; // gray-500
  }
};

export default function PlannerMonthView({ month, events, viewTheme }: PlannerMonthViewProps) {
  const [popoverDay, setPopoverDay] = useState<Date | null>(null);

  const weekStartsOn = 0; // Sunday

  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    const endDate = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [month, weekStartsOn]);

  const weeks = useMemo(() => {
    const weekChunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weekChunks.push(days.slice(i, i + 7));
    }
    return weekChunks;
  }, [days]);

  const processedEventsByDay = useMemo(() => {
    const dayGrid: ProcessedEvent[][] = Array.from({ length: days.length }, () => []);

    const sortedEvents = [...events].sort((a, b) => {
      const diffA = differenceInCalendarDays(a.endDate || a.date, a.date);
      const diffB = differenceInCalendarDays(b.endDate || b.date, b.date);
      if (diffA !== diffB) return diffB - diffA;
      return a.date.getTime() - b.date.getTime();
    });

    for (const event of sortedEvents) {
      const eventStart = startOfDay(event.date);
      const eventEnd = startOfDay(event.endDate || event.date);

      const startIndex = days.findIndex(day => isSameDay(day, eventStart));

      if (startIndex === -1) continue;

      let startingRow = 0;
      let rowIsAvailable = false;
      while (!rowIsAvailable) {
          rowIsAvailable = true;
          for (let i = 0; i < differenceInCalendarDays(eventEnd, eventStart) + 1; i++) {
              const checkIndex = startIndex + i;
              if (checkIndex < days.length && dayGrid[checkIndex].some(e => e.row === startingRow)) {
                  rowIsAvailable = false;
                  startingRow++;
                  break;
              }
          }
      }

      const dayOfWeekStart = getDay(eventStart);
      const span = differenceInCalendarDays(eventEnd, eventStart) + 1;

      dayGrid[startIndex].push({
        id: event.id,
        title: event.title,
        start: event.date,
        end: event.endDate || event.date,
        color: event.color || getEventColor(event.type),
        span: Math.min(span, 7 - dayOfWeekStart),
        row: startingRow,
      });

      // For multi-day events that span weeks
      let remainingSpan = span - (7 - dayOfWeekStart);
      let weekOffset = 1;
      while(remainingSpan > 0) {
        const nextWeekIndex = startIndex + (7-dayOfWeekStart) + (weekOffset -1) * 7;
        if(nextWeekIndex < days.length){
            dayGrid[nextWeekIndex].push({
                 id: `${event.id}-cont-${weekOffset}`,
                title: event.title,
                start: event.date,
                end: event.endDate || event.date,
                color: event.color || getEventColor(event.type),
                span: Math.min(remainingSpan, 7),
                row: startingRow,
            });
        }
        remainingSpan -= 7;
        weekOffset++;
      }
    }
    return dayGrid;
  }, [days, events]);

  const popoverEvents = useMemo(() => {
    if (!popoverDay) return [];
    return events.filter(event => {
        const eventStart = startOfDay(event.date);
        const eventEnd = startOfDay(event.endDate || event.date);
        return popoverDay >= eventStart && popoverDay <= eventEnd;
    });
  }, [popoverDay, events]);

  const themeClasses = {
      container: viewTheme === 'dark' ? 'bg-black/30' : 'bg-gray-50',
      headerText: viewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
      gridLines: viewTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200',
      dayCell: viewTheme === 'dark' ? 'bg-gray-900/40' : 'bg-white',
      otherMonthCell: viewTheme === 'dark' ? 'bg-gray-800/20 opacity-70' : 'bg-gray-100 opacity-70',
      dayText: viewTheme === 'dark' ? 'text-white' : 'text-gray-900',
      otherMonthText: viewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
  };


  return (
    <div className={cn("p-2 rounded-lg text-xs flex-1 overflow-auto", themeClasses.container)}>
        <div className="grid grid-cols-7 text-center font-semibold">
            {weeks[0].map(day => <div key={day.toISOString()} className={cn("py-2", themeClasses.headerText)}>{format(day, 'E')}</div>)}
        </div>
        <div className={cn("grid grid-cols-7 grid-rows-5 gap-px", themeClasses.gridLines)}>
            {days.map((day, dayIndex) => (
              <Popover key={day.toISOString()} onOpenChange={(open) => {
                  if (open) setPopoverDay(day);
                  else setPopoverDay(null);
              }}>
                <PopoverTrigger asChild>
                    <div className={cn(
                        "relative min-h-[90px] p-1 flex flex-col cursor-pointer",
                        isSameMonth(day, month) ? themeClasses.dayCell : themeClasses.otherMonthCell
                    )}>
                        <span className={cn(
                            "font-semibold",
                            isSameMonth(day, month) ? themeClasses.dayText : themeClasses.otherMonthText
                        )}>
                            {format(day, 'd')}
                        </span>
                        <div className="mt-1 space-y-0.5 flex-1">
                            {processedEventsByDay[dayIndex]
                                .sort((a,b) => a.row - b.row)
                                .map(event => (
                                <div key={event.id} style={{ gridRowStart: event.row + 1, gridColumnEnd: `span ${event.span}` }}>
                                    <div
                                        className="h-5 rounded text-white text-[10px] font-semibold px-1.5 flex items-center overflow-hidden truncate"
                                        style={{ backgroundColor: event.color }}
                                    >
                                        {event.title}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-background text-foreground p-2 rounded-lg shadow-xl" side="bottom" align="start">
                    <div className="text-center font-bold text-sm mb-2">{format(popoverDay || new Date(), 'MMMM d')}</div>
                    {popoverEvents.map(event => (
                        <div key={event.id} className="text-xs mb-1">
                          <span className="font-semibold">{event.title}</span>
                            {!event.isAllDay && <p>{format(event.date, 'p')}</p>}
                        </div>
                    ))}
                    {popoverEvents.length === 0 && <p className="text-xs text-muted-foreground text-center">No events.</p>}
                </PopoverContent>
              </Popover>
            ))}
        </div>
    </div>
  );
}

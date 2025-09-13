
'use client';

import type { TimelineEvent } from '@/types';
import PlannerDayView from './PlannerDayView';
import type { MaxViewTheme } from './MaximizedPlannerView';
import { format, isSameDay, isToday, getDay, isWithinInterval, endOfWeek, startOfDay as dfnsStartOfDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Edit3, Lock, Trash2 } from 'lucide-react';
import { useMemo, useRef, useEffect, useState } from 'react';
import { calculateAllDayEventLayouts, type AllDayEventWithLayout, calculateWeeklyEventLayouts, type EventWithLayout } from './planner-utils';

const HOUR_HEIGHT_PX = 60;

const getEventColorStyle = (event: TimelineEvent) => {
    if (event.color) {
        return { '--event-color': event.color } as React.CSSProperties;
    }
    const typeColors = {
        exam: '#ef4444', // red-500
        deadline: '#f97316', // orange-500
        goal: '#22c55e', // green-500
        project: '#3b82f6', // blue-500
        application: '#8b5cf6', // violet-500
        ai_suggestion: '#14b8a6', // teal-500
        custom: '#6b7280', // gray-500
    };
    return { '--event-color': typeColors[event.type] || typeColors.custom } as React.CSSProperties;
};


interface PlannerWeeklyViewProps {
    week: Date[];
    events: TimelineEvent[];
    viewTheme: MaxViewTheme;
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
    onDeleteEvent?: (eventId: string) => void;
    ghostEvent: { date: Date; hour: number; title?: string; } | null;
}

export default function PlannerWeeklyView({
    week,
    events,
    viewTheme,
    onDrop,
    onDragOver,
    onEditEvent,
    onDeleteEvent,
    ghostEvent
}: PlannerWeeklyViewProps) {
  const [now, setNow] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const rulerClasses = viewTheme === 'dark' ? 'bg-[#1c1c1c] border-b border-gray-700/50' : 'bg-stone-50 border-b border-gray-200';
  const allDaySectionClasses = viewTheme === 'dark' ? 'bg-[#1c1c1c] border-b border-gray-700/50' : 'bg-stone-50 border-b border-gray-200';
  const dayHeaderClasses = viewTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const gridContainerClasses = viewTheme === 'dark' ? 'bg-black' : 'bg-white';
  
  const { allDayEvents, timedEventsByDay } = useMemo(() => {
    const weekStart = dfnsStartOfDay(week[0]);
    const weekEnd = endOfWeek(week[0], { weekStartsOn: 0 });
    const relevantEvents = events.filter(e => {
        if (!e.date) return false;
        const eventStart = dfnsStartOfDay(e.date);
        const eventEnd = dfnsStartOfDay(e.endDate || e.date);
        return isWithinInterval(eventStart, {start: weekStart, end: weekEnd}) || 
               isWithinInterval(eventEnd, {start: weekStart, end: weekEnd}) ||
               (eventStart < weekStart && eventEnd > weekEnd);
    });

    const allDay: TimelineEvent[] = relevantEvents.filter(e => e.isAllDay);
    const timed: TimelineEvent[][] = Array.from({ length: 7 }, () => []);

    relevantEvents.forEach(e => {
        if (e.isAllDay || !e.date) return;
        const startDayIndex = getDay(e.date);
        if (startDayIndex >= 0 && startDayIndex < 7 && isWithinInterval(e.date, { start: weekStart, end: weekEnd })) {
            timed[startDayIndex].push(e);
        }
    });
    
    return { allDayEvents: allDay, timedEventsByDay: timed };
  }, [week, events]);
  
  const allDayLayouts = useMemo(() => calculateAllDayEventLayouts(allDayEvents, week), [allDayEvents, week]);

  const weeklyLayouts = useMemo(() => {
    return timedEventsByDay.map(dayEvents => calculateWeeklyEventLayouts(dayEvents));
  }, [timedEventsByDay]);

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  };
  
    const handleGridDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!gridContainerRef.current) return;
        const rect = gridContainerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;

        const hour = Math.floor(y / HOUR_HEIGHT_PX);
        const dayIndex = Math.floor(x / (rect.width / 7));
        
        if (dayIndex >= 0 && dayIndex < 7) {
            onDragOver(e, week[dayIndex], hour);
        }
    };
    
    const handleGridDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!gridContainerRef.current) return;
        const rect = gridContainerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;

        const hour = Math.floor(y / HOUR_HEIGHT_PX);
        const dayIndex = Math.floor(x / (rect.width / 7));

        if (dayIndex >= 0 && dayIndex < 7) {
            onDrop(e, week[dayIndex], hour);
        }
    };

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000);
    const scrollTimer = setTimeout(() => {
        if (scrollContainerRef.current) {
          const nowPosition = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT_PX;
          scrollContainerRef.current.scrollTo({
            top: nowPosition - scrollContainerRef.current.offsetHeight / 2,
            behavior: 'smooth',
          });
        }
      }, 500);
    return () => {
        clearInterval(intervalId);
        clearTimeout(scrollTimer);
    };
  }, [now]);

  const currentTimeTopPosition = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);


  return (
    <div className={cn("flex flex-col flex-1 min-h-0", gridContainerClasses)}>
        <div className={cn("flex flex-shrink-0", rulerClasses)}>
            <div className="w-16 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-7">
                {week.map(day => (
                    <div key={day.toISOString()} className={cn("p-2 text-center", dayHeaderClasses)}>
                        <p className="text-xs">{format(day, 'E')}</p>
                        <p className={cn("text-xl font-semibold", isToday(day) && 'text-accent' )}>{format(day, 'd')}</p>
                    </div>
                ))}
            </div>
        </div>
         <div 
            className={cn("flex flex-shrink-0 p-1 relative", allDaySectionClasses)} 
            style={{ minHeight: `${(allDayLayouts.maxRows + 1) * 24}px`}}
            onDragOver={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const dayIndex = Math.floor((e.clientX - rect.left) / (rect.width / 7));
                const targetDate = week[dayIndex];
                if (targetDate) onDragOver(e, targetDate, -1);
            }}
            onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const dayIndex = Math.floor((e.clientX - rect.left) / (rect.width / 7));
                const targetDate = week[dayIndex];
                if (targetDate) onDrop(e, targetDate, -1);
            }}
          >
            <div className="w-16 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                All-day
            </div>
            <div className="flex-1 grid grid-cols-7 relative">
               {allDayLayouts.events.map((event) => (
                     <Popover key={event.id}>
                        <PopoverTrigger asChild>
                            <div
                                className={cn('rounded-md px-1.5 py-1 font-medium text-[10px] truncate cursor-pointer absolute bg-card')}
                                style={{
                                  ...getEventColorStyle(event),
                                  top: `${event.row * 24}px`,
                                  left: `calc(${(100 / 7) * event.startDay}% + 2px)`,
                                  width: `calc(${(100/7) * event.span}% - 4px)`,
                                  height: '22px'
                                }}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--event-color] rounded-l-md"></div>
                                <span className="pl-1.5 text-foreground">{event.title}</span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 frosted-glass text-xs" side="bottom" align="start">
                             <div className="space-y-2">
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-muted-foreground">All-day event</p>
                                {event.notes && <p className="text-xs text-foreground/80">{event.notes}</p>}
                                <div className="flex justify-end gap-1 pt-1">
                                    {onEditEvent && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent(event)}>
                                        <Edit3 className="h-3.5 w-3.5"/>
                                    </Button>
                                    )}
                                    {onDeleteEvent && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="frosted-glass">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle>
                                                <AlertDialogDescription>This action is permanent.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteClick(event.id, event.title)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                ))}
                {ghostEvent && ghostEvent.hour === -1 && (
                    <div 
                        className="absolute h-full bg-accent/30 animate-pulse rounded-md"
                        style={{
                            left: `calc(${(100 / 7) * getDay(ghostEvent.date)}%)`,
                            width: `calc(${100 / 7}%)`,
                        }}
                    ></div>
                )}
            </div>
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <div className="flex relative" style={{ height: `${24 * HOUR_HEIGHT_PX}px` }}>
                 <div className="w-16 flex-shrink-0">
                    {Array.from({ length: 24 }).map((_, i) => (
                         <div key={i} className="h-[60px] text-right pr-2 text-xs text-muted-foreground relative">
                            <div className={cn("w-full border-t", viewTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-200')}>
                                {i > 0 && <span className='relative -top-2.5'>{format(new Date(0,0,0,i), 'ha')}</span>}
                            </div>
                        </div>
                    ))}
                </div>
                 <div
                    ref={gridContainerRef}
                    onDragOver={handleGridDragOver}
                    onDrop={handleGridDrop}
                    className={cn("flex-1 grid grid-cols-7 relative h-full", viewTheme === 'dark' ? 'divide-x divide-gray-700/50' : 'divide-x divide-gray-200')}
                >
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                        <div key={dayIndex} className="relative h-full">
                             {/* The horizontal hour lines */}
                            {Array.from({ length: 24 }).map((_, hourIndex) => (
                                <div
                                key={`line-${dayIndex}-${hourIndex}`}
                                className={cn("h-[60px] border-t", viewTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-200')}
                                >
                                </div>
                            ))}
                            {/* Events for this day */}
                            {weeklyLayouts[dayIndex]?.map((event: EventWithLayout) => {
                                const isShort = event.layout.height < 40;
                                return (
                                <Popover key={event.id}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className={cn('absolute p-1.5 pl-2.5 rounded-lg font-medium text-[10px] overflow-hidden pointer-events-auto cursor-pointer shadow-md bg-card')}
                                            style={{...event.layout, ...getEventColorStyle(event)}}
                                        >
                                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--event-color] rounded-l-lg"></div>
                                           <div className="flex flex-col justify-center h-full overflow-hidden">
                                              <p className="truncate font-semibold text-foreground">{event.title}</p>
                                              {!isShort && <p className="text-muted-foreground truncate">{format(event.date, 'h:mm a')}</p>}
                                           </div>
                                        </div>
                                    </PopoverTrigger>
                                     <PopoverContent className="w-56 p-2 frosted-glass text-xs" side="right" align="start">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">{event.title}</h4>
                                            <p className="text-muted-foreground">{format(event.date, 'h:mm a')} - {event.endDate ? format(event.endDate, 'h:mm a') : ''}</p>
                                            {event.notes && <p className="text-xs text-foreground/80">{event.notes}</p>}
                                            <div className="flex justify-end gap-1 pt-1">
                                                {onEditEvent && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent(event)}>
                                                    <Edit3 className="h-3.5 w-3.5"/>
                                                </Button>
                                                )}
                                                {onDeleteEvent && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-3.5 w-3.5"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="frosted-glass">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action is permanent.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteClick(event.id, event.title)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                )
                            })}
                              {ghostEvent && getDay(ghostEvent.date) === dayIndex && ghostEvent.hour !== -1 && (
                                <div
                                    className="absolute left-1 right-1 border-2 border-dashed border-purple-500 bg-purple-900/30 p-1 rounded-md text-purple-300 opacity-90 z-50 pointer-events-none"
                                    style={{
                                    top: `${ghostEvent.hour * HOUR_HEIGHT_PX}px`,
                                    height: `${HOUR_HEIGHT_PX}px`,
                                    }}
                                >
                                    <p className="text-[10px] font-semibold truncate">{ghostEvent.title ?? 'Drop to schedule'}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Current Time Indicator */}
                    {isWithinInterval(now, {start: week[0], end: addDays(week[6], 1)}) && (
                        <div
                            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: `${currentTimeTopPosition}px` }}
                        >
                            <div 
                                className="absolute -top-1 h-3 w-3 rounded-full bg-accent border-2 border-background shadow-md"
                                style={{ left: `calc(${getDay(now) * (100/7)}% - 6px)`}}
                            ></div>
                            <div 
                                className="h-[2px] bg-accent opacity-80 shadow"
                                style={{
                                    position: 'absolute',
                                    left: `calc(${getDay(now) * (100/7)}%)`,
                                    width: `calc(${100 - getDay(now) * (100/7)}%)`,
                                }}
                            ></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

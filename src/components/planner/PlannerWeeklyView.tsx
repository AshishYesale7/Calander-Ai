
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

const getEventTypeStyleClasses = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500/80 border-red-500 text-white dark:bg-red-700/80 dark:border-red-600 dark:text-red-100';
    case 'deadline': return 'bg-yellow-500/80 border-yellow-500 text-white dark:bg-yellow-600/80 dark:border-yellow-500 dark:text-yellow-100';
    case 'goal': return 'bg-green-500/80 border-green-500 text-white dark:bg-green-700/80 dark:border-green-600 dark:text-green-100';
    case 'project': return 'bg-blue-500/80 border-blue-500 text-white dark:bg-blue-700/80 dark:border-blue-600 dark:text-blue-100';
    case 'application': return 'bg-purple-500/80 border-purple-500 text-white dark:bg-purple-700/80 dark:border-purple-600 dark:text-purple-100';
    case 'ai_suggestion': return 'bg-teal-500/80 border-teal-500 text-white dark:bg-teal-700/80 dark:border-teal-600 dark:text-teal-100';
    default: return 'bg-gray-500/80 border-gray-500 text-white dark:bg-gray-600/80 dark:border-gray-500 dark:text-gray-100';
  }
};


interface PlannerWeeklyViewProps {
    week: Date[];
    events: TimelineEvent[];
    viewTheme: MaxViewTheme;
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
    onDeleteEvent?: (eventId: string) => void;
    ghostEvent: { date: Date; hour: number } | null;
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
            onDragOver={(e) => onDragOver(e, e.currentTarget.getBoundingClientRect().x > e.clientX ? week[0] : week[Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().x) / (e.currentTarget.getBoundingClientRect().width / 7))], -1)}
            onDrop={(e) => onDrop(e, e.currentTarget.getBoundingClientRect().x > e.clientX ? week[0] : week[Math.floor((e.clientX - e.currentTarget.getBoundingClientRect().x) / (e.currentTarget.getBoundingClientRect().width / 7))], -1)}
          >
            <div className="w-16 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                All-day
            </div>
            <div className="flex-1 grid grid-cols-7 relative">
               {allDayLayouts.events.map((event) => (
                     <Popover key={event.id}>
                        <PopoverTrigger asChild>
                            <div
                                className={cn(
                                    'rounded px-1.5 py-1 font-medium text-[10px] truncate cursor-pointer absolute',
                                    getEventTypeStyleClasses(event.type),
                                )}
                                style={{
                                  top: `${event.row * 24}px`,
                                  left: `calc(${(100 / 7) * event.startDay}% + 2px)`,
                                  width: `calc(${(100/7) * event.span}% - 4px)`,
                                  height: '22px'
                                }}
                            >
                                {event.title}
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
                 <div className={cn("flex-1 grid grid-cols-7 relative h-full", viewTheme === 'dark' ? 'divide-x divide-gray-700/50' : 'divide-x divide-gray-200')}>
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                        <div key={dayIndex} className="relative h-full">
                             {/* The horizontal hour lines */}
                            {Array.from({ length: 24 }).map((_, hourIndex) => (
                                <div
                                key={`line-${dayIndex}-${hourIndex}`}
                                className={cn("h-[60px] border-t", viewTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-200')}
                                onDragOver={(e) => onDragOver(e, week[dayIndex], hourIndex)}
                                onDrop={(e) => onDrop(e, week[dayIndex], hourIndex)}
                                >
                                {ghostEvent && isSameDay(week[dayIndex], ghostEvent.date) && ghostEvent.hour === hourIndex && (
                                    <div className="h-full w-full rounded-md bg-accent/30 animate-pulse"></div>
                                )}
                                </div>
                            ))}
                            {/* Events for this day */}
                            {weeklyLayouts[dayIndex]?.map((event: EventWithLayout) => {
                                const isShort = event.layout.height < 40;
                                return (
                                <Popover key={event.id}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className={cn('absolute p-1 rounded-md font-medium m-0.5 text-[10px] overflow-hidden pointer-events-auto cursor-pointer', getEventTypeStyleClasses(event.type))}
                                            style={event.layout}
                                        >
                                            <div className='flex items-center gap-1 text-[10px]'>
                                                {event.reminder.repeat !== 'none' && <Lock size={10} className="shrink-0"/>}
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                            {!isShort && <p className={cn("opacity-80 text-[10px]")}>{format(event.date, 'h:mm a')}</p>}
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

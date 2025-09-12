
'use client';

import type { TimelineEvent } from '@/types';
import PlannerDayView from './PlannerDayView';
import type { MaxViewTheme } from './MaximizedPlannerView';
import { format, isSameDay, startOfDay as dfnsStartOfDay, getDay, isWithinInterval, endOfWeek, isToday, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Edit3, Lock, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
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

  const rulerClasses = viewTheme === 'dark' ? 'bg-black/80 border-b border-gray-700/50' : 'bg-[#fff8ed] border-b border-gray-200';
  const dayHeaderClasses = viewTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const gridContainerClasses = viewTheme === 'dark' ? 'bg-black divide-x divide-gray-700/50' : 'bg-stone-50 divide-x divide-gray-200';
  
  const { allDayEvents, timedEventsByDay } = useMemo(() => {
    const weekStart = dfnsStartOfDay(week[0]);
    const weekEnd = endOfWeek(week[0], { weekStartsOn: 0 });
    const relevantEvents = events.filter(e => {
        if (!e.date) return false;
        const eventStart = startOfDay(e.date);
        const eventEnd = startOfDay(e.endDate || e.date);
        return isWithinInterval(eventStart, {start: weekStart, end: weekEnd}) || 
               isWithinInterval(eventEnd, {start: weekStart, end: weekEnd}) ||
               (eventStart < weekStart && eventEnd > weekEnd);
    });

    const allDay: TimelineEvent[] = relevantEvents.filter(e => e.isAllDay);
    const timed: TimelineEvent[][] = Array.from({ length: 7 }, () => []);

    relevantEvents.forEach(e => {
        if (e.isAllDay) return;
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
        <div className="flex-1 overflow-y-auto">
            <div className="flex">
                <div className="w-16 flex-shrink-0">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="h-[60px] text-right pr-2 text-xs text-muted-foreground relative">
                            <span className="absolute -top-2">{format(new Date(0,0,0,i), 'ha')}</span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 relative">
                    {Array.from({ length: 24 * 7 }).map((_, i) => (
                        <div key={i} className="h-[60px] border-t border-l border-border/20"></div>
                    ))}
                    {/* Render All Day Events */}
                    <div className="absolute top-[-40px] left-0 right-0 h-[40px] grid grid-cols-7 p-1 gap-1 border-b border-border/20">
                        {allDayLayouts.map((event) => (
                             <Popover key={event.id}>
                                <PopoverTrigger asChild>
                                    <div
                                        className={cn(
                                            'rounded px-1.5 py-1 font-medium text-[10px] truncate cursor-pointer',
                                            getEventTypeStyleClasses(event.type),
                                        )}
                                        style={{ gridColumnStart: event.startDay + 1, gridColumnEnd: `span ${event.span}`, gridRow: event.row + 1 }}
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
                    </div>
                     {/* Render Timed Events */}
                    {weeklyLayouts.map((dayLayout, dayIndex) => (
                        <div key={dayIndex} className="relative" style={{ gridColumnStart: dayIndex + 1 }}>
                            {dayLayout.map((event: EventWithLayout) => {
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
                </div>
            </div>
        </div>
    </div>
  );
}

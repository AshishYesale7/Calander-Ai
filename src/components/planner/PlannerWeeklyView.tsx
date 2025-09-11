
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
import { calculateAllDayEventLayouts, type AllDayEventWithLayout, calculateWeeklyEventLayouts } from './planner-utils';
import { EventWithLayout } from './planner-utils';

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

  const rulerClasses = viewTheme === 'dark' ? 'bg-gray-900/80 border-b border-gray-700/50' : 'bg-[#fff8ed] border-b border-gray-200';
  const dayHeaderClasses = viewTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const gridContainerClasses = viewTheme === 'dark' ? 'bg-gray-800 divide-x divide-gray-700/50' : 'bg-stone-50 divide-x divide-gray-200';
  
  const { allDayEventsByDay, timedEventsByDay, allDayLayouts } = useMemo(() => {
    const weekStart = dfnsStartOfDay(week[0]);
    const weekEnd = endOfWeek(week[0], { weekStartsOn: 0 });
    const relevantEvents = events.filter(e => {
        if (!e.date) return false;
        const eventDate = dfnsStartOfDay(e.date);
        return isWithinInterval(eventDate, {start: weekStart, end: weekEnd}) || (e.endDate && isWithinInterval(startOfDay(e.endDate), {start: weekStart, end: weekEnd})) || (e.endDate && e.date < weekStart && e.endDate > weekEnd);
    });

    const allDay: TimelineEvent[] = relevantEvents.filter(e => e.isAllDay);
    const allDayLayouts = calculateAllDayEventLayouts(allDay, week);

    const allDayEventsByDay: TimelineEvent[][] = Array.from({ length: 7 }, () => []);
    const timed: TimelineEvent[][] = Array.from({ length: 7 }, () => []);

    relevantEvents.forEach(e => {
        const dayIndex = getDay(e.date);
        if (e.isAllDay) {
            // Already handled by allDayLayouts
        } else {
            if (dayIndex >= 0 && dayIndex < 7) {
                timed[dayIndex].push(e);
            }
        }
    });
    
    return { allDayEventsByDay, timedEventsByDay: timed, allDayLayouts };
  }, [week, events]);

  const weeklyLayouts = useMemo(() => {
    return timedEventsByDay.map(dayEvents => calculateWeeklyEventLayouts(dayEvents));
  }, [timedEventsByDay]);

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  };


  return (
    <div className="flex flex-col flex-1 min-h-0">
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
        <div className={cn("flex flex-col flex-1 min-h-0 overflow-hidden", gridContainerClasses)}>
            <div className={cn("p-1 space-y-1 overflow-y-auto border-b border-border/20 grid grid-cols-7 gap-1", viewTheme === 'dark' ? 'bg-gray-800/50' : 'bg-stone-100/80' )}>
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
             <div className="flex-1 grid grid-cols-7 min-h-0 overflow-hidden">
                {week.map((day, dayIndex) => (
                    <div key={day.toISOString()} className="flex flex-col border-r border-border/20 last:border-r-0">
                      <PlannerDayView
                          date={day}
                          events={timedEventsByDay[dayIndex]}
                          onEditEvent={onEditEvent}
                          onDeleteEvent={(eventId) => onDeleteEvent && onDeleteEvent(eventId)}
                          viewTheme={viewTheme}
                          onDrop={onDrop}
                          onDragOver={onDragOver}
                          ghostEvent={ghostEvent}
                      />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

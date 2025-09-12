
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { Trash2, Edit3, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { isToday as dfnsIsToday } from 'date-fns';
import { calculateEventLayouts, type EventWithLayout } from '@/components/planner/planner-utils';
import type { MaxViewTheme } from './MaximizedPlannerView';

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

interface PlannerDayViewProps {
    date: Date;
    events: TimelineEvent[];
    onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
    onDeleteEvent?: (eventId: string) => void;
    viewTheme: MaxViewTheme;
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    ghostEvent: { date: Date; hour: number } | null;
}

export default function PlannerDayView({ date, events, onEditEvent, onDeleteEvent, viewTheme, onDrop, onDragOver, ghostEvent }: PlannerDayViewProps) {
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  const eventsForDay = useMemo(() => events.filter(event => event.date instanceof Date && !isNaN(event.date.valueOf()) && isSameDay(event.date, date)), [events, date]);
  const allDayEvents = useMemo(() => eventsForDay.filter(e => e.isAllDay), [eventsForDay]);
  const timedEvents = useMemo(() => eventsForDay.filter(e => !e.isAllDay), [eventsForDay]);
  const { eventsWithLayout, maxConcurrentColumns } = useMemo(() => calculateEventLayouts(timedEvents, HOUR_HEIGHT_PX), [timedEvents]);
  
  const minEventGridWidth = useMemo(() => maxConcurrentColumns > 3 ? `${Math.max(100, maxConcurrentColumns * 90)}px` : '100%', [maxConcurrentColumns]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000);
    const timer = setTimeout(() => {
      if (dfnsIsToday(date) && scrollContainerRef.current) {
        const newTop = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);
        scrollContainerRef.current.scrollTo({ top: newTop - scrollContainerRef.current.offsetHeight / 2, behavior: 'smooth' });
      }
    }, 500);
    return () => { clearTimeout(timer); clearInterval(intervalId); };
  }, [date, now]);
  
  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  };

  const themeClasses = {
      container: viewTheme === 'dark' ? 'bg-[#101010]' : 'bg-stone-50',
      allDayArea: viewTheme === 'dark' ? 'bg-[#1c1c1c] border-b border-gray-700/50' : 'bg-stone-100/80 border-b border-gray-200',
      allDayGutter: viewTheme === 'dark' ? 'text-gray-500 border-r border-gray-700/50' : 'text-stone-400 border-r border-stone-200',
      hourGutter: viewTheme === 'dark' ? 'text-gray-500' : 'text-stone-400',
      hourLine: viewTheme === 'dark' ? 'border-gray-700/50' : 'border-stone-200',
      eventText: viewTheme === 'dark' ? 'text-white' : 'text-gray-900',
    };

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", themeClasses.container)} onDragOver={(e) => e.preventDefault()}>
        <div 
            className={cn("p-2 flex-shrink-0", themeClasses.allDayArea)}
            onDragOver={(e) => onDragOver(e, date, -1)}
            onDrop={(e) => onDrop(e, date, -1)}
        >
            <div className="flex gap-2">
                <span className="text-xs font-semibold w-16 text-center flex-shrink-0">All-day</span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                    {allDayEvents.map(event => (
                        <Popover key={event.id}>
                          <PopoverTrigger asChild>
                              <div className={cn("p-1 rounded-md text-xs cursor-pointer truncate", getEventTypeStyleClasses(event.type))} style={event.color ? { backgroundColor: event.color, borderColor: event.color } : {}}>
                                  {event.title}
                              </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 frosted-glass">
                            <p className="font-bold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{event.notes}</p>
                          </PopoverContent>
                        </Popover>
                    ))}
                     {ghostEvent && isSameDay(date, ghostEvent.date) && ghostEvent.hour === -1 && (
                        <div className="h-6 rounded-md bg-accent/30 animate-pulse col-span-full"></div>
                    )}
                </div>
            </div>
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
            <div className="flex h-full">
                <div className={cn("w-16 flex-shrink-0 text-right text-xs", themeClasses.hourGutter)}>
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={`hour-label-${i}`} className="relative" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
                            {i > 0 && <span className='relative -top-2.5 pr-2'>{format(new Date(0,0,0,i), 'ha')}</span>}
                        </div>
                    ))}
                </div>
                <div className="flex-1 relative" style={{ minWidth: minEventGridWidth }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                         <div
                            key={`hour-line-${i}`}
                            className={cn("h-[60px] border-t", themeClasses.hourLine)}
                            onDragOver={(e) => onDragOver(e, date, i)}
                            onDrop={(e) => onDrop(e, date, i)}
                         >
                             {ghostEvent && isSameDay(date, ghostEvent.date) && ghostEvent.hour === i && (
                                <div className="h-full w-full rounded-md bg-accent/30 animate-pulse"></div>
                            )}
                         </div>
                    ))}
                    {dfnsIsToday(date) && (
                        <div
                            ref={nowIndicatorRef}
                            className="absolute w-full h-0.5 bg-accent/80 z-20"
                            style={{ top: `${(now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT_PX / 60)}px` }}
                        >
                            <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent"></div>
                        </div>
                    )}
                    {eventsWithLayout.map(({ layout, ...event }) => (
                        <Popover key={event.id}>
                            <PopoverTrigger asChild>
                                <div
                                    className={cn('absolute p-1 rounded-md font-medium m-0.5 text-[10px] overflow-hidden pointer-events-auto cursor-pointer', getEventTypeStyleClasses(event.type))}
                                    style={{
                                        ...layout,
                                        backgroundColor: event.color || undefined,
                                        borderColor: event.color || undefined,
                                    }}
                                >
                                    <div className='flex items-center gap-1 text-[10px]'>
                                        {event.reminder.repeat !== 'none' && <Lock size={10} className="shrink-0"/>}
                                        <span className="truncate">{event.title}</span>
                                    </div>
                                    {layout.height > 25 && <p className={cn("opacity-80 text-[10px]")}>{format(event.date, 'h:mm a')}</p>}
                                </div>
                            </PopoverTrigger>
                             <PopoverContent className="w-64 frosted-glass" side="right" align="start">
                                 <p className="font-bold">{event.title}</p>
                                 <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                                 <div className="mt-4 flex gap-2">
                                     {onEditEvent && <Button size="sm" variant="outline" onClick={() => onEditEvent(event)}><Edit3 className="h-4 w-4 mr-2"/>Edit</Button>}
                                     {onDeleteEvent && event.isDeletable && (
                                         <AlertDialog>
                                             <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2"/>Delete</Button></AlertDialogTrigger>
                                             <AlertDialogContent className="frosted-glass">
                                                 <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                 <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteClick(event.id, event.title)} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
                                             </AlertDialogContent>
                                         </AlertDialog>
                                     )}
                                 </div>
                             </PopoverContent>
                        </Popover>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

    
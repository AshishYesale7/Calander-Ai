
'use client';

import type { TimelineEvent, RawGoogleTask } from '@/types';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import { Bot, Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
import { Checkbox } from '../ui/checkbox';
import { logUserActivity } from '@/services/activityLogService';
import { useAuth } from '@/context/AuthContext';
import { isToday as dfnsIsToday } from 'date-fns';
import { calculateEventLayouts } from '@/components/planner/planner-utils';
import type { MaxViewTheme } from './DayTimetableView';

const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90;

const renderHours = (viewTheme: MaxViewTheme) => {
    const hours = [];
    const hourClasses = viewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    for (let i = 0; i < 24; i++) {
        const time = format(new Date(0, 0, 0, i), 'ha');
        hours.push(
            <div key={`hour-${i}`} className="relative h-[60px] text-right pr-2">
                <span className={cn("relative -top-2 text-xs", hourClasses)}>{time}</span>
            </div>
        );
    }
    return hours;
};

const renderHourLines = (viewTheme: MaxViewTheme) => {
    const lines = [];
    const lineClasses = viewTheme === 'dark' ? 'border-gray-700/70' : 'border-gray-300';
    for (let i = 0; i < 24; i++) {
        lines.push(
            <div key={`line-${i}`} className={cn("h-[60px] border-t", lineClasses)}></div>
        );
    }
    return lines;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  const eventsForDay = useMemo(() => events.filter(event => event.date instanceof Date && !isNaN(event.date.valueOf()) && isSameDay(event.date, date)), [events, date]);
  const allDayEvents = useMemo(() => eventsForDay.filter(e => e.isAllDay), [eventsForDay]);
  const timedEvents = useMemo(() => eventsForDay.filter(e => !e.isAllDay), [eventsForDay]);
  const { eventsWithLayout, maxConcurrentColumns } = useMemo(() => calculateEventLayouts(timedEvents), [timedEvents]);
  
  const minEventGridWidth = useMemo(() => maxConcurrentColumns > 3 ? `${Math.max(100, maxConcurrentColumns * MIN_EVENT_COLUMN_WIDTH_PX)}px` : '100%', [maxConcurrentColumns]);

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
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };

  const mainAreaClasses = viewTheme === 'dark' ? 'bg-gray-800' : 'bg-stone-50';
  const hoursColumnClasses = viewTheme === 'dark' ? 'bg-gray-900/80 border-r border-gray-700/50' : 'bg-[#fff8ed] border-r border-gray-200';
  const allDayAreaClasses = viewTheme === 'dark' ? 'bg-gray-800/50 border-b border-gray-700/50' : 'bg-stone-100/80 border-b border-gray-200';
  const eventCardClasses = viewTheme === 'dark' ? 'bg-gray-700/50 border-gray-600/80 text-gray-100' : 'bg-white/80 border-gray-300/80 text-gray-800';

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", mainAreaClasses)} onDragOver={(e) => e.preventDefault()}>
        <div 
            className={cn("p-2 flex-shrink-0", allDayAreaClasses)}
            onDragOver={(e) => onDragOver(e, date, -1)}
            onDrop={(e) => onDrop(e, date, -1)}
        >
            <div className="flex gap-2">
                <span className="text-xs font-semibold w-16 text-center">All-day</span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                    {allDayEvents.map(event => (
                        <Popover key={event.id}>
                          <PopoverTrigger asChild>
                              <div className={cn("p-1 rounded-md text-xs cursor-pointer truncate", eventCardClasses)} style={event.color ? { backgroundColor: event.color, borderColor: event.color } : {}}>
                                  {event.title}
                              </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 frosted-glass">
                            <p className="font-bold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{event.notes}</p>
                          </PopoverContent>
                        </Popover>
                    ))}
                </div>
            </div>
            {ghostEvent && ghostEvent.hour === -1 && (
                <div className="h-6 mt-1 rounded-md bg-accent/30 animate-pulse"></div>
            )}
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
            <div className="flex h-full">
                <div className={cn("w-16 flex-shrink-0 text-right text-xs", hoursColumnClasses)}>
                    {renderHours(viewTheme)}
                </div>
                <div className="flex-1 relative" style={{ minWidth: minEventGridWidth }}>
                    {renderHourLines(viewTheme)}
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
                                    className={cn("absolute p-2 rounded-lg cursor-pointer overflow-hidden", eventCardClasses)}
                                    style={{
                                        ...layout,
                                        backgroundColor: event.color || undefined,
                                        borderColor: event.color || undefined,
                                    }}
                                >
                                    <p className="font-bold text-sm leading-tight truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground leading-tight truncate">{event.notes}</p>
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
                    {Array.from({ length: 24 }).map((_, hour) => (
                        <div 
                            key={`dropzone-${hour}`}
                            className="absolute w-full"
                            style={{ top: `${hour * HOUR_HEIGHT_PX}px`, height: `${HOUR_HEIGHT_PX}px` }}
                            onDragOver={(e) => onDragOver(e, date, hour)}
                            onDrop={(e) => onDrop(e, date, hour)}
                        >
                            {ghostEvent && ghostEvent.hour === hour && (
                                <div className="h-full w-full rounded-md bg-accent/30 animate-pulse"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

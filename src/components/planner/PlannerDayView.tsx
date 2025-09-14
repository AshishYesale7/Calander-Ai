
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


interface PlannerDayViewProps {
    date: Date;
    events: TimelineEvent[];
    onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
    onDeleteEvent?: (eventId: string, eventTitle: string) => void;
    viewTheme: MaxViewTheme;
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void;
    ghostEvent: { date: Date; hour: number; title?: string; } | null;
}

export default function PlannerDayView({ date, events, onEditEvent, onDeleteEvent, viewTheme, onDrop, onDragOver, ghostEvent }: PlannerDayViewProps) {
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
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
      onDeleteEvent(eventId, eventTitle);
    }
  };

  const handleGridDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!gridContainerRef.current) return;
    const rect = gridContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.floor(y / HOUR_HEIGHT_PX);
    onDragOver(e, date, hour);
  };
    
  const handleGridDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!gridContainerRef.current) return;
    const rect = gridContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.floor(y / HOUR_HEIGHT_PX);
    onDrop(e, date, hour);
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
                                <div className={cn("relative p-1.5 pl-2.5 rounded-lg text-xs cursor-pointer truncate bg-card shadow-md")} style={getEventColorStyle(event)}>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--event-color] rounded-l-lg"></div>
                                    <span className="pl-1 text-foreground">{event.title}</span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 frosted-glass">
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
                <div 
                  ref={gridContainerRef}
                  onDragOver={handleGridDragOver}
                  onDrop={handleGridDrop}
                  className="flex-1 relative" 
                  style={{ minWidth: minEventGridWidth }}
                >
                    {Array.from({ length: 24 }).map((_, i) => (
                         <div
                            key={`hour-line-${i}`}
                            className={cn("h-[60px] border-t", themeClasses.hourLine)}
                         >
                         </div>
                    ))}
                    {dfnsIsToday(date) && (
                        <div
                            ref={nowIndicatorRef}
                            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: `${(now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT_PX / 60)}px` }}
                        >
                            <div className="h-[3px] w-full bg-purple-500 opacity-80 shadow-lg"></div>
                        </div>
                    )}
                    {eventsWithLayout.map(({ layout, ...event }) => (
                        <Popover key={event.id}>
                            <PopoverTrigger asChild>
                                <div
                                    className={cn('absolute p-1.5 pl-2.5 rounded-lg font-medium text-[11px] overflow-hidden pointer-events-auto cursor-pointer shadow-md bg-card')}
                                    style={{...layout, ...getEventColorStyle(event)}}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--event-color] rounded-l-lg"></div>
                                    <div className='flex items-center gap-1.5 h-full'>
                                        <div className="flex flex-col justify-center flex-grow overflow-hidden">
                                            <span className="truncate font-semibold text-foreground">{event.title}</span>
                                            {layout.height > 25 && <p className="text-muted-foreground truncate">{format(event.date, 'h:mm a')}</p>}
                                        </div>
                                    </div>
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
                     {ghostEvent && isSameDay(date, ghostEvent.date) && ghostEvent.hour !== -1 && (
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
            </div>
        </div>
    </div>
  );
}

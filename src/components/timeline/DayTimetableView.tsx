
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isSameDay, startOfDay as dfnsStartOfDay } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, Palette, Maximize } from 'lucide-react';
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
import EventOverviewPanel from './EventOverviewPanel';
import { Checkbox } from '../ui/checkbox';
import { logUserActivity } from '@/services/activityLogService';
import { useAuth } from '@/context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { isToday as dfnsIsToday } from 'date-fns';
import MaximizedPlannerView from '../planner/MaximizedPlannerView';
import { calculateEventLayouts } from '../planner/planner-utils';


const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90;
const minuteRulerHeightClass = 'h-8';

type TimetableViewTheme = 'default' | 'professional' | 'wood';

const renderHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        const time = format(new Date(0, 0, 0, i), 'ha');
        hours.push(
            <div key={`hour-${i}`} className="relative h-[60px] text-right pr-2">
                <span className="relative -top-2 text-xs text-muted-foreground">{time}</span>
            </div>
        );
    }
    return hours;
};

const renderHourLines = () => {
    const lines = [];
    for (let i = 0; i < 24; i++) {
        lines.push(
            <div key={`line-${i}`} className="h-[60px] border-t border-border/30"></div>
        );
    }
    return lines;
};

interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

export default function DayTimetableView({ date, events, onClose, onDeleteEvent, onEditEvent, onEventStatusChange }: DayTimetableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewTheme, setViewTheme] = useState<TimetableViewTheme>('default');

  const eventsForDay = useMemo(() => events.filter(event => isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(date))), [events, date]);
  const allDayEvents = useMemo(() => eventsForDay.filter(e => e.isAllDay), [eventsForDay]);
  const timedEvents = useMemo(() => eventsForDay.filter(e => !e.isAllDay), [eventsForDay]);
  const { eventsWithLayout: timedEventsWithLayout, maxConcurrentColumns } = useMemo(() => calculateEventLayouts(timedEvents), [timedEvents]);
  
  const minEventGridWidth = useMemo(() => maxConcurrentColumns > 3 ? `${Math.max(100, maxConcurrentColumns * MIN_EVENT_COLUMN_WIDTH_PX)}px` : '100%', [maxConcurrentColumns]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000); // Update every minute for the 'now' indicator
    
    // Auto-scroll to current time on mount if it's today
    const timer = setTimeout(() => {
      if (dfnsIsToday(date) && scrollContainerRef.current) {
        const newTop = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);
        scrollContainerRef.current.scrollTo({ top: newTop - scrollContainerRef.current.offsetHeight / 2, behavior: 'smooth' });
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [date, now]);
  
  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };

  const handleEventClick = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseOverview = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleCheckboxChange = (event: TimelineEvent, checked: boolean) => {
    if (onEventStatusChange) {
      const newStatus = checked ? 'completed' : 'missed';
      // Log activity if an item is completed
      if (newStatus === 'completed' && user) {
        logUserActivity(user.uid, 'task_completed', { title: event.title });
      }
      onEventStatusChange(event.id, newStatus);
    }
  };
  
  if (isMaximized) {
    return <MaximizedPlannerView initialDate={date} allEvents={events} onMinimize={() => setIsMaximized(false)} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} />;
  }

  return (
    <Card className={cn("frosted-glass w-full shadow-xl flex flex-col transition-all duration-300 max-h-[70vh]", isMaximized && "fixed inset-0 top-16 z-40 rounded-none max-h-none")} data-theme={viewTheme}>
      <CardHeader className="p-4 border-b border-border/30">
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-xl text-primary">{format(date, 'MMMM d, yyyy')}</CardTitle>
              <CardDescription>Hourly schedule. Scroll to see all hours and events.</CardDescription>
            </div>
            <div className="flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Theme settings">
                      <Palette className="h-6 w-6 text-muted-foreground hover:text-primary" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 frosted-glass">
                    <RadioGroup value={viewTheme} onValueChange={(v) => setViewTheme(v as TimetableViewTheme)}>
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="default" id="t-default" />
                          <span>Default</span>
                        </Label>
                         <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="professional" id="t-prof" />
                          <span>Professional</span>
                        </Label>
                        <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                          <RadioGroupItem value="wood" id="t-wood" />
                          <span>Wood Plank</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} aria-label={isMaximized ? "Minimize view" : "Maximize view"}>
                    <Maximize className="h-6 w-6 text-muted-foreground hover:text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
                    <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                </Button>
            </div>
        </div>
        {/* Minute Ruler */}
        <div className={cn("grid grid-cols-4 border-b border-border/30 text-center text-xs text-muted-foreground timetable-ruler", minuteRulerHeightClass)}>
            <div className="border-r border-border/30 flex items-center justify-center">00'</div>
            <div className="border-r border-border/30 flex items-center justify-center">15'</div>
            <div className="border-r border-border/30 flex items-center justify-center">30'</div>
            <div className="flex items-center justify-center">45'</div>
        </div>
      </CardHeader>

      <div className="flex flex-1 min-h-0 relative">
        <div className="flex flex-1 flex-col">
          {/* All-day events */}
          <div className="p-2 border-b border-border/30 timetable-allday-area">
            <div className="flex gap-2">
              <span className="text-xs font-semibold w-12 text-center">All-day</span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {allDayEvents.map(event => (
                  <div key={event.id} onClick={() => handleEventClick(event)} className={cn("p-1 rounded-md text-xs cursor-pointer truncate", event.color ? '' : 'bg-muted/50')}>
                    <Checkbox
                        checked={event.status === 'completed'}
                        onCheckedChange={(checked) => handleCheckboxChange(event, !!checked)}
                        className="mr-2"
                        disabled={!onEventStatusChange}
                    />
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
              <div className="flex h-full">
                  <div className="w-16 flex-shrink-0 text-right text-xs timetable-hours-column">
                      {renderHours()}
                  </div>
                  <div className="flex-1 relative" style={{ minWidth: minEventGridWidth }}>
                      {renderHourLines()}
                      {dfnsIsToday(date) && (
                          <div
                              ref={nowIndicatorRef}
                              className="absolute w-full h-0.5 bg-accent/80 z-20"
                              style={{ top: `${(now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT_PX/60)}px` }}
                          >
                              <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent"></div>
                          </div>
                      )}
                      {timedEventsWithLayout.map(({ layout, ...event }) => (
                          <div
                            key={event.id}
                            className="absolute p-2 rounded-lg cursor-pointer overflow-hidden bg-card/80 border border-border/50 timetable-event-card"
                            style={{
                                ...layout,
                                backgroundColor: event.color || undefined,
                                borderColor: event.color || undefined,
                            }}
                            onClick={() => handleEventClick(event)}
                          >
                            <p className="font-bold text-sm leading-tight truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground leading-tight truncate">{event.notes}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
        </div>
        
        {/* Event Overview Panel */}
        {selectedEvent && (
           <EventOverviewPanel
            event={selectedEvent}
            onClose={handleCloseOverview}
            onEdit={onEditEvent}
          />
        )}
      </div>
    </Card>
  );
}

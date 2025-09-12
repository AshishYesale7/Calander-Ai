
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isPast, isSameDay, startOfDay as dfnsStartOfDay, isToday as dfnsIsToday } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, CalendarDays, Maximize, Palette } from 'lucide-react';
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
import { calculateEventLayouts } from '../planner/planner-utils';
import MaximizedPlannerView from '../planner/MaximizedPlannerView';

const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90;
const minuteRulerHeightClass = 'h-8'; 

type TimetableViewTheme = 'default' | 'professional' | 'wood';

const getEventTooltip = (event: TimelineEvent): string => {
    if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return event.title;
    const timeString = event.isAllDay ? 'All Day' : `${format(event.date, 'h:mm a')}${event.endDate && event.endDate instanceof Date && !isNaN(event.endDate.valueOf()) ? ` - ${format(event.endDate, 'h:mm a')}` : ''}`;
    const statusString = event.status ? `Status: ${event.status.replace(/-/g, ' ')}` : '';
    const notesString = event.notes ? `Notes: ${event.notes}` : '';
    return [event.title, timeString, statusString, notesString].filter(Boolean).join('\n');
};

const getEventTypeStyleClasses = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500/80 border-red-700 text-white dark:bg-red-700/80 dark:border-red-600 dark:text-red-100';
    case 'deadline': return 'bg-yellow-500/80 border-yellow-700 text-yellow-900 dark:bg-yellow-600/80 dark:border-yellow-500 dark:text-yellow-100';
    case 'goal': return 'bg-green-500/80 border-green-700 text-white dark:bg-green-700/80 dark:border-green-600 dark:text-green-100';
    case 'project': return 'bg-blue-500/80 border-blue-700 text-white dark:bg-blue-700/80 dark:border-blue-600 dark:text-blue-100';
    case 'application': return 'bg-purple-500/80 border-purple-700 text-white dark:bg-purple-700/80 dark:border-purple-600 dark:text-purple-100';
    case 'ai_suggestion': return 'bg-teal-500/80 border-teal-700 text-white dark:bg-teal-700/80 dark:border-teal-600 dark:text-teal-100';
    default: return 'bg-gray-500/80 border-gray-700 text-white dark:bg-gray-600/80 dark:border-gray-500 dark:text-gray-100';
  }
};

const getCustomColorStyles = (color?: string) => {
  if (!color) return {};
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return {
      backgroundColor: `rgba(${r},${g},${b},0.8)`,
      borderColor: color,
      color: (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#333' : '#fff'
    };
  }
  return { backgroundColor: `${color}B3`, borderColor: color };
};

const getEventTypeIcon = (event: TimelineEvent): ReactNode => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
};


interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

export default function DayTimetableView({ date: initialDate, events: allEvents, onClose, onDeleteEvent, onEditEvent, onEventStatusChange }: DayTimetableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewTheme, setViewTheme] = useState<TimetableViewTheme>('default');
  
  const isDayInPast = useMemo(() => isPast(initialDate) && !isSameDay(initialDate, new Date()), [initialDate]);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const eventsForDay = useMemo(() => allEvents.filter(event => isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(initialDate))), [allEvents, initialDate]);
  const allDayEvents = useMemo(() => eventsForDay.filter(e => e.isAllDay), [eventsForDay]);
  const timedEvents = useMemo(() => eventsForDay.filter(e => !e.isAllDay), [eventsForDay]);
  const { eventsWithLayout: timedEventsWithLayout, maxConcurrentColumns } = useMemo(() => calculateEventLayouts(timedEvents, HOUR_HEIGHT_PX), [timedEvents]);
  
  const minEventGridWidth = useMemo(() => maxConcurrentColumns > 3 ? `${Math.max(100, maxConcurrentColumns * MIN_EVENT_COLUMN_WIDTH_PX)}px` : '100%', [maxConcurrentColumns]);
  const currentTimeTopPosition = dfnsIsToday(initialDate) ? (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX) : -1;

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000); // Update every minute for the 'now' indicator
    
    const timer = setTimeout(() => {
      if (dfnsIsToday(initialDate) && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: currentTimeTopPosition - scrollContainerRef.current.offsetHeight / 2, behavior: 'smooth' });
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, [initialDate, currentTimeTopPosition]);
  
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
      if (newStatus === 'completed' && user) {
        logUserActivity(user.uid, 'task_completed', { title: event.title });
      }
      onEventStatusChange(event.id, newStatus);
    }
  };
  
  if (isMaximized) {
    return (
      <MaximizedPlannerView
        initialDate={initialDate}
        allEvents={allEvents}
        onMinimize={() => setIsMaximized(false)}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
      />
    );
  }

  return (
    <Card className={cn("frosted-glass w-full shadow-xl flex flex-col transition-all duration-300 max-h-[70vh]")} data-theme={viewTheme}>
      <CardHeader className="p-4 border-b border-border/30">
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-xl text-primary">{format(initialDate, 'MMMM d, yyyy')}</CardTitle>
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
                <Button variant="ghost" size="icon" onClick={() => setIsMaximized(true)} aria-label="Maximize view">
                    <Maximize className="h-6 w-6 text-muted-foreground hover:text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
                    <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          <div className="p-2 border-b border-border/30 timetable-allday-area" style={{ backgroundColor: viewTheme === 'professional' ? '#1c1c1c' : undefined }}>
             <div className="flex gap-2">
                 <span className="text-xs font-semibold w-12 text-center">All-day</span>
                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                 {allDayEvents.map(event => {
                    const isChecked = event.status === 'completed' || (event.status !== 'missed' && isDayInPast);
                    return (
                        <div key={event.id} onClick={() => handleEventClick(event)} className={cn("p-1 rounded-md text-xs cursor-pointer truncate", event.color ? '' : 'bg-muted/50')}>
                          <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheckboxChange(event, !!checked)}
                              className="mr-2"
                              disabled={!onEventStatusChange}
                          />
                          {event.title}
                        </div>
                    )
                  })}
                 </div>
            </div>
          </div>
          <div className="flex-1 flex min-h-0 relative">
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto timetable-main-area">
              <div className="flex w-full">
                  <div className="w-16 md:w-20 border-r border-border/30 timetable-hours-column">
                      <div className={cn("border-b border-border/30", minuteRulerHeightClass)}></div>
                      <div>
                          {hours.map(hour => (
                          <div key={`label-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                              className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/20 last:border-b-0 flex items-start justify-end">
                              <span className='-translate-y-1/2'>{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</span>
                          </div>
                          ))}
                      </div>
                  </div>

                  <div className="flex-1 relative" style={{ minWidth: 0 }}>
                      <div
                      className={cn(
                          "sticky top-0 z-30 backdrop-blur-sm flex items-center border-b border-border/30 timetable-ruler",
                          minuteRulerHeightClass
                      )}
                      style={{ minWidth: minEventGridWidth }} 
                      >
                          <div className="w-full grid grid-cols-4 items-center h-full px-1 text-center text-[10px] text-muted-foreground">
                              <div className="text-left">00'</div>
                              <div className="border-l border-border/40 h-full flex items-center justify-center">15'</div>
                              <div className="border-l border-border/40 h-full flex items-center justify-center">30'</div>
                              <div className="border-l border-border/40 h-full flex items-center justify-center">45'</div>
                          </div>
                      </div>

                      <div className="relative timetable-grid-bg" style={{ height: `${hours.length * HOUR_HEIGHT_PX}px`, minWidth: minEventGridWidth }}> 
                      {hours.map(hour => (
                          <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px`, top: `${hour * HOUR_HEIGHT_PX}px` }}
                              className="border-b border-border/20 last:border-b-0 w-full absolute left-0 right-0 z-0 timetable-hour-line"
                          ></div>
                      ))}

                      <div 
                        ref={nowIndicatorRef}
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: `${currentTimeTopPosition}px`, display: currentTimeTopPosition < 0 ? 'none' : 'flex' }}
                        >
                        <div className="flex-shrink-0 w-3 h-3 -ml-[7px] rounded-full bg-accent border-2 border-background shadow-md"></div>
                        <div className="flex-1 h-[2px] bg-accent opacity-80 shadow"></div>
                        </div>

                      {timedEventsWithLayout.map(event => {
                          if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return null;
                          const isSmallWidth = parseFloat(event.layout.width) < 25;
                          const isChecked = event.status === 'completed' || (event.status !== 'missed' && isDayInPast);

                          return (
                          <div
                              key={event.id}
                              className={cn(
                              "absolute rounded border text-xs overflow-hidden shadow-sm transition-opacity cursor-pointer timetable-event-card",
                              "focus-within:ring-2 focus-within:ring-ring",
                              !event.color && getEventTypeStyleClasses(event.type),
                              isSmallWidth ? "p-0.5" : "p-1",
                              isDayInPast && "opacity-60 hover:opacity-100 focus-within:opacity-100",
                              selectedEvent?.id === event.id && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                              )}
                              style={{
                                  top: `${event.layout.top}px`,
                                  height: `${event.layout.height}px`,
                                  left: event.layout.left,
                                  width: event.layout.width,
                                  zIndex: event.layout.zIndex, 
                                  ...(event.color ? getCustomColorStyles(event.color) : {})
                              }}
                              title={getEventTooltip(event)}
                              onClick={() => handleEventClick(event)}
                          >
                              <div className="flex flex-col h-full">
                                  <div className="flex-grow overflow-hidden">
                                      <div className="flex items-start gap-1.5">
                                          {onEventStatusChange && (
                                              <Checkbox
                                                  id={`check-${event.id}`}
                                                  checked={isChecked}
                                                  onCheckedChange={(checked) => handleCheckboxChange(event, !!checked)}
                                                  onClick={(e) => e.stopPropagation()}
                                                  aria-label={`Mark ${event.title} as ${isChecked ? 'missed' : 'completed'}`}
                                                  className="mt-0.5 border-current flex-shrink-0"
                                              />
                                          )}
                                          <p className={cn("font-semibold truncate", isSmallWidth ? "text-[10px]" : "text-xs", event.color ? '' : 'text-current')}>{event.title}</p>
                                      </div>
                                      {!isSmallWidth && (
                                      <p className={cn("opacity-80 truncate text-[10px] pl-5", event.color ? 'text-foreground/80' : '')}>
                                          {format(event.date, 'h:mm a')}
                                          {event.endDate && event.endDate instanceof Date && !isNaN(event.endDate.valueOf()) && ` - ${format(event.endDate, 'h:mm a')}`}
                                      </p>
                                      )}
                                  </div>
                                  <div className={cn("mt-auto flex-shrink-0 flex items-center space-x-0.5", isSmallWidth ? "justify-center" : "justify-end")}>
                                      {event.isDeletable && onDeleteEvent && (
                                          <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive/80 hover:bg-destructive/10 opacity-70 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                  <Trash2 className="h-3 w-3" />
                                              </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent className="frosted-glass">
                                              <AlertDialogHeader><AlertDialogTitle>Delete "{event.title}"?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteClick(event.id, event.title)}>Delete</AlertDialogAction>
                                              </AlertDialogFooter>
                                              </AlertDialogContent>
                                          </AlertDialog>
                                      )}
                                  </div>
                              </div>
                          </div>
                          );
                      })}
                    </div>
                </div>
            </div>
            </div>
            
            {selectedEvent && (
              <EventOverviewPanel
                event={selectedEvent}
                onClose={handleCloseOverview}
                onEdit={onEditEvent}
              />
            )}
          </div>
        </CardContent>
    </Card>
  );
}

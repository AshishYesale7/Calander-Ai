
'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isToday as dfnsIsToday, isFuture, isPast, formatDistanceToNowStrict } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, Info, CalendarDays, Maximize, Minimize } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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


const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90;
const minuteRulerHeightClass = 'h-8'; 

const getEventTypeStyleClasses = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'exam': return 'bg-red-500/20 border-red-500 text-red-700 dark:bg-red-700/20 dark:border-red-700 dark:text-red-300';
    case 'deadline': return 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:bg-yellow-700/20 dark:border-yellow-700 dark:text-yellow-300';
    case 'goal': return 'bg-green-500/20 border-green-500 text-green-700 dark:bg-green-700/20 dark:border-green-700 dark:text-green-300';
    case 'project': return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:bg-blue-700/20 dark:border-blue-700 dark:text-blue-300';
    case 'application': return 'bg-purple-500/20 border-purple-500 text-purple-700 dark:bg-purple-700/20 dark:border-purple-700 dark:text-purple-300';
    case 'ai_suggestion': return 'bg-teal-500/20 border-teal-500 text-teal-700 dark:bg-teal-700/20 dark:border-teal-700 dark:text-teal-300';
    default: return 'bg-gray-500/20 border-gray-500 text-gray-700 dark:bg-gray-700/20 dark:border-gray-700 dark:text-gray-300';
  }
};

const getStatusBadgeVariant = (status?: TimelineEvent['status']): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (status) {
    case 'completed':
      return { variant: 'default', className: 'bg-green-500/80 border-green-700 text-white hover:bg-green-600/80' };
    case 'in-progress':
      return { variant: 'default', className: 'bg-blue-500/80 border-blue-700 text-white hover:bg-blue-600/80' };
    case 'missed':
      return { variant: 'destructive', className: 'bg-red-500/80 border-red-700 text-white hover:bg-red-600/80' };
    case 'pending':
    default:
      return { variant: 'secondary', className: 'bg-yellow-500/80 border-yellow-700 text-yellow-900 hover:bg-yellow-600/80' };
  }
};

const getCountdownText = (eventDate: Date): string => {
  if (!(eventDate instanceof Date) || isNaN(eventDate.valueOf())) return "";
  const now = new Date();
  if (dfnsIsToday(eventDate)) return "Today";
  if (isFuture(eventDate)) return formatDistanceToNowStrict(eventDate, { addSuffix: true });
  if (isPast(eventDate)) return formatDistanceToNowStrict(eventDate, { addSuffix: true });
  return "";
};

const getCustomColorStyles = (color?: string) => {
  if (!color) return {};
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return {
      backgroundColor: `rgba(${r},${g},${b},0.25)`,
      borderColor: color,
    };
  }
  return { backgroundColor: `${color}40`, borderColor: color }; 
};

const getEventTypeIcon = (event: TimelineEvent): ReactNode => {
  if (event.type === 'ai_suggestion') return <Bot className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
  const Icon = event.icon || CalendarDays;
  return <Icon className="mr-2 h-4 w-4 text-accent flex-shrink-0" />;
};

interface EventWithLayout extends TimelineEvent {
  layout: {
    top: number;
    height: number;
    left: string;
    width: string;
    zIndex: number;
  };
}

interface LayoutCalculationResult {
  eventsWithLayout: EventWithLayout[];
  maxConcurrentColumns: number;
}

function calculateEventLayouts(
  timedEvents: TimelineEvent[],
  hourHeightPx: number
): LayoutCalculationResult {
  const minuteHeightPx = hourHeightPx / 60;
  let maxConcurrentColumns = 1;

  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      if (!(startDate instanceof Date) || isNaN(startDate.valueOf())) {
         // console.warn(`Invalid start date for event ${e.id}. Skipping layout.`);
         return null; // Skip events with invalid dates
      }
      const start = startDate.getHours() * 60 + startDate.getMinutes();
      let endValue;
      if (endDate && endDate instanceof Date && !isNaN(endDate.valueOf())) {
        if (endDate.getDate() !== startDate.getDate()) {
          endValue = 24 * 60; 
        } else {
          endValue = endDate.getHours() * 60 + endDate.getMinutes();
        }
      } else {
        endValue = start + 60; 
      }
      endValue = Math.max(start + 15, endValue); 
      return {
        ...e,
        originalIndex: idx,
        startInMinutes: start,
        endInMinutes: endValue,
      };
    })
    .filter(e => e !== null) // Remove skipped events
    .sort((a, b) => { 
      if (!a || !b) return 0;
      if (a.startInMinutes !== b.startInMinutes) return a.startInMinutes - b.startInMinutes;
      return (b.endInMinutes - b.startInMinutes) - (a.endInMinutes - a.startInMinutes);
    });

  const layoutResults: EventWithLayout[] = [];
  
  let i = 0;
  while (i < events.length) {
    if (!events[i]) { i++; continue; } // Should not happen with filter
    let currentGroup = [events[i]!];
    let maxEndInGroup = events[i]!.endInMinutes;
    for (let j = i + 1; j < events.length; j++) {
      if (!events[j]) continue;
      if (events[j]!.startInMinutes < maxEndInGroup) {
        currentGroup.push(events[j]!);
        maxEndInGroup = Math.max(maxEndInGroup, events[j]!.endInMinutes);
      } else {
        break; 
      }
    }
    
    currentGroup.sort((a,b) => a.startInMinutes - b.startInMinutes || a.originalIndex - a.originalIndex);

    const columns: { event: typeof events[0]; columnOrder: number }[][] = [];
    for (const event of currentGroup) {
      if(!event) continue;
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEventInColumn = columns[c][columns[c].length - 1];
        if (lastEventInColumn.event!.endInMinutes <= event.startInMinutes) {
          columns[c].push({event, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([{event, columnOrder: columns.length}]);
      }
    }
    
    const numColsInGroup = columns.length;
    maxConcurrentColumns = Math.max(maxConcurrentColumns, numColsInGroup);

    for (const col of columns) {
      for (const item of col) {
        const event = item.event;
        if (!event) continue;
        const colIdx = item.columnOrder;
        
        const colWidthPercentage = 100 / numColsInGroup;
        const gapPercentage = numColsInGroup > 1 ? 0.5 : 0; 
        const actualColWidth = colWidthPercentage - (gapPercentage * (numColsInGroup - 1) / numColsInGroup);
        const leftOffset = colIdx * (actualColWidth + gapPercentage);

        layoutResults.push({
          ...event,
          layout: {
            top: event.startInMinutes * minuteHeightPx,
            height: Math.max(15, (event.endInMinutes - event.startInMinutes) * minuteHeightPx), 
            left: `${leftOffset}%`,
            width: `${actualColWidth}%`,
            zIndex: 10 + colIdx, 
          },
        } as EventWithLayout);
      }
    }
    i += currentGroup.length; 
  }
  
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - b.layout.zIndex);

  return { eventsWithLayout: layoutResults, maxConcurrentColumns };
}

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
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const isToday = useMemo(() => dfnsIsToday(date), [date]);
  const isDayInPast = useMemo(() => isPast(date) && !dfnsIsToday(date), [date]);

  useEffect(() => {
    if (isToday) {
      const timer = setTimeout(() => {
        nowIndicatorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 500);

      const intervalId = setInterval(() => {
        setNow(new Date());
      }, 60000); 

      return () => {
        clearTimeout(timer);
        clearInterval(intervalId);
      };
    }
  }, [isToday]);
  
  const allDayEvents = useMemo(() => events.filter(e => e.isAllDay), [events]);
  const timedEvents = useMemo(() => events.filter(e => !e.isAllDay && e.date instanceof Date && !isNaN(e.date.valueOf())), [events]);

  const { eventsWithLayout: timedEventsWithLayout, maxConcurrentColumns } = useMemo(
    () => calculateEventLayouts(timedEvents, HOUR_HEIGHT_PX),
    [timedEvents]
  );
  
  const minEventGridWidth = useMemo(() => {
    return maxConcurrentColumns > 3 
      ? `${Math.max(100, maxConcurrentColumns * MIN_EVENT_COLUMN_WIDTH_PX)}px` 
      : '100%'; 
  }, [maxConcurrentColumns]);

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };

  const handleEventClick = useCallback((event: TimelineEvent) => {
    setSelectedEvent(event);
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

  const handleCloseOverview = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const getEventTooltip = (event: TimelineEvent): string => {
    if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return event.title;
    const timeString = event.isAllDay ? 'All Day' : `${format(event.date, 'h:mm a')}${event.endDate && event.endDate instanceof Date && !isNaN(event.endDate.valueOf()) ? ` - ${format(event.endDate, 'h:mm a')}` : ''}`;
    const statusString = event.status ? `Status: ${event.status.replace(/-/g, ' ')}` : '';
    const countdownString = getCountdownText(event.date);
    const notesString = event.notes ? `Notes: ${event.notes}` : '';
    return [event.title, timeString, countdownString, statusString, notesString].filter(Boolean).join('\n');
  };

  const currentTimeTopPosition = isToday ? (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT_PX / 60) : 0;

  return (
    <Card className={cn(
        "frosted-glass w-full shadow-xl flex flex-col transition-all duration-300",
        isMaximized 
          ? "fixed inset-0 top-16 z-40 rounded-none border-none max-h-none"
          : "max-h-[70vh]"
    )}>
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-xl text-primary">
            {format(date, 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>Hourly schedule. Scroll to see all hours and events.</CardDescription>
        </div>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} aria-label={isMaximized ? "Minimize view" : "Maximize view"}>
                {isMaximized ? <Minimize className="h-6 w-6 text-muted-foreground hover:text-primary" /> : <Maximize className="h-6 w-6 text-muted-foreground hover:text-primary" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view">
              <XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" />
            </Button>
        </div>
      </CardHeader>

      {allDayEvents.length > 0 && (
        <div className="p-3 border-b border-border/30 space-y-1 bg-background/50">
          {allDayEvents.map(event => {
            if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return null;
            const statusBadge = getStatusBadgeVariant(event.status);
            const countdownText = getCountdownText(event.date);
            const isEventInPast = isPast(event.date);
            const isChecked = event.status === 'completed' || (event.status !== 'missed' && isEventInPast);

            return (
            <div
              key={event.id}
              className={cn(
                "rounded-md p-1.5 text-xs flex justify-between items-center transition-opacity",
                "hover:bg-muted/50",
                isDayInPast && "opacity-60 hover:opacity-100 focus-within:opacity-100",
                selectedEvent?.id === event.id && "ring-2 ring-accent ring-offset-2 ring-offset-background"
              )}
              style={event.color ? getCustomColorStyles(event.color) : {}}
              title={getEventTooltip(event)}
            >
              <div className="font-medium flex items-center gap-2 cursor-pointer" onClick={() => handleEventClick(event)}>
                 {onEventStatusChange && (
                    <Checkbox
                        id={`check-allday-${event.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleCheckboxChange(event, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Mark ${event.title} as ${isChecked ? 'missed' : 'completed'}`}
                        className="border-current"
                    />
                )}
                {getEventTypeIcon(event)} {event.title}
                {countdownText && <span className="ml-2 text-muted-foreground text-[10px] flex items-center"><Info className="h-3 w-3 mr-0.5"/>{countdownText}</span>}
              </div>
              <div className="flex items-center space-x-1">
                {event.status && (
                    <Badge variant={statusBadge.variant} className={cn("capitalize text-[10px] px-1.5 py-0 h-auto", statusBadge.className)}>
                        {event.status.replace(/-/g, ' ')}
                    </Badge>
                )}
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
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
      
      <div className="flex flex-1 min-h-0">
        <CardContent ref={scrollContainerRef} className="p-0 flex-1 min-h-0 overflow-auto">
          <div className="flex w-full">
              <div className="w-16 md:w-20 bg-background border-r border-border/30">
                  <div className={cn("border-b border-border/30", minuteRulerHeightClass)}></div>
                  <div>
                      {hours.map(hour => (
                      <div key={`label-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px` }}
                          className="text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/20 last:border-b-0 flex items-start justify-end">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </div>
                      ))}
                  </div>
              </div>

              <div className="flex-1 relative" style={{ minWidth: 0 }}>
                  <div
                  className={cn(
                      "sticky top-0 z-30 bg-background/80 backdrop-blur-sm flex items-center border-b border-border/30",
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

                  <div className="relative" style={{ height: `${hours.length * HOUR_HEIGHT_PX}px` }}> 
                  {hours.map(hour => (
                      <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px`, top: `${hour * HOUR_HEIGHT_PX}px` }}
                          className="border-b border-border/20 last:border-b-0 w-full absolute left-0 right-0 z-0"
                      ></div>
                  ))}

                  {isToday && (
                      <div
                      ref={nowIndicatorRef}
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      style={{ top: `${currentTimeTopPosition}px` }}
                      >
                      <div className="flex-shrink-0 w-3 h-3 -ml-[7px] rounded-full bg-accent border-2 border-background shadow-md"></div>
                      <div className="flex-1 h-[2px] bg-accent opacity-80 shadow"></div>
                      </div>
                  )}

                  {timedEventsWithLayout.map(event => {
                      if (!(event.date instanceof Date) || isNaN(event.date.valueOf())) return null;
                      const isSmallWidth = parseFloat(event.layout.width) < 25;
                      const isEventInPast = event.endDate ? isPast(event.endDate) : isPast(event.date);
                      const isChecked = event.status === 'completed' || (event.status !== 'missed' && isEventInPast);

                      return (
                      <div
                          key={event.id}
                          className={cn(
                          "absolute rounded border text-xs overflow-hidden shadow-sm transition-opacity cursor-pointer",
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
                                      <p className={cn("font-semibold truncate", isSmallWidth ? "text-[10px]" : "text-xs", event.color ? 'text-foreground' : 'text-current')}>{event.title}</p>
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
                                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
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
        </CardContent>
        
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


'use client';

import type { TimelineEvent } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isToday as dfnsIsToday, isFuture, isPast, formatDistanceToNowStrict } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, Info, CalendarDays, Maximize, Minimize, Settings, Palette, Inbox, Calendar, Star, Columns, GripVertical, CheckCircle, ChevronDown } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';


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
         return null; 
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
    .filter(e => e !== null) 
    .sort((a, b) => { 
      if (!a || !b) return 0;
      if (a.startInMinutes !== b.startInMinutes) return a.startInMinutes - b.startInMinutes;
      return (b.endInMinutes - b.startInMinutes) - (a.endInMinutes - a.startInMinutes);
    });

  const layoutResults: EventWithLayout[] = [];
  
  let i = 0;
  while (i < events.length) {
    if (!events[i]) { i++; continue; }
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
  
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - a.layout.zIndex);

  return { eventsWithLayout: layoutResults, maxConcurrentColumns };
}

// --- New Components for Maximized View ---

const PlannerSidebar = () => (
    <div className="w-64 bg-gray-900/50 p-4 flex flex-col gap-6">
        <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Main</h3>
            <ul className="space-y-1 text-gray-200">
                <li className="flex items-center gap-3 p-2 rounded-md bg-gray-700/50"><Inbox size={18} /><span>Inbox</span><Badge className="ml-auto">3</Badge></li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/30"><Calendar size={18} /><span>Today</span></li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/30"><Star size={18} /><span>Upcoming</span></li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/30"><Columns size={18} /><span>All Tasks</span></li>
            </ul>
        </div>
        <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Projects</h3>
            <ul className="space-y-1 text-gray-300">
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/30"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span>Work</span></li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/30"><div className="w-2 h-2 rounded-full bg-amber-600"></div><span>Fitness</span></li>
                <li className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/30"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span>Travel</span></li>
            </ul>
        </div>
    </div>
);

const PlannerTaskList = () => (
    <div className="flex-1 bg-gray-800/60 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Inbox</h1>
            <Button variant="ghost"><ChevronDown className="mr-2" /> More</Button>
        </div>
        <div className="space-y-3">
            {[
                { title: 'Create thumbnails for next 3 videos', tags: ['Thumbnails', 'Design'] },
                { title: 'Write script for "Productivity Hacks" video', tags: ['Scripts', 'Writing'] },
                { title: 'Edit and schedule this week\'s short-form content', tags: ['Editing', 'Social Media'] },
            ].map(task => (
                <div key={task.title} className="bg-gray-700/50 p-4 rounded-lg flex items-center gap-4 cursor-grab active:cursor-grabbing">
                    <GripVertical className="text-gray-500" />
                    <Checkbox id={task.title} className="border-gray-500"/>
                    <div className="flex-1">
                        <label htmlFor={task.title} className="text-gray-200">{task.title}</label>
                        <div className="flex gap-2 mt-1">
                            {task.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const PlannerWeeklyTimeline = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 20 }, (_, i) => i + 5); // 5 AM to 12 AM (midnight)
    
    // Mock data for events
    const events = [
        { day: 1, start: 9, duration: 8, title: 'Work', color: 'bg-purple-600' },
        { day: 2, start: 9, duration: 8, title: 'Work', color: 'bg-purple-600' },
        { day: 3, start: 9, duration: 4, title: 'Work', color: 'bg-purple-600' },
        { day: 1, start: 7, duration: 1, title: 'Gym', color: 'bg-amber-700' },
        { day: 3, start: 7, duration: 1, title: 'Gym', color: 'bg-amber-700' },
        { day: 5, start: 7, duration: 1, title: 'Gym', color: 'bg-amber-700' },
        { day: 6, start: 18, duration: 3, title: 'Flight', color: 'bg-blue-600' },
    ];
    
    // Calculate current time position
    const now = new Date();
    const nowPosition = (now.getHours() - 5 + now.getMinutes() / 60) * 50; // 50px per hour

    return (
        <div className="w-[800px] flex-shrink-0 bg-black/50 p-4">
            <div className="grid grid-cols-7 text-center text-gray-400 font-semibold mb-2">
                {days.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="relative">
                {/* Hours background */}
                <div className="grid grid-cols-7">
                    {days.map(day => (
                        <div key={day} className="border-r border-gray-700/50 last:border-r-0">
                            {hours.map(hour => (
                                <div key={`${day}-${hour}`} className="h-[50px] border-t border-gray-700/50"></div>
                            ))}
                        </div>
                    ))}
                </div>
                {/* Events overlay */}
                <div className="absolute inset-0 grid grid-cols-7">
                    {events.map((event, i) => (
                        <div key={i} className={cn('p-2 rounded-lg text-white text-sm font-medium m-1', event.color)}
                            style={{ gridColumnStart: event.day + 1, gridRowStart: event.start - 4, gridRowEnd: event.start - 4 + event.duration }}>
                            {event.title}
                        </div>
                    ))}
                </div>
                 {/* "Now" line */}
                <div className="absolute w-full h-[2px] bg-purple-500 z-10" style={{ top: `${nowPosition}px` }}>
                    <div className="w-2 h-2 rounded-full bg-purple-500 absolute -left-1 -top-[3px]"></div>
                </div>
            </div>
        </div>
    );
};


// Main Component
interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

type TimetableViewTheme = 'default' | 'professional' | 'wood';

export default function DayTimetableView({ date, events, onClose, onDeleteEvent, onEditEvent, onEventStatusChange }: DayTimetableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewTheme, setViewTheme] = useState<TimetableViewTheme>('default');

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

  // New Maximized View
  if (isMaximized) {
    return (
        <div className="fixed inset-0 top-16 z-40 bg-[#171717] text-white flex flex-col">
            <header className="p-4 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0">
                <h1 className="text-xl font-bold">Weekly Planner</h1>
                 <Button variant="ghost" size="icon" onClick={() => setIsMaximized(false)} aria-label="Minimize view">
                    <Minimize className="h-6 w-6 text-gray-400 hover:text-white" />
                </Button>
            </header>
            <div className="flex flex-1 min-h-0">
                <PlannerSidebar />
                <PlannerTaskList />
                <div className="flex-1 overflow-x-auto">
                    <PlannerWeeklyTimeline />
                </div>
            </div>
        </div>
    )
  }

  return (
    <Card 
      className={cn(
        "frosted-glass w-full shadow-xl flex flex-col transition-all duration-300",
        "max-h-[70vh]"
      )}
      data-theme={viewTheme}
    >
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-xl text-primary">
            {format(date, 'MMMM d, yyyy')}
          </CardTitle>
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
      </CardHeader>

      {allDayEvents.length > 0 && (
        <div className="p-3 border-b border-border/30 space-y-1 timetable-allday-area">
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
        <CardContent ref={scrollContainerRef} className="p-0 flex-1 min-h-0 overflow-auto timetable-main-area">
          <div className="flex w-full">
              <div className="w-16 md:w-20 border-r border-border/30 timetable-hours-column">
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

                  <div className="relative timetable-grid-bg" style={{ height: `${hours.length * HOUR_HEIGHT_PX}px` }}> 
                  {hours.map(hour => (
                      <div key={`line-${hour}`} style={{ height: `${HOUR_HEIGHT_PX}px`, top: `${hour * HOUR_HEIGHT_PX}px` }}
                          className="border-b border-border/20 last:border-b-0 w-full absolute left-0 right-0 z-0 timetable-hour-line"
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

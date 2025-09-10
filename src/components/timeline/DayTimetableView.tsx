
'use client';

import type { TimelineEvent, GoogleTaskList, RawGoogleTask } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isToday as dfnsIsToday, isFuture, isPast, formatDistanceToNowStrict, startOfWeek, endOfWeek, eachDayOfInterval, getHours, getMinutes, addWeeks, subWeeks, set, startOfDay as dfnsStartOfDay, addMonths, subMonths, startOfMonth, endOfMonth, addDays, getDay, isSameDay } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, Info, CalendarDays, Maximize, Minimize, Settings, Palette, Inbox, Calendar, Star, Columns, GripVertical, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Plus, Link as LinkIcon, Lock, Activity, Tag, Flag, MapPin, Hash, Image as ImageIcon, Filter, LayoutGrid, UserPlus, Clock } from 'lucide-react';
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
import { Input } from '../ui/input';
import { getGoogleTaskLists, getAllTasksFromList, createGoogleTask } from '@/services/googleTasksService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import PlannerMonthView from './PlannerMonthView';


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
  
  layoutResults.sort((a, b) => a.layout.top - b.layout.top || a.layout.zIndex - b.layout.zIndex);

  return { eventsWithLayout: layoutResults, maxConcurrentColumns };
}

// --- New Components for Maximized View ---

type PlannerViewMode = 'day' | 'week' | 'month';

const PlannerHeader = ({ 
    activeView, 
    date,
    onNavigate,
    onTodayClick, 
    onMinimize, 
    onViewChange 
}: { 
    activeView: PlannerViewMode;
    date: Date;
    onNavigate: (direction: 'prev' | 'next') => void;
    onTodayClick: () => void;
    onMinimize: () => void;
    onViewChange: (view: PlannerViewMode) => void;
}) => {
    const getTitle = () => {
        switch(activeView) {
            case 'day': return format(date, 'MMM d, yyyy');
            case 'week': return `${format(startOfWeek(date), 'MMM d')} - ${format(endOfWeek(date), 'MMM d, yyyy')}`;
            case 'month': return format(date, 'MMMM yyyy');
        }
    };

    return (
        <header className="p-1 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0 text-xs">
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="font-semibold text-white px-2 text-sm">{getTitle()}</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNavigate('next')}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" className="h-7 px-2 text-xs" onClick={onTodayClick}>Today</Button>
            </div>
            <div className="flex items-center gap-1 bg-gray-800/50 p-0.5 rounded-md">
                <Button onClick={() => onViewChange('day')} variant={activeView === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs">Day</Button>
                <Button onClick={() => onViewChange('week')} variant={activeView === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs">Week</Button>
                <Button onClick={() => onViewChange('month')} variant={activeView === 'month' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs">Month</Button>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7"><UserPlus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={onMinimize} aria-label="Minimize view" className="h-7 w-7">
                    <Minimize className="h-4 w-4 text-gray-400 hover:text-white" />
                </Button>
            </div>
        </header>
    );
};


const PlannerSidebar = ({ activeView, setActiveView }: { activeView: string, setActiveView: (view: string) => void }) => {
    const mainSections = [
        { id: 'inbox', icon: Inbox, label: 'Inbox', count: 6 },
        { id: 'today', icon: Calendar, label: 'Today' },
        { id: 'upcoming', icon: Star, label: 'Upcoming' },
        { id: 'all', icon: Columns, label: 'All tasks' },
    ];
    const projects = [
        { id: 'proj-book', color: 'bg-red-500', char: 'B', label: 'Book' },
        { id: 'proj-news', color: 'bg-green-500', char: 'N', label: 'Newsletter' },
        { id: 'proj-fit', color: 'bg-yellow-500', char: 'F', label: 'Fitness' },
        { id: 'proj-work', color: 'bg-purple-500', char: 'W', label: 'Work' },
        { id: 'proj-film', color: 'bg-blue-500', char: 'F', label: 'Film' },
    ];
    return (
    <div className="bg-gray-900/50 p-2 flex flex-col gap-4 text-xs">
        <div>
            <ul className="space-y-0.5 text-gray-300">
                {mainSections.map(s => (
                    <li key={s.id}>
                        <button
                          onClick={() => setActiveView(s.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-1.5 rounded-md hover:bg-gray-700/30 text-xs",
                            activeView === s.id && 'bg-gray-700/50 font-semibold text-white'
                          )}
                        >
                            <s.icon size={16} /><span>{s.label}</span>{s.count && <Badge variant="secondary" className="ml-auto bg-gray-600 text-gray-200 h-5 px-1.5 text-xs">{s.count}</Badge>}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
        <div className="flex-1 space-y-3">
             <div>
                <h3 className="text-xs font-semibold text-gray-500 px-1.5 mb-1">Projects</h3>
                <ul className="space-y-0.5 text-gray-300">
                   {projects.map(p => (
                        <li key={p.id}>
                           <button
                             onClick={() => setActiveView(p.id)}
                             className={cn(
                               "w-full flex items-center gap-3 p-1.5 rounded-md hover:bg-gray-700/30 text-xs",
                               activeView === p.id && 'bg-gray-700/50 font-semibold text-white'
                             )}
                           >
                                <div className={cn("w-4 h-4 rounded text-xs flex items-center justify-center font-bold text-white", p.color)}>{p.char}</div>
                                <span>{p.label}</span>
                            </button>
                        </li>
                   ))}
                </ul>
            </div>
             <div>
                 <h3 className="text-xs font-semibold text-gray-500 px-1.5 mb-1">Tags</h3>
            </div>
        </div>
         <div className="border-t border-gray-700/50 pt-2 space-y-0.5 text-gray-300">
             <div className="flex items-center gap-3 p-1.5 rounded-md hover:bg-gray-700/30">
                <Clock size={16}/><span>Statistics</span>
            </div>
             <div className="flex items-center gap-3 p-1.5 rounded-md hover:bg-gray-700/30">
                <Palette size={16}/><span>Daily Planning</span>
            </div>
        </div>
    </div>
)};

const PlannerTaskList = ({
  taskLists,
  tasks,
  activeListId,
  onAddTask,
  onDragStart,
}: {
  taskLists: GoogleTaskList[];
  tasks: RawGoogleTask[];
  activeListId: string;
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const activeList = taskLists.find(list => list.id === activeListId);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const title = newTaskTitle.trim();
        if (title && activeList) {
            onAddTask(activeList.id, title);
            setNewTaskTitle('');
        }
    };
    
    // Mock data for pills and durations
    const getMockTaskDetails = (title: string) => {
        const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const durations = ['1h', '1h 15m', '1h 30m', '45m', '2h'];
        const tags = [
            { name: 'Newsletter', color: 'bg-green-500' },
            { name: 'Film', color: 'bg-blue-500' },
            { name: 'Thumbnails', color: 'bg-purple-500' },
            { name: 'Scripts', color: 'bg-orange-500' },
            { name: 'Book', color: 'bg-red-500' },
        ];
        const hasMetadata = Math.abs(hash % 5) > 1;
        
        return {
            duration: hasMetadata ? durations[Math.abs(hash) % durations.length] : null,
            tag: hasMetadata ? tags[Math.abs(hash) % tags.length] : null,
            metadata: hasMetadata ? 'Content Calendar' : null,
        }
    }


    return (
        <div className="bg-gray-800/60 p-2 flex flex-col border-r border-gray-700/50">
            <div className="flex justify-between items-center mb-2 px-1">
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                    <Inbox size={16} /> {activeList?.title || 'Inbox'}
                </h1>
                <Button variant="ghost" size="icon" className="h-6 w-6"><Filter className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAddTask}>
                 <div className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 text-xs h-8 px-1.5">
                    <Plus className="mr-1 h-4 w-4" />
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add new task"
                        className="bg-transparent border-none h-auto p-0 text-xs focus-visible:ring-0 placeholder:text-gray-500"
                    />
                </div>
            </form>
            <div className="space-y-1 text-xs overflow-y-auto">
                {tasks.map(task => {
                    const mockDetails = getMockTaskDetails(task.title);
                    return (
                        <div 
                        key={task.id} 
                        className="p-1.5 rounded-md hover:bg-gray-700/50 flex flex-col items-start cursor-grab"
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        >
                            <div className="flex items-start gap-2 w-full">
                                <Checkbox id={task.id} className="border-gray-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-400 h-3.5 w-3.5 mt-0.5"/>
                                <label htmlFor={task.id} className="text-gray-200 text-xs flex-1">{task.title}</label>
                                {mockDetails.duration && (
                                    <span className="text-gray-400 text-[10px] font-medium whitespace-nowrap">{mockDetails.duration}</span>
                                )}
                                {mockDetails.tag && (
                                    <span className={cn("text-white text-[10px] font-bold px-1.5 py-0.5 rounded", mockDetails.tag.color)}>{mockDetails.tag.name}</span>
                                )}
                            </div>
                             {mockDetails.metadata && (
                                <div className="pl-6 text-[10px] text-gray-400 flex items-center gap-1">
                                    <Calendar size={10}/>
                                    <span>{mockDetails.metadata}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
};

const PlannerWeeklyTimeline = ({ 
  week, 
  events,
  onDrop,
  onDragOver,
  ghostEvent,
}: { 
  week: Date[], 
  events: TimelineEvent[],
  onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void,
  onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void,
  ghostEvent: { date: Date, hour: number } | null,
}) => {
    const hours = Array.from({ length: 20 }, (_, i) => i + 5); 
    const now = new Date();
    const nowPosition = (now.getHours() - 5 + now.getMinutes() / 60) * 50; // 50px per hour

    const { allDayEvents, timedEvents } = useMemo(() => {
        const weekStart = startOfWeek(week[0], { weekStartsOn: 0 });
        const weekEnd = endOfWeek(week[0], { weekStartsOn: 0 });
        const relevantEvents = events.filter(e => e.date >= weekStart && e.date <= weekEnd);

        return {
            allDayEvents: relevantEvents.filter(e => e.isAllDay),
            timedEvents: relevantEvents.filter(e => !e.isAllDay),
        };
    }, [week, events]);
    
    const getDayIndex = (date: Date) => {
        return date.getDay(); // Sunday = 0
    };
    
    const getEventStyles = (event: TimelineEvent) => {
        const startHour = getHours(event.date);
        const startMinute = getMinutes(event.date);
        const top = (startHour - 5 + startMinute / 60) * 50; // 50px per hour, starting from 5 AM

        let durationHours = 1;
        if (event.endDate) {
            const diffMs = event.endDate.getTime() - event.date.getTime();
            durationHours = diffMs / (1000 * 60 * 60);
        }
        const height = durationHours * 50;

        return {
            gridColumnStart: getDayIndex(event.date) + 1,
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    return (
        <div className="w-[1200px] flex-shrink-0 bg-black/30 p-2 text-xs">
            <div className="grid grid-cols-7 text-center text-gray-400 font-semibold mb-1 text-xs">
                {week.map(day => <div key={day.toISOString()}>{format(day, 'EEE d')}</div>)}
            </div>
             <div className="relative border-b border-gray-700/50 mb-1 pb-1">
                 <div className="grid grid-cols-7 h-5">
                    {allDayEvents.map((event, i) => (
                        <div key={event.id} className={cn("text-white p-0.5 rounded-sm text-[9px] font-semibold overflow-hidden whitespace-nowrap", getEventTypeStyleClasses(event.type))}
                            style={{ gridColumnStart: getDayIndex(event.date) + 1, gridColumnEnd: `span 1`}}>
                            {event.title}
                        </div>
                    ))}
                 </div>
            </div>
            <div className="relative">
                <div className="absolute left-[-30px] top-0 bottom-0 text-right text-gray-500 text-[10px]">
                    {hours.map(hour => (
                        <div key={hour} className="h-[50px] -mt-1.5">{hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'am' : 'pm'}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {week.map(day => (
                        <div key={day.toISOString()} className="border-r border-gray-700/50 last:border-r-0">
                            {hours.map(hour => (
                                <div 
                                    key={`${day.toISOString()}-${hour}`} 
                                    className="h-[50px] border-t border-gray-700/50"
                                    onDrop={(e) => onDrop(e, day, hour)}
                                    onDragOver={(e) => onDragOver(e, day, hour)}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                    {timedEvents.map((event, i) => {
                        const style = getEventStyles(event);
                        const isShort = style.height.replace('px', '') < 40;
                        return (
                          <div key={event.id} className={cn('p-1 rounded-md text-white font-medium m-0.5 text-[10px] overflow-hidden', getEventTypeStyleClasses(event.type))}
                              style={style}>
                              <div className='flex items-center gap-1 text-[10px]'>
                                  {event.reminder.repeat !== 'none' && <Lock size={10} className="shrink-0"/>}
                                  {!isShort && event.icon && <event.icon size={12}/>}
                                  <span className="truncate">{event.title}</span>
                              </div>
                              {!isShort && <p className="text-gray-300 text-[10px]">{format(event.date, 'h:mm a')}</p>}
                          </div>
                        )
                    })}
                    {ghostEvent && (
                        <div 
                            className="border-2 border-dashed border-purple-500 bg-purple-900/30 p-1 rounded-md text-purple-300 opacity-80"
                            style={{
                                gridColumnStart: getDayIndex(ghostEvent.date) + 1,
                                top: `${(ghostEvent.hour - 5) * 50}px`,
                                height: '50px' // 1 hour duration for ghost
                            }}
                        >
                            <p className="text-[10px] font-semibold">Drop to schedule</p>
                        </div>
                    )}
                </div>
                {dfnsIsToday(now) && <div className="absolute w-[calc(100%+30px)] left-[-30px] h-px bg-purple-500 z-10" style={{ top: `${nowPosition}px` }}>
                    <div className="w-2 h-2 rounded-full bg-purple-500 absolute -left-1 -top-[3px]"></div>
                </div>}
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
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

type TimetableViewTheme = 'default' | 'professional' | 'wood';
type ActivePlannerView = 'inbox' | 'today' | 'upcoming' | 'all' | string;

const Resizer = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    className="w-1.5 cursor-col-resize flex items-center justify-center bg-transparent hover:bg-gray-700/50 transition-colors group"
    onMouseDown={onMouseDown}
  >
    <GripVertical className="h-4 w-4 text-gray-600 group-hover:text-white" />
  </div>
);

interface TasksByList {
    [key: string]: RawGoogleTask[];
}

export default function DayTimetableView({ date: initialDate, events: allEvents, onClose, onDeleteEvent, onEditEvent, onEventStatusChange }: DayTimetableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewTheme, setViewTheme] = useState<TimetableViewTheme>('default');

  const [panelWidths, setPanelWidths] = useState([20, 25, 55]);
  const isResizing = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef<number[]>([]);
  
  const [activePlannerView, setActivePlannerView] = useState<ActivePlannerView>('inbox');
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<TasksByList>({});
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  
  const [currentDisplayDate, setCurrentDisplayDate] = useState(initialDate);
  const [plannerViewMode, setPlannerViewMode] = useState<PlannerViewMode>('day');
  
  const [draggedTask, setDraggedTask] = useState<RawGoogleTask | null>(null);
  const [ghostEvent, setGhostEvent] = useState<{ date: Date, hour: number } | null>(null);

  const isToday = useMemo(() => dfnsIsToday(currentDisplayDate), [currentDisplayDate]);
  const isDayInPast = useMemo(() => isPast(currentDisplayDate) && !dfnsIsToday(currentDisplayDate), [currentDisplayDate]);

  const currentWeekDays = useMemo(() => {
    return eachDayOfInterval({ start: startOfWeek(currentDisplayDate, { weekStartsOn: 0 }), end: endOfWeek(currentDisplayDate, { weekStartsOn: 0 }) });
  }, [currentDisplayDate]);

  const handleNavigate = (direction: 'prev' | 'next') => {
      const newDateFn = (current: Date) => {
        switch(plannerViewMode) {
            case 'day': return direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
            case 'week': return direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1);
            case 'month': return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
        }
      }
      setCurrentDisplayDate(newDateFn);
  };
  
  const handleTodayClick = () => {
    setCurrentDisplayDate(new Date());
  };

  const onMouseDown = (index: number) => (e: React.MouseEvent) => {
    isResizing.current = index;
    startXRef.current = e.clientX;
    startWidthsRef.current = [...panelWidths];
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current === null) return;
    
    const dx = e.clientX - startXRef.current;
    
    const containerWidth = document.body.clientWidth;

    const dxPercent = (dx / containerWidth) * 100;
    
    const newWidths = [...startWidthsRef.current];
    const leftPanelIndex = isResizing.current;
    const rightPanelIndex = isResizing.current + 1;

    const minWidth = 15;

    let proposedLeftWidth = newWidths[leftPanelIndex] + dxPercent;
    let proposedRightWidth = newWidths[rightPanelIndex] - dxPercent;
    
    if (proposedLeftWidth < minWidth) {
        proposedRightWidth += proposedLeftWidth - minWidth;
        proposedLeftWidth = minWidth;
    }
    if (proposedRightWidth < minWidth) {
        proposedLeftWidth += proposedRightWidth - minWidth;
        proposedRightWidth = minWidth;
    }
    
    newWidths[leftPanelIndex] = proposedLeftWidth;
    newWidths[rightPanelIndex] = proposedRightWidth;

    setPanelWidths(newWidths);
  }, []);

  const onMouseUp = useCallback(() => {
    isResizing.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const fetchTaskData = useCallback(async () => {
    if (!user || !isMaximized) return;
    setIsTasksLoading(true);
    try {
      const lists = await getGoogleTaskLists(user.uid);
      setTaskLists(lists);

      const defaultListId = lists.find(l => l.title.includes('My Tasks'))?.id || lists[0]?.id;
      if (defaultListId) {
        setActivePlannerView(defaultListId);
      }
      
      const tasksPromises = lists.map(list => getAllTasksFromList(user.uid, list.id));
      const tasksResults = await Promise.all(tasksPromises);
      
      const tasksByListId: TasksByList = {};
      lists.forEach((list, index) => {
        tasksByListId[list.id] = tasksResults[index];
      });
      setTasks(tasksByListId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch tasks.", variant: "destructive" });
    } finally {
      setIsTasksLoading(false);
    }
  }, [user, isMaximized, toast]);
  
  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);


  const handleAddTask = async (listId: string, title: string) => {
    if (!user) return;

    const tempId = `temp-${Date.now()}`;
    const newTask: RawGoogleTask = {
      id: tempId,
      title,
      status: 'needsAction',
      updated: new Date().toISOString(),
    };

    setTasks(prev => ({
      ...prev,
      [listId]: [newTask, ...(prev[listId] || [])],
    }));

    try {
      const createdTask = await createGoogleTask(user.uid, listId, { title });
      setTasks(prev => ({
        ...prev,
        [listId]: prev[listId].map(t => t.id === tempId ? createdTask as RawGoogleTask : t),
      }));
    } catch (error) {
      setTasks(prev => ({
        ...prev,
        [listId]: prev[listId].filter(t => t.id !== tempId),
      }));
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => {
    setDraggedTask(task);
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(task));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => {
    e.preventDefault();
    if(draggedTask){
        setGhostEvent({ date, hour });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropDate: Date, dropHour: number) => {
    e.preventDefault();
    setGhostEvent(null);
    if (!draggedTask) return;

    const newEventDate = set(dropDate, { hours: dropHour, minutes: 0, seconds: 0, milliseconds: 0 });

    const newEvent: TimelineEvent = {
        id: `custom-${Date.now()}`,
        title: draggedTask.title,
        date: newEventDate,
        endDate: undefined,
        type: 'custom',
        notes: draggedTask.notes,
        isAllDay: false,
        isDeletable: true,
        priority: 'None',
        status: 'pending',
        icon: CalendarDays,
        reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
    };
    
    if (onEditEvent) {
      onEditEvent(newEvent, true);
    }
    
    setDraggedTask(null);
  };

  useEffect(() => {
    if (isToday && !isMaximized && nowIndicatorRef.current) {
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
  }, [isToday, isMaximized]);
  
  const eventsForDayView = useMemo(() => {
    return allEvents.filter(event =>
        event.date instanceof Date && !isNaN(event.date.valueOf()) &&
        isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(initialDate))
    );
  }, [allEvents, initialDate]);

  const allDayEvents = useMemo(() => eventsForDayView.filter(e => e.isAllDay), [eventsForDayView]);
  const timedEvents = useMemo(() => eventsForDayView.filter(e => !e.isAllDay && e.date instanceof Date && !isNaN(e.date.valueOf())), [eventsForDayView]);
  
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
    const countdownText = getCountdownText(event.date);
    const notesString = event.notes ? `Notes: ${event.notes}` : '';
    return [event.title, timeString, countdownText, statusString, notesString].filter(Boolean).join('\n');
  };

  const currentTimeTopPosition = isToday ? (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT_PX / 60) : 0;
  
  const renderMaximizedView = () => (
     <div className="fixed inset-0 top-16 z-40 bg-[#171717] text-white flex flex-col">
        <PlannerHeader activeView={plannerViewMode} date={currentDisplayDate} onNavigate={handleNavigate} onTodayClick={handleTodayClick} onMinimize={() => setIsMaximized(false)} onViewChange={setPlannerViewMode}/>
        <div className="flex flex-1 min-h-0">
            <div style={{ width: `${panelWidths[0]}%` }} className="flex-shrink-0 flex-grow-0"><PlannerSidebar activeView={activePlannerView} setActiveView={setActivePlannerView} /></div>
            <Resizer onMouseDown={onMouseDown(0)} />
            <div style={{ width: `${panelWidths[1]}%` }} className="flex-shrink-0 flex-grow-0">
               {isTasksLoading ? (
                 <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>
               ) : (
                  <PlannerTaskList
                    taskLists={taskLists}
                    tasks={tasks[activePlannerView] || []}
                    activeListId={activePlannerView}
                    onAddTask={handleAddTask}
                    onDragStart={handleDragStart}
                  />
               )}
            </div>
            <Resizer onMouseDown={onMouseDown(1)} />
            <div style={{ width: `${panelWidths[2]}%` }} className="flex-1 overflow-auto">
                {plannerViewMode === 'week' && (
                   <PlannerWeeklyTimeline week={currentWeekDays} events={allEvents} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent}/>
                )}
                {plannerViewMode === 'day' && <div className="p-4">Day View Component Here</div>}
                {plannerViewMode === 'month' && <PlannerMonthView month={currentDisplayDate} events={allEvents} />}
            </div>
        </div>
    </div>
  );

  if (isMaximized) {
    return renderMaximizedView();
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
            {format(initialDate, 'MMMM d, yyyy')}
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
            const isChecked = event.status === 'completed' || (event.status !== 'missed' && isDayInPast);

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

                  <div className="relative timetable-grid-bg" style={{ height: `${hours.length * HOUR_HEIGHT_PX}px`, minWidth: minEventGridWidth }}> 
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

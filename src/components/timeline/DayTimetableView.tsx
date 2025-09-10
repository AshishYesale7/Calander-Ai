
'use client';

import type { TimelineEvent, GoogleTaskList, RawGoogleTask } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isFuture, isPast, formatDistanceToNowStrict, startOfWeek, endOfWeek, eachDayOfInterval, getHours, getMinutes, addWeeks, subWeeks, set, startOfDay as dfnsStartOfDay, addMonths, subMonths, startOfMonth, endOfMonth, addDays, getDay, isWithinInterval, differenceInCalendarDays, parseISO, isSameDay } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, Info, CalendarDays, Maximize, Minimize, Settings, Palette, Inbox, Calendar, Star, Columns, GripVertical, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Plus, Link as LinkIcon, Lock, Activity, Tag, Flag, MapPin, Hash, Image as ImageIcon, Filter, LayoutGrid, UserPlus, Clock, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
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
import { isToday as dfnsIsToday } from 'date-fns';


const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90;
const minuteRulerHeightClass = 'h-8'; 

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
      backgroundColor: `rgba(${r},${g},${b},0.8)`, // Increased opacity
      borderColor: color,
      color: (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? '#333' : '#fff' // Set text color based on background brightness
    };
  }
  return { backgroundColor: `${color}B3`, borderColor: color }; // B3 is ~70% opacity
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
    
    currentGroup.sort((a,b) => a.originalIndex - b.originalIndex);

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
type MaxViewTheme = 'light' | 'dark';

const PlannerHeader = ({ 
    activeView, 
    date,
    onNavigate,
    onTodayClick, 
    onMinimize, 
    onViewChange,
    onToggleSidebar,
    isSidebarOpen,
    viewTheme,
    onToggleTheme,
}: { 
    activeView: PlannerViewMode;
    date: Date;
    onNavigate: (direction: 'prev' | 'next') => void;
    onTodayClick: () => void;
    onMinimize: () => void;
    onViewChange: (view: PlannerViewMode) => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    viewTheme: MaxViewTheme;
    onToggleTheme: () => void;
}) => {
    const getTitle = () => {
        switch(activeView) {
            case 'day': return format(date, 'MMM d, yyyy');
            case 'week': return `${format(startOfWeek(date, {weekStartsOn:0}), 'MMM d')} - ${format(endOfWeek(date, {weekStartsOn:0}), 'MMM d, yyyy')}`;
            case 'month': return format(date, 'MMMM yyyy');
        }
    };

    const headerClasses = viewTheme === 'dark'
        ? 'border-gray-700/50 text-gray-300'
        : 'border-stone-200 bg-[#fff8ed] text-gray-700';
    const buttonClasses = viewTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-stone-200';
    const textClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-900';
    const viewModeButtonContainer = viewTheme === 'dark' ? 'bg-gray-800/50' : 'bg-[#faefdd]';


    return (
        <header className={cn("p-1 border-b flex justify-between items-center flex-shrink-0 text-xs", headerClasses)}>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={onToggleSidebar}>
                    {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
                <div className={cn("h-5 w-px", viewTheme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-300')} />
                <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={() => onNavigate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className={cn("font-semibold px-2 text-sm", textClasses)}>{getTitle()}</h2>
                <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={() => onNavigate('next')}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" className={cn("h-7 px-2 text-xs", buttonClasses)} onClick={onTodayClick}>Today</Button>
            </div>
            
            {/* Desktop View Buttons */}
            <div className={cn("hidden md:flex items-center gap-1 p-0.5 rounded-md", viewModeButtonContainer)}>
                <Button onClick={() => onViewChange('day')} variant={activeView === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs">{activeView === 'day' ? <span className="bg-white text-black rounded-md px-2 py-0.5">Day</span> : 'Day'}</Button>
                <Button onClick={() => onViewChange('week')} variant={activeView === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs">{activeView === 'week' ? <span className="bg-white text-black rounded-md px-2 py-0.5">Week</span> : 'Week'}</Button>
                <Button onClick={() => onViewChange('month')} variant={activeView === 'month' ? 'secondary' : 'ghost'} size="sm" className="h-6 px-2 text-xs">{activeView === 'month' ? <span className="bg-white text-black rounded-md px-2 py-0.5">Month</span> : 'Month'}</Button>
            </div>
            
            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("h-7 px-2 text-xs capitalize", buttonClasses)}>
                    {activeView}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="frosted-glass">
                  <DropdownMenuItem onClick={() => onViewChange('day')}>Day</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewChange('week')}>Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewChange('month')}>Month</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)} onClick={onToggleTheme}><Palette className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)}><UserPlus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className={cn("h-7 w-7", buttonClasses)}><Plus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={onMinimize} aria-label="Minimize view" className={cn("h-7 w-7", buttonClasses)}>
                    <Minimize className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
};


const PlannerSidebar = ({ activeView, setActiveView, viewTheme }: { activeView: string, setActiveView: (view: string) => void, viewTheme: MaxViewTheme }) => {
    
    // Hardcoded structure based on the user's image
    const mainSections = [
        { id: 'inbox', icon: Inbox, label: 'Inbox', badge: 6 },
        { id: 'today', icon: Calendar, label: 'Today' },
        { id: 'upcoming', icon: Star, label: 'Upcoming' },
        { id: 'all_tasks', icon: Columns, label: 'All tasks' },
    ];

    const projectSections = [
        { id: 'book', color: 'bg-red-500', label: 'Book' },
        { id: 'newsletter', color: 'bg-green-500', label: 'Newsletter' },
        { id: 'fitness', color: 'bg-yellow-500', label: 'Fitness' },
        { id: 'work', color: 'bg-indigo-500', label: 'Work' },
        { id: 'film', color: 'bg-blue-500', label: 'Film' },
    ];
    
    const utilitySections = [
        { id: 'statistics', icon: Clock, label: 'Statistics'},
        { id: 'daily_planning', icon: Palette, label: 'Daily Planning'},
    ];

    const sidebarClasses = viewTheme === 'dark' ? 'bg-gray-900/50 text-gray-300' : 'bg-[#fff8ed] text-gray-700';
    const buttonClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-stone-200';
    const activeBtnClasses = viewTheme === 'dark' ? 'bg-gray-700/50 text-white' : 'bg-stone-200 text-gray-900';
    const headingClasses = viewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    const separatorClasses = viewTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-200';
    const badgeClasses = viewTheme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-300 text-gray-600';


    return (
        <div className={cn("p-2 flex flex-col gap-4 text-xs h-full", sidebarClasses)}>
            <div className="space-y-1">
                {mainSections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveView(s.id)}
                        className={cn(
                            "w-full flex items-center justify-between gap-3 p-1.5 rounded-md",
                            buttonClasses,
                            activeView === s.id && cn('font-semibold', activeBtnClasses)
                        )}
                    >
                        <div className="flex items-center gap-3">
                           <s.icon size={16} /><span>{s.label}</span>
                        </div>
                        {s.badge && <span className={cn("text-xs font-bold px-1.5 rounded-full", badgeClasses)}>{s.badge}</span>}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <h3 className={cn("text-[10px] font-bold px-1.5 mb-1 tracking-wider uppercase", headingClasses)}>Projects</h3>
                 {projectSections.map(p => (
                     <button key={p.id} onClick={() => setActiveView(p.id)} className={cn("w-full flex items-center gap-3 p-1.5 rounded-md", buttonClasses, activeView === p.id && cn('font-semibold', activeBtnClasses))}>
                         <span className={cn("h-2.5 w-2.5 rounded-full", p.color)}></span>
                         <span>{p.label}</span>
                     </button>
                 ))}
            </div>

            <div className="space-y-2">
                 <h3 className={cn("text-[10px] font-bold px-1.5 mb-1 tracking-wider uppercase", headingClasses)}>Tags</h3>
                 {/* Placeholder for tags */}
            </div>

            <div className={cn("mt-auto border-t pt-2 space-y-1", separatorClasses)}>
                 {utilitySections.map(u => (
                    <button key={u.id} onClick={() => setActiveView(u.id)} className={cn("w-full flex items-center gap-3 p-1.5 rounded-md", buttonClasses, activeView === u.id && cn('font-semibold', activeBtnClasses))}>
                        <u.icon size={16} /><span>{u.label}</span>
                    </button>
                 ))}
            </div>
             <div className="shrink-0">
                <div className={cn("h-px w-full my-1", separatorClasses)}></div>
                <div className={cn("flex items-center gap-2 p-1.5 rounded-md", buttonClasses, "cursor-pointer")}>
                    <span className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">!</span>
                    {/* Placeholder for an alert or info section */}
                </div>
            </div>
        </div>
    );
};


const PlannerTaskList = ({
  taskLists,
  tasks,
  activeListId,
  onAddTask,
  onDragStart,
  viewTheme,
}: {
  taskLists: GoogleTaskList[];
  tasks: RawGoogleTask[];
  activeListId: string;
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
  viewTheme: MaxViewTheme;
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
    
    const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
    const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';
    const placeholderClasses = viewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    const taskItemClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200';
    const taskTextClasses = viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700';


    return (
        <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
            <div className="flex justify-between items-center mb-2 px-1">
                <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}>
                    <Inbox size={16} /> {activeList?.title || 'Inbox'}
                </h1>
                <Button variant="ghost" size="icon" className="h-6 w-6"><Filter className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAddTask}>
                 <div className={cn("flex items-center gap-2 mb-2 text-xs h-8 px-1.5", viewTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')}>
                    <Plus className="mr-1 h-4 w-4" />
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add new task"
                        className={cn("bg-transparent border-none h-auto p-0 text-xs focus-visible:ring-0", placeholderClasses, headingClasses)}
                    />
                </div>
            </form>
            <div className="space-y-1 text-xs overflow-y-auto">
                {tasks.map(task => {
                    const mockDetails = getMockTaskDetails(task.title);
                    return (
                        <div 
                        key={task.id} 
                        className={cn("p-1.5 rounded-md flex flex-col items-start cursor-grab", taskItemClasses)}
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        >
                            <div className="flex items-start gap-2 w-full">
                                <Checkbox id={task.id} className={cn("h-3.5 w-3.5 mt-0.5", viewTheme === 'dark' ? 'border-gray-500' : 'border-gray-400')} />
                                <label htmlFor={task.id} className={cn("text-xs flex-1", taskTextClasses)}>{task.title}</label>
                                {mockDetails.duration && (
                                    <span className={cn("text-[10px] font-medium whitespace-nowrap", viewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>{mockDetails.duration}</span>
                                )}
                                {mockDetails.tag && (
                                    <span className={cn("text-white text-[10px] font-bold px-1.5 py-0.5 rounded", mockDetails.tag.color)}>{mockDetails.tag.name}</span>
                                )}
                            </div>
                             {mockDetails.metadata && (
                                <div className={cn("pl-6 text-[10px] flex items-center gap-1", viewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
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

const HOUR_SLOT_HEIGHT = 50;

// Corrected layout calculation for weekly view
function calculateWeeklyEventLayouts(timedEvents: TimelineEvent[]): EventWithLayout[] {
  const minuteHeightPx = HOUR_SLOT_HEIGHT / 60;
  
  const events = timedEvents
    .map((e, idx) => {
      const startDate = e.date;
      const endDate = e.endDate;
      if (!(startDate instanceof Date) || isNaN(startDate.valueOf())) return null;

      const start = startDate.getHours() * 60 + startDate.getMinutes();
      let endValue;
      if (endDate && endDate instanceof Date && !isNaN(endDate.valueOf()) && isSameDay(startDate, endDate)) {
        endValue = endDate.getHours() * 60 + endDate.getMinutes();
      } else {
        endValue = start + 60; // Default to 1 hour
      }
      endValue = Math.max(start + 15, endValue); // Min 15 mins

      return { ...e, originalIndex: idx, startInMinutes: start, endInMinutes: endValue };
    })
    .filter(e => e !== null)
    .sort((a, b) => a!.startInMinutes - b!.startInMinutes || (b!.endInMinutes - b!.startInMinutes) - (a!.endInMinutes - a!.startInMinutes));

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
      } else { break; }
    }

    const columns: { event: typeof events[0]; columnOrder: number }[][] = [];
    for (const event of currentGroup) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEventInColumn = columns[c][columns[c].length - 1];
        if (lastEventInColumn.event!.endInMinutes <= event!.startInMinutes) {
          columns[c].push({event: event!, columnOrder: c});
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([{event: event!, columnOrder: columns.length}]);
      }
    }

    const numColsInGroup = columns.length;
    for (const col of columns) {
      for (const item of col) {
        const event = item.event;
        if (!event) continue;
        const colIdx = item.columnOrder;
        
        const colWidthPercentage = 100 / numColsInGroup;
        const gapPercentage = 1;
        const actualColWidth = colWidthPercentage - gapPercentage;
        const leftOffset = colIdx * colWidthPercentage;

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
  return layoutResults;
}


const PlannerWeeklyTimeline = ({ 
  week, 
  events,
  onDrop,
  onDragOver,
  ghostEvent,
  onEditEvent,
  onDeleteEvent,
  viewTheme,
}: { 
  week: Date[], 
  events: TimelineEvent[],
  onDrop: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void,
  onDragOver: (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => void,
  ghostEvent: { date: Date, hour: number } | null,
  onEditEvent?: (event: TimelineEvent) => void;
  onDeleteEvent?: (eventId: string, eventTitle: string) => void;
  viewTheme: MaxViewTheme;
}) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const now = new Date();
    const nowPosition = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);

    const { allDayEventsByDay, timedEventsByDay } = useMemo(() => {
        const weekStart = dfnsStartOfDay(week[0]);
        const weekEnd = endOfWeek(week[0], { weekStartsOn: 0 });
        const relevantEvents = events.filter(e => {
            if (!e.date) return false;
            const eventDate = dfnsStartOfDay(e.date);
            return isWithinInterval(eventDate, {start: weekStart, end: weekEnd});
        });

        const allDay: TimelineEvent[][] = Array.from({ length: 7 }, () => []);
        const timed: TimelineEvent[][] = Array.from({ length: 7 }, () => []);

        relevantEvents.forEach(e => {
          const dayIndex = getDay(e.date);
          if (e.isAllDay) {
            allDay[dayIndex].push(e);
          } else {
            timed[dayIndex].push(e);
          }
        });
        
        return { allDayEventsByDay: allDay, timedEventsByDay: timed };
    }, [week, events]);

    const weeklyLayouts = useMemo(() => {
      return timedEventsByDay.map(dayEvents => calculateWeeklyEventLayouts(dayEvents));
    }, [timedEventsByDay]);
    
    const themeClasses = {
      container: viewTheme === 'dark' ? 'bg-black/30' : 'bg-[#fff8ed]',
      headerContainer: viewTheme === 'dark' ? 'bg-[#171717]' : 'bg-[#faefdd]',
      headerCell: viewTheme === 'dark' ? 'border-gray-700/50 text-gray-400' : 'border-stone-200 text-stone-500',
      hourGutter: viewTheme === 'dark' ? 'text-gray-500' : 'text-stone-400',
      hourLine: viewTheme === 'dark' ? 'border-gray-700/50' : 'border-stone-200',
      eventText: viewTheme === 'dark' ? 'text-white' : 'text-gray-900',
    };

    return (
      <div className={cn("flex flex-col flex-1 w-full text-xs h-full", themeClasses.container)}>
        <div className={cn("sticky top-0 z-20 flex-shrink-0", themeClasses.headerContainer)}>
            <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
                <div className={cn("w-12 border-b border-r", themeClasses.headerCell)}></div>
                <div className="grid grid-cols-7 col-span-7 text-center font-semibold text-xs">
                    {week.map((day) => (
                        <div key={day.toISOString()} className={cn("py-2 border-b border-l first:border-l-0", themeClasses.headerCell)}>
                            {format(day, 'EEE d')}
                        </div>
                    ))}
                </div>
            </div>
            <div className={cn("grid grid-cols-[3rem_repeat(7,1fr)] text-xs border-b min-h-[40px]", themeClasses.headerCell)}>
                <div className={cn("w-12 text-right text-[10px] flex-shrink-0 flex items-center justify-center border-r pr-1", themeClasses.headerCell, themeClasses.hourGutter)}>All-day</div>
                <div className="grid grid-cols-7 col-span-7 p-1 gap-1">
                    {allDayEventsByDay.map((dayEvents, dayIndex) => (
                        <div key={dayIndex} className="space-y-0.5">
                            {dayEvents.map((event) => (
                                <Popover key={event.id}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className={cn(
                                                'rounded px-1.5 py-1 font-medium text-[10px] truncate cursor-pointer',
                                                getEventTypeStyleClasses(event.type),
                                            )}
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
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent && onEditEvent(event)}>
                                                    <Edit3 className="h-3.5 w-3.5"/>
                                                </Button>
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
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDeleteEvent && onDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
  
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex overflow-y-auto">
                <div className="flex-1 flex relative">
                    <div className={cn("w-12 text-right text-[10px] flex-shrink-0 flex flex-col", themeClasses.hourGutter)}>
                        <div className="flex-1 relative">
                        {hours.map((hour) => (
                            <div
                            key={hour}
                            className="pr-1 flex items-start justify-end"
                            style={{ height: `${HOUR_HEIGHT_PX}px` }}
                            >
                            {hour > 0 && <span className="-mt-1.5">{hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}</span>}
                            </div>
                        ))}
                        </div>
                    </div>
            
                    <div className="flex-1 relative">
                         {dfnsIsToday(now) && isWithinInterval(now, {start: week[0], end: endOfWeek(week[6])}) && (
                            <div className="absolute h-px bg-purple-500 z-30 left-0" style={{ top: `${nowPosition}px`, right: `calc(-1 * (${themeClasses.headerCell} - 1px))` }}>
                                <div className="w-2 h-2 rounded-full bg-purple-500 absolute -top-[3px] -left-1" />
                            </div>
                        )}
                        <div className="grid grid-cols-7 h-full">
                            {week.map(day => (
                                <div key={day.toISOString()} className={cn("border-l", themeClasses.hourLine, "first:border-l-0")}>
                                {hours.map(hour => (
                                    <div 
                                    key={`${day.toISOString()}-${hour}`} 
                                    className={cn("border-t", themeClasses.hourLine)}
                                    style={{ height: `${HOUR_HEIGHT_PX}px` }}
                                    onDrop={(e) => onDrop(e, day, hour)}
                                    onDragOver={(e) => onDragOver(e, day, hour)}
                                    ></div>
                                ))}
                                </div>
                            ))}
                        </div>
        
                        <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                            {weeklyLayouts.map((dayLayout, dayIndex) => (
                                <div key={dayIndex} className="relative" style={{ gridColumnStart: dayIndex + 1 }}>
                                {dayLayout.map(event => {
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
                                                            {!isShort && event.icon && <event.icon size={12}/>}
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
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent && onEditEvent(event)}>
                                                                <Edit3 className="h-3.5 w-3.5"/>
                                                            </Button>
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
                                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDeleteEvent && onDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )
                                    })}
                                </div>
                            ))}
        
                            {ghostEvent && (
                                <div 
                                    className="border-2 border-dashed border-purple-500 bg-purple-900/30 p-1 rounded-md text-purple-300 opacity-80"
                                    style={{
                                        gridColumnStart: getDay(ghostEvent.date) + 1,
                                        top: `${ghostEvent.hour * HOUR_HEIGHT_PX}px`,
                                        height: `${HOUR_SLOT_HEIGHT}px` // 1 hour duration for ghost
                                    }}
                                >
                                    <p className="text-[10px] font-semibold">Drop to schedule</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};

const PlannerDayView = ({
  date,
  events,
  onEditEvent,
  onDeleteEvent,
  viewTheme,
}: {
  date: Date;
  events: TimelineEvent[];
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onDeleteEvent?: (eventId: string, eventTitle: string) => void;
  viewTheme: MaxViewTheme;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const nowPosition = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);
  
  const themeClasses = {
      container: viewTheme === 'dark' ? 'bg-black/30' : 'bg-[#fff8ed]',
      allDayArea: viewTheme === 'dark' ? 'bg-[#171717] border-b border-gray-700/50' : 'bg-[#faefdd] border-b border-stone-200',
      allDayGutter: viewTheme === 'dark' ? 'text-gray-500 border-r border-gray-700/50' : 'text-stone-400 border-r border-stone-200',
      hourGutter: viewTheme === 'dark' ? 'text-gray-500' : 'text-stone-400',
      hourLine: viewTheme === 'dark' ? 'border-gray-700/50' : 'border-stone-200',
      eventText: viewTheme === 'dark' ? 'text-white' : 'text-gray-900',
    };

  const { allDayEvents, timedEvents } = useMemo(() => {
    const dayEvents = events.filter(event => isSameDay(event.date, date));
    return {
      allDayEvents: dayEvents.filter(e => e.isAllDay),
      timedEvents: dayEvents.filter(e => !e.isAllDay),
    };
  }, [date, events]);
  
  const { eventsWithLayout } = useMemo(
    () => calculateEventLayouts(timedEvents, HOUR_HEIGHT_PX),
    [timedEvents]
  );

  return (
    <div className={cn("flex flex-col flex-1 w-full text-xs h-full", themeClasses.container)}>
        {/* All-Day Events */}
        <div className={cn("sticky top-0 z-20 flex-shrink-0", themeClasses.allDayArea)}>
            <div className="flex items-center text-xs min-h-[40px]">
                <div className={cn("w-12 text-right text-[10px] flex-shrink-0 flex items-center justify-center pr-1", themeClasses.allDayGutter)}>All-day</div>
                <div className="flex-1 p-1 space-y-0.5">
                    {allDayEvents.map((event) => (
                        <Popover key={event.id}>
                            <PopoverTrigger asChild>
                                <div className={cn('rounded px-1.5 py-1 font-medium text-[10px] truncate cursor-pointer', getEventTypeStyleClasses(event.type))}>
                                    {event.title}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 frosted-glass text-xs" side="bottom" align="start">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">{event.title}</h4>
                                    <p className="text-muted-foreground">All-day event</p>
                                    {event.notes && <p className="text-xs text-foreground/80">{event.notes}</p>}
                                    <div className="flex justify-end gap-1 pt-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent && onEditEvent(event)}>
                                            <Edit3 className="h-3.5 w-3.5"/>
                                        </Button>
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
                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDeleteEvent && onDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Main scrollable area */}
        <div className="flex-1 flex overflow-y-auto">
             <div className="flex-1 flex relative">
                {/* Hour Gutter */}
                <div className={cn("w-12 text-right text-[10px] flex-shrink-0 flex flex-col", themeClasses.hourGutter)}>
                    <div className="flex-1 relative">
                        {hours.map((hour) => (
                            <div key={hour} className="pr-1 flex items-start justify-end" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
                                {hour > 0 && <span className="-mt-1.5">{hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}</span>}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Timeline Grid for a single day */}
                <div className="flex-1 relative">
                    {isSameDay(date, now) && (
                        <div className="absolute h-px bg-purple-500 z-30 left-0 right-0" style={{ top: `${nowPosition}px` }}>
                            <div className="w-2 h-2 rounded-full bg-purple-500 absolute -top-[3px] -left-1" />
                        </div>
                    )}
                    <div className="h-full">
                        {hours.map(hour => (
                            <div key={hour} className={cn("border-t", themeClasses.hourLine)} style={{ height: `${HOUR_HEIGHT_PX}px` }}></div>
                        ))}
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none">
                         {eventsWithLayout.map(event => {
                             const isShort = event.layout.height < 40;
                             return (
                                <Popover key={event.id}>
                                    <PopoverTrigger asChild>
                                        <div className={cn('absolute p-1 rounded-md font-medium m-0.5 text-[10px] overflow-hidden pointer-events-auto cursor-pointer', getEventTypeStyleClasses(event.type))} style={event.layout}>
                                            <div className='flex items-center gap-1 text-[10px]'>
                                                {event.reminder.repeat !== 'none' && <Lock size={10} className="shrink-0"/>}
                                                {!isShort && event.icon && <event.icon size={12}/>}
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
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent && onEditEvent(event)}>
                                                    <Edit3 className="h-3.5 w-3.5"/>
                                                </Button>
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
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDeleteEvent && onDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                             )
                         })}
                    </div>
                </div>
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
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

type TimetableViewTheme = 'default' | 'professional' | 'wood';
type ActivePlannerView = 'today' | 'upcoming' | 'all_tasks' | string;

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

  const [panelWidths, setPanelWidths] = useState([18, 22, 60]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const savedWidthsRef = useRef([18, 22, 60]);
  const isResizing = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef<number[]>([]);
  
  const [activePlannerView, setActivePlannerView] = useState<ActivePlannerView>('inbox');
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<TasksByList>({});
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  
  const [currentDisplayDate, setCurrentDisplayDate] = useState(initialDate);
  const [plannerViewMode, setPlannerViewMode] = useState<PlannerViewMode>('day');
  
  const [maximizedViewTheme, setMaximizedViewTheme] = useState<MaxViewTheme>(() => {
    if (typeof window === 'undefined') {
        return 'dark';
    }
    const savedTheme = localStorage.getItem('planner-view-theme') as MaxViewTheme;
    return savedTheme || 'dark';
  });
  
  useEffect(() => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('planner-view-theme', maximizedViewTheme);
      }
  }, [maximizedViewTheme]);
  
  const [draggedTask, setDraggedTask] = useState<RawGoogleTask | null>(null);
  const [ghostEvent, setGhostEvent] = useState<{ date: Date, hour: number } | null>(null);

  const isToday = useMemo(() => dfnsIsToday(currentDisplayDate), [currentDisplayDate]);
  const isDayInPast = useMemo(() => isPast(currentDisplayDate) && !isSameDay(currentDisplayDate, new Date()), [currentDisplayDate]);

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
    savedWidthsRef.current = newWidths;
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
  
  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
        const newIsOpen = !prev;
        if (newIsOpen) {
            setPanelWidths(savedWidthsRef.current);
        } else {
            const totalWidth = panelWidths.reduce((sum, w) => sum + w, 0);
            setPanelWidths([0, 0, totalWidth]);
        }
        return newIsOpen;
    });
  };


  useEffect(() => {
    if (dfnsIsToday(initialDate) && !isMaximized && nowIndicatorRef.current) {
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
  }, [initialDate, isMaximized]);
  
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
    if (!(event.date instanceof Date) || isNaN(event.valueOf())) return event.title;
    const timeString = event.isAllDay ? 'All Day' : `${format(event.date, 'h:mm a')}${event.endDate && event.endDate instanceof Date && !isNaN(event.endDate.valueOf()) ? ` - ${format(event.endDate, 'h:mm a')}` : ''}`;
    const statusString = event.status ? `Status: ${event.status.replace(/-/g, ' ')}` : '';
    const countdownText = getCountdownText(event.date);
    const notesString = event.notes ? `Notes: ${event.notes}` : '';
    return [event.title, timeString, countdownText, statusString, notesString].filter(Boolean).join('\n');
  };

  const nowPosition = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);
  const currentTimeTopPosition = dfnsIsToday(initialDate) ? nowPosition : -1;
  
  const renderMaximizedView = () => (
     <div className={cn("fixed inset-0 top-16 z-40 flex flex-col", maximizedViewTheme === 'dark' ? 'bg-[#171717] text-white' : 'bg-[#fff8ed] text-gray-800')}>
        <PlannerHeader 
          activeView={plannerViewMode} 
          date={currentDisplayDate} 
          onNavigate={handleNavigate} 
          onTodayClick={handleTodayClick} 
          onMinimize={() => setIsMaximized(false)} 
          onViewChange={setPlannerViewMode} 
          onToggleSidebar={handleToggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          viewTheme={maximizedViewTheme}
          onToggleTheme={() => setMaximizedViewTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
        <div className="flex flex-1 min-h-0">
            {isSidebarOpen && (
                <>
                    <div style={{ width: `${panelWidths[0]}%` }} className="flex-shrink-0 flex-grow-0"><PlannerSidebar activeView={activePlannerView} setActiveView={setActivePlannerView} viewTheme={maximizedViewTheme} /></div>
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
                            viewTheme={maximizedViewTheme}
                          />
                       )}
                    </div>
                    <Resizer onMouseDown={onMouseDown(1)} />
                </>
            )}
            <div style={{ width: isSidebarOpen ? `${panelWidths[2]}%` : '100%' }} className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0 flex flex-col">
                    {plannerViewMode === 'week' ? (
                       <PlannerWeeklyTimeline week={currentWeekDays} events={allEvents} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent} onEditEvent={onEditEvent} onDeleteEvent={handleDeleteEvent} viewTheme={maximizedViewTheme} />
                    ) : plannerViewMode === 'day' ? (
                      <PlannerDayView date={currentDisplayDate} events={allEvents} onEditEvent={onEditEvent} onDeleteEvent={handleDeleteEvent} viewTheme={maximizedViewTheme}/>
                    ) : (
                      <PlannerMonthView month={currentDisplayDate} events={allEvents} viewTheme={maximizedViewTheme}/>
                    )}
                </div>
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
            const isChecked = event.status === 'completed' || (event.status !== 'missed' && isDayInPast);

            return (
            <Popover key={event.id}>
              <PopoverTrigger asChild>
                <div
                    className={cn(
                        "rounded-md p-1.5 text-xs flex justify-between items-center transition-opacity cursor-pointer",
                        "hover:bg-muted/50",
                        isDayInPast && "opacity-60 hover:opacity-100 focus-within:opacity-100",
                         getEventTypeStyleClasses(event.type)
                    )}
                    style={event.color ? getCustomColorStyles(event.color) : {}}
                    title={getEventTooltip(event)}
                >
                    <div className="font-medium flex items-center gap-2" onClick={() => handleEventClick(event)}>
                        {getEventTypeIcon(event)} {event.title}
                    </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 frosted-glass">
                    <div className="space-y-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-muted-foreground">All-day event</p>
                        {event.notes && <p className="text-xs text-foreground/80">{event.notes}</p>}
                        <div className="flex justify-end gap-1 pt-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditEvent && onEditEvent(event)}>
                                <Edit3 className="h-3.5 w-3.5"/>
                            </Button>
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
                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteEvent(event.id, event.title)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
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
                    className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    ref={nowIndicatorRef}
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


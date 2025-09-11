

'use client';

import type { TimelineEvent, GoogleTaskList, RawGoogleTask } from '@/types';
import { useMemo, type ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, isSameDay, startOfDay as dfnsStartOfDay } from 'date-fns';
import { Bot, Trash2, XCircle, Edit3, Palette, Maximize, Minimize, GripVertical } from 'lucide-react';
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
import { getGoogleTaskLists, getAllTasksFromList, createGoogleTask } from '@/services/googleTasksService';
import { isToday as dfnsIsToday } from 'date-fns';

// Refactored Imports
import PlannerHeader from '@/components/planner/PlannerHeader';
import PlannerSidebar from '@/components/planner/PlannerSidebar';
import PlannerSecondarySidebar from '@/components/planner/PlannerSecondarySidebar';
import PlannerDayView from '@/components/planner/PlannerDayView';
import PlannerWeeklyView from '@/components/planner/PlannerWeeklyView';
import PlannerMonthView from '@/components/planner/PlannerMonthView';
import { calculateEventLayouts } from '@/components/planner/planner-utils';
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';


const HOUR_HEIGHT_PX = 60;
const MIN_EVENT_COLUMN_WIDTH_PX = 90;
const minuteRulerHeightClass = 'h-8';

type TimetableViewTheme = 'default' | 'professional' | 'wood';
export type ActivePlannerView = 'today' | 'upcoming' | 'all_tasks' | 'gmail' | string;
export type PlannerViewMode = 'day' | 'week' | 'month';
export type MaxViewTheme = 'light' | 'dark';

// --- Main Component ---
interface DayTimetableViewProps {
  date: Date;
  events: TimelineEvent[];
  onClose: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onEventStatusChange?: (eventId: string, status: 'completed' | 'missed') => void;
}

const Resizer = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    className="w-1.5 cursor-col-resize flex items-center justify-center bg-transparent hover:bg-gray-700/50 transition-colors group"
    onMouseDown={onMouseDown}
  >
    <GripVertical className="h-4 w-4 text-gray-600 group-hover:text-white" />
  </div>
);


export default function DayTimetableView({ date: initialDate, events: allEvents, onClose, onDeleteEvent, onEditEvent, onEventStatusChange }: DayTimetableViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewTheme, setViewTheme] = useState<TimetableViewTheme>('default');

  const [panelWidths, setPanelWidths] = useState([15, 25, 60]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const savedWidthsRef = useRef([15, 25, 60]);
  const isResizing = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef<number[]>([]);
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  
  const [activePlannerView, setActivePlannerView] = useState<ActivePlannerView>('today');
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<Record<string, RawGoogleTask[]>>({});
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  
  const [currentDisplayDate, setCurrentDisplayDate] = useState(initialDate);
  const [plannerViewMode, setPlannerViewMode] = useState<PlannerViewMode>('day');
  
  const [maximizedViewTheme, setMaximizedViewTheme] = useState<MaxViewTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('planner-view-theme') as MaxViewTheme) || 'dark';
  });
  
  const [draggedTask, setDraggedTask] = useState<RawGoogleTask | null>(null);
  const [ghostEvent, setGhostEvent] = useState<{ date: Date; hour: number } | null>(null);

  const currentWeekDays = useMemo(() => {
    return eachDayOfInterval({ start: startOfWeek(currentDisplayDate, { weekStartsOn: 0 }), end: endOfWeek(currentDisplayDate, { weekStartsOn: 0 }) });
  }, [currentDisplayDate]);

  useEffect(() => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('planner-view-theme', maximizedViewTheme);
      }
  }, [maximizedViewTheme]);

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
    if (panelsContainerRef.current) {
        startWidthsRef.current = Array.from(panelsContainerRef.current.children)
            .filter(child => child.classList.contains('flex-shrink-0') || child.classList.contains('flex-1'))
            .map(child => child.getBoundingClientRect().width);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current === null || !panelsContainerRef.current) return;
    
    let dx = e.clientX - startXRef.current;
    const containerWidth = panelsContainerRef.current.offsetWidth;
    
    const newWidths = [...startWidthsRef.current];
    const leftPanelIndex = isResizing.current;
    const rightPanelIndex = isResizing.current + 1;

    const minWidth = containerWidth * 0.15; // 15% minimum width

    let proposedLeftWidth = newWidths[leftPanelIndex] + dx;
    let proposedRightWidth = newWidths[rightPanelIndex] - dx;
    
    if (proposedLeftWidth < minWidth) {
        dx = minWidth - newWidths[leftPanelIndex];
        proposedLeftWidth = minWidth;
        proposedRightWidth = newWidths[rightPanelIndex] - dx;
    }
    if (proposedRightWidth < minWidth) {
        dx = newWidths[rightPanelIndex] - minWidth;
        proposedRightWidth = minWidth;
        proposedLeftWidth = newWidths[leftPanelIndex] + dx;
    }
    
    const newPanelWidthsPercent = panelWidths.map((w, i) => {
        if (i === leftPanelIndex) return (proposedLeftWidth / containerWidth) * 100;
        if (i === rightPanelIndex) return (proposedRightWidth / containerWidth) * 100;
        return w;
    });

    const fixedWidthsSum = newPanelWidthsPercent.reduce((sum, width, i) => (i < 2 ? sum + width : sum), 0);
    newPanelWidthsPercent[2] = 100 - fixedWidthsSum;

    setPanelWidths(newPanelWidthsPercent);
  }, [panelWidths]);

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
      if (defaultListId && activePlannerView === 'today') { // Only default if on 'today'
        setActivePlannerView(defaultListId);
      }
      
      const tasksPromises = lists.map(list => getAllTasksFromList(user.uid, list.id));
      const tasksResults = await Promise.all(tasksPromises);
      
      const tasksByListId: Record<string, RawGoogleTask[]> = {};
      lists.forEach((list, index) => {
        tasksByListId[list.id] = tasksResults[index];
      });
      setTasks(tasksByListId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch tasks.", variant: "destructive" });
    } finally {
      setIsTasksLoading(false);
    }
  }, [user, isMaximized, toast, activePlannerView]);
  
  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  const handleAddTask = async (listId: string, title: string) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const newTask: RawGoogleTask = {
      id: tempId, title, status: 'needsAction', updated: new Date().toISOString(),
    };
    setTasks(prev => ({...prev, [listId]: [newTask, ...(prev[listId] || [])]}));
    try {
      const createdTask = await createGoogleTask(user.uid, listId, { title });
      setTasks(prev => ({...prev, [listId]: prev[listId].map(t => t.id === tempId ? createdTask as RawGoogleTask : t)}));
    } catch (error) {
      setTasks(prev => ({...prev, [listId]: prev[listId].filter(t => t.id !== tempId)}));
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
    if(draggedTask) setGhostEvent({ date, hour });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropDate: Date, dropHour: number) => {
    e.preventDefault();
    setGhostEvent(null);
    if (!draggedTask || !onEditEvent) return;

    const newEvent: TimelineEvent = dropHour === -1
      ? { id: `custom-${Date.now()}`, title: draggedTask.title, date: dfnsStartOfDay(dropDate), endDate: dfnsStartOfDay(dropDate), type: 'custom', notes: draggedTask.notes, isAllDay: true, isDeletable: true, priority: 'None', status: 'pending', reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' } }
      : { id: `custom-${Date.now()}`, title: draggedTask.title, date: new Date(dropDate.setHours(dropHour, 0, 0, 0)), type: 'custom', notes: draggedTask.notes, isAllDay: false, isDeletable: true, priority: 'None', status: 'pending', reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' } };
    
    onEditEvent(newEvent, true);
    setDraggedTask(null);
  };
  
  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
        const newIsOpen = !prev;
        if (newIsOpen) setPanelWidths(savedWidthsRef.current);
        else {
            savedWidthsRef.current = panelWidths;
            setPanelWidths([0, 0, 100]);
        }
        return newIsOpen;
    });
  };

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000);
    const timer = setTimeout(() => {
      if (dfnsIsToday(initialDate) && scrollContainerRef.current) {
        const newTop = (now.getHours() * HOUR_HEIGHT_PX) + (now.getMinutes() / 60 * HOUR_HEIGHT_PX);
        scrollContainerRef.current.scrollTo({ top: newTop - scrollContainerRef.current.offsetHeight / 2, behavior: 'smooth' });
      }
    }, 500);
    return () => { clearTimeout(timer); clearInterval(intervalId); };
  }, [initialDate, isMaximized, now]);
  
  const eventsForDayView = useMemo(() => allEvents.filter(event => event.date instanceof Date && !isNaN(event.date.valueOf()) && isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(initialDate))), [allEvents, initialDate]);
  const allDayEvents = useMemo(() => eventsForDayView.filter(e => e.isAllDay), [eventsForDayView]);
  const timedEvents = useMemo(() => eventsForDayView.filter(e => !e.isAllDay && e.date instanceof Date && !isNaN(e.date.valueOf())), [eventsForDayView]);
  const { eventsWithLayout: timedEventsWithLayout, maxConcurrentColumns } = useMemo(() => calculateEventLayouts(timedEvents), [timedEvents]);
  
  const minEventGridWidth = useMemo(() => maxConcurrentColumns > 3 ? `${Math.max(100, maxConcurrentColumns * MIN_EVENT_COLUMN_WIDTH_PX)}px` : '100%', [maxConcurrentColumns]);

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
      toast({ title: "Event Deleted", description: `"${eventTitle}" has been removed from the timetable.` });
    }
  };

  const handleEventClick = useCallback((event: TimelineEvent) => setSelectedEvent(event), []);
  const handleCloseOverview = useCallback(() => setSelectedEvent(null), []);

  const handleCheckboxChange = (event: TimelineEvent, checked: boolean) => {
    if (onEventStatusChange) {
      const newStatus = checked ? 'completed' : 'missed';
      if (newStatus === 'completed' && user) logUserActivity(user.uid, 'task_completed', { title: event.title });
      onEventStatusChange(event.id, newStatus);
    }
  };

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
        <div className="flex flex-1 min-h-0" ref={panelsContainerRef}>
              {isSidebarOpen && (
                  <>
                      <div className="flex-shrink-0 flex-grow-0" style={{ width: `${panelWidths[0]}%` }}>
                         <PlannerSidebar activeView={activePlannerView} setActiveView={setActivePlannerView} viewTheme={maximizedViewTheme} />
                      </div>
                      <Resizer onMouseDown={onMouseDown(0)} />
                      <div className="flex-shrink-0 flex-grow-0" style={{ width: `${panelWidths[1]}%` }}>
                         <PlannerSecondarySidebar
                            activeView={activePlannerView}
                            tasks={tasks}
                            taskLists={taskLists}
                            isLoading={isTasksLoading}
                            onAddTask={handleAddTask}
                            onDragStart={handleDragStart}
                            viewTheme={maximizedViewTheme}
                          />
                      </div>
                      <Resizer onMouseDown={onMouseDown(1)} />
                  </>
              )}
              <div className="flex-1 flex flex-col" style={{ width: isSidebarOpen ? `${panelWidths[2]}%` : '100%' }}>
                  <div className="flex-1 min-h-0 flex flex-col">
                      {plannerViewMode === 'week' ? (
                         <PlannerWeeklyView week={currentWeekDays} events={allEvents} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent} onEditEvent={onEditEvent} onDeleteEvent={handleDeleteClick} viewTheme={maximizedViewTheme} />
                      ) : plannerViewMode === 'day' ? (
                        <PlannerDayView date={currentDisplayDate} events={allEvents} onEditEvent={onEditEvent} onDeleteEvent={handleDeleteClick} viewTheme={maximizedViewTheme} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent} />
                      ) : (
                        <PlannerMonthView month={currentDisplayDate} events={allEvents} viewTheme={maximizedViewTheme}/>
                      )}
                  </div>
              </div>
        </div>
    </div>
  );

  if (isMaximized) return renderMaximizedView();

  return (
    <Card className={cn("frosted-glass w-full shadow-xl flex flex-col transition-all duration-300 max-h-[70vh]")} data-theme={viewTheme}>
      <CardHeader className="p-4 border-b border-border/30 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-xl text-primary">{format(initialDate, 'MMMM d, yyyy')}</CardTitle>
          <CardDescription>Hourly schedule. Scroll to see all hours and events.</CardDescription>
        </div>
        <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Theme settings"><Palette className="h-6 w-6 text-muted-foreground hover:text-primary" /></Button></PopoverTrigger>
              <PopoverContent className="w-56 frosted-glass">
                <RadioGroup value={viewTheme} onValueChange={(v) => setViewTheme(v as TimetableViewTheme)}>
                  <div className="space-y-1">
                    <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"><RadioGroupItem value="default" id="t-default" /><span>Default</span></Label>
                    <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"><RadioGroupItem value="professional" id="t-prof" /><span>Professional</span></Label>
                    <Label className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"><RadioGroupItem value="wood" id="t-wood" /><span>Wood Plank</span></Label>
                  </div>
                </RadioGroup>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} aria-label={isMaximized ? "Minimize view" : "Maximize view"}><Maximize className="h-6 w-6 text-muted-foreground hover:text-primary" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close day timetable view"><XCircle className="h-6 w-6 text-muted-foreground hover:text-primary" /></Button>
        </div>
      </CardHeader>
      <PlannerDayView date={initialDate} events={allEvents} onEditEvent={onEditEvent} onDeleteEvent={handleDeleteClick} viewTheme={'default'} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent} />
    </Card>
  );
}


'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, set, startOfDay as dfnsStartOfDay, endOfDay, isSameDay } from 'date-fns';
import type { TimelineEvent, GoogleTaskList, RawGoogleTask } from '@/types';
import { getGoogleTaskLists, getAllTasksFromList, createGoogleTask, updateGoogleTask } from '@/services/googleTasksService';

import PlannerHeader from './PlannerHeader';
import PlannerSidebar from './PlannerSidebar';
import PlannerSecondarySidebar from './PlannerSecondarySidebar';
import PlannerDayView from './PlannerDayView';
import PlannerWeeklyView from './PlannerWeeklyView';
import PlannerMonthView from './PlannerMonthView';
import { GripVertical } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/context/ChatContext';

export type ActivePlannerView = 'today' | 'upcoming' | 'all_tasks' | 'gmail' | string;
export type PlannerViewMode = 'day' | 'week' | 'month';
export type MaxViewTheme = 'light' | 'dark';

const Resizer = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <div
      className="w-1.5 cursor-col-resize flex items-center justify-center bg-transparent hover:bg-gray-700/50 transition-colors group"
      onMouseDown={onMouseDown}
    >
      <GripVertical className="h-4 w-4 text-gray-600 group-hover:text-white" />
    </div>
);

interface MaximizedPlannerViewProps {
  initialDate: Date;
  allEvents: TimelineEvent[];
  onMinimize: () => void;
  onEditEvent?: (event: TimelineEvent, isNew?: boolean) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export default function MaximizedPlannerView({ initialDate, allEvents, onMinimize, onEditEvent, onDeleteEvent }: MaximizedPlannerViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isChatSidebarOpen, chattingWith, chatSidebarWidth } = useChat();

  const [panelWidths, setPanelWidths] = useState([20, 25, 55]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const savedWidthsRef = useRef([20, 25, 55]);
  const isResizing = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef<number[]>([]);
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const [activePlannerView, setActivePlannerView] = useState<ActivePlannerView>('gmail');
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [tasks, setTasks] = useState<Record<string, RawGoogleTask[]>>({});
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  
  const [currentDisplayDate, setCurrentDisplayDate] = useState(initialDate);
  const [plannerViewMode, setPlannerViewMode] = useState<PlannerViewMode>('week');
  
  const [maximizedViewTheme, setMaximizedViewTheme] = useState<MaxViewTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('planner-view-theme') as MaxViewTheme) || 'dark';
  });
  
  const [draggedTask, setDraggedTask] = useState<RawGoogleTask | null>(null);
  type GhostEvent = { date: Date; hour: number; title?: string };
  const [ghostEvent, setGhostEvent] = useState<GhostEvent | null>(null);

  const ghostEventRef = useRef<GhostEvent | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [eventToCreate, setEventToCreate] = useState<TimelineEvent | null>(null);

  const [userHasToggledSidebar, setUserHasToggledSidebar] = useState(false);

  const currentWeekDays = useMemo(() => {
    return eachDayOfInterval({ start: startOfWeek(currentDisplayDate, { weekStartsOn: 0 }), end: endOfWeek(currentDisplayDate, { weekStartsOn: 0 }) });
  }, [currentDisplayDate]);

  useEffect(() => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('planner-view-theme', maximizedViewTheme);
      }
  }, [maximizedViewTheme]);

  useEffect(() => {
    if (eventToCreate && onEditEvent) {
        onEditEvent(eventToCreate, true);
        setEventToCreate(null); // Reset after saving
    }
  }, [eventToCreate, onEditEvent]);

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

    const minWidth = containerWidth * 0.15;

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
    if (!user) return;
    setIsTasksLoading(true);
    try {
      const lists = await getGoogleTaskLists(user.uid);
      setTaskLists(lists);
      
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
  }, [user, toast]);
  
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

  const throttledSetGhostEvent = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
        setGhostEvent(ghostEventRef.current);
    });
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

    if (draggedTask) {
        const currentGhost = ghostEventRef.current;
        if (!currentGhost || !isSameDay(currentGhost.date, date) || currentGhost.hour !== hour) {
            ghostEventRef.current = { date, hour, title: draggedTask.title };
            throttledSetGhostEvent();
        }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropDate: Date, dropHour: number) => {
    e.preventDefault();
    if (!draggedTask) return;

    const newEvent: TimelineEvent = dropHour === -1
      ? { id: `custom-${Date.now()}`, title: draggedTask.title, date: dfnsStartOfDay(dropDate), endDate: endOfDay(dropDate), type: 'custom', notes: draggedTask.notes, isAllDay: true, isDeletable: true, priority: 'None', status: 'pending', reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' } }
      : { id: `custom-${Date.now()}`, title: draggedTask.title, date: set(dropDate, { hours: dropHour, minutes: 0, seconds: 0, milliseconds: 0 }), type: 'custom', notes: draggedTask.notes, isAllDay: false, isDeletable: true, priority: 'None', status: 'pending', reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' } };
    
    setEventToCreate(newEvent);
    handleDragEnd();
  };
  
  const handleDragEnd = (e?: React.DragEvent) => {
    setDraggedTask(null);
    setGhostEvent(null);
    ghostEventRef.current = null;
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
  };
  
  const handleToggleSidebar = useCallback(() => {
    setUserHasToggledSidebar(true); // Mark that user has interacted
    setIsSidebarOpen(prev => {
        const newIsOpen = !prev;
        if (newIsOpen) {
            // Restore saved widths for the first two panels, hide the third
            const restoredWidths = [...savedWidthsRef.current];
            const sumFirstTwo = restoredWidths[0] + restoredWidths[1];
            if (sumFirstTwo > 0) {
                // Keep ratio but make them sum to 100
                restoredWidths[0] = (restoredWidths[0] / sumFirstTwo) * 100;
                restoredWidths[1] = (restoredWidths[1] / sumFirstTwo) * 100;
            } else {
                restoredWidths[0] = 50; // Default to 50/50 if saved widths were zero
                restoredWidths[1] = 50;
            }
            restoredWidths[2] = 0; // Explicitly hide the calendar view
            setPanelWidths(restoredWidths);
        } else {
            // Save current state before collapsing
            savedWidthsRef.current = panelWidths;
            setPanelWidths([0, 0, 100]);
        }
        return newIsOpen;
    });
  }, [panelWidths]);
  
  // Auto-collapse planner sidebars when chat is fully open, but respect manual override
  useEffect(() => {
    const chatFullyOpen = !isMobile && isChatSidebarOpen && chattingWith;
    
    if (chatFullyOpen) {
        if (isSidebarOpen && !userHasToggledSidebar) {
            handleToggleSidebar();
        }
    } else {
        // Reset the manual override flag when the condition is no longer met
        if (userHasToggledSidebar) {
            setUserHasToggledSidebar(false);
        }
    }
  }, [isMobile, isChatSidebarOpen, chattingWith, isSidebarOpen, handleToggleSidebar, userHasToggledSidebar]);

  const handleTaskStatusChange = async (listId: string, taskId: string) => {
    if (!user) return;
    
    const taskToUpdate = tasks[listId]?.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const newStatus = taskToUpdate.status === 'completed' ? 'needsAction' : 'completed';
    
    setTasks(prev => ({
      ...prev,
      [listId]: prev[listId].map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    }));

    try {
      await updateGoogleTask(user.uid, listId, taskId, { status: newStatus });
    } catch (error) {
      toast({ title: "Sync Error", description: "Failed to update task in Google.", variant: 'destructive' });
      setTasks(prev => ({
        ...prev,
        [listId]: prev[listId].map(t => t.id === taskId ? { ...t, status: taskToUpdate.status } : t)
      }));
    }
  };

  return (
     <div 
        className={cn("absolute inset-y-0 left-0 flex flex-col z-30", maximizedViewTheme === 'dark' ? 'bg-[#101010] text-white' : 'bg-stone-50 text-gray-800')}
        style={{ top: '4rem', right: `${chatSidebarWidth}px` }}
     >
        <PlannerHeader 
          activeView={plannerViewMode} 
          date={currentDisplayDate} 
          onNavigate={handleNavigate} 
          onTodayClick={handleTodayClick} 
          onMinimize={onMinimize} 
          onViewChange={setPlannerViewMode} 
          onToggleSidebar={handleToggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          viewTheme={maximizedViewTheme}
          onToggleTheme={() => setMaximizedViewTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
        <div className="flex flex-1 min-h-0" ref={panelsContainerRef}>
              {(isSidebarOpen && panelWidths[0] > 0) && (
                  <>
                      <div className="flex-shrink-0 flex-grow-0" style={{ width: isMobile ? '9rem' : `${panelWidths[0]}%` }}>
                         <PlannerSidebar activeView={activePlannerView} setActiveView={setActivePlannerView} viewTheme={maximizedViewTheme} />
                      </div>
                      {!isMobile && <Resizer onMouseDown={onMouseDown(0)} />}
                      <div className="flex-shrink-0 flex-grow-0" style={{ width: isMobile ? '15rem' : `${panelWidths[1]}%` }}>
                         <PlannerSecondarySidebar
                            activeView={activePlannerView}
                            tasks={tasks}
                            taskLists={taskLists}
                            isLoading={isTasksLoading}
                            onAddTask={handleAddTask}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onStatusChange={handleTaskStatusChange}
                            viewTheme={maximizedViewTheme}
                          />
                      </div>
                      {!isMobile && panelWidths[2] > 0 && <Resizer onMouseDown={onMouseDown(1)} />}
                  </>
              )}
              {panelWidths[2] > 0 && (
                  <div className="flex-1 flex flex-col" style={{ width: `${panelWidths[2]}%` }}>
                      <div className="flex-1 min-h-0 flex flex-col">
                          {plannerViewMode === 'week' ? (
                             <PlannerWeeklyView week={currentWeekDays} events={allEvents} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} viewTheme={maximizedViewTheme} />
                          ) : plannerViewMode === 'day' ? (
                            <PlannerDayView date={currentDisplayDate} events={allEvents} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} viewTheme={maximizedViewTheme} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent} />
                          ) : (
                            <PlannerMonthView month={currentDisplayDate} events={allEvents} viewTheme={maximizedViewTheme} onDrop={handleDrop} onDragOver={handleDragOver} ghostEvent={ghostEvent}/>
                          )}
                      </div>
                  </div>
              )}
        </div>
    </div>
  );
}

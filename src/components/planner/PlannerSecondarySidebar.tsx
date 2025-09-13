
'use client';

import type { ReactNode } from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { GoogleTaskList, RawGoogleTask, RawGmailMessage, GmailLabel } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '../ui/checkbox';
import { Plus, Mail, Inbox, Filter, RefreshCw, Bot, Calendar, Columns } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { ActivePlannerView, MaxViewTheme } from './MaximizedPlannerView';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { getGoogleGmailMessages } from '@/services/googleGmailService';

const PlannerGmailList = ({ viewTheme, onDragStart, onDragEnd, dateQuery }: { viewTheme: MaxViewTheme, onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void, onDragEnd: (e?: React.DragEvent) => void, dateQuery?: 'today' }) => {
    const { user } = useAuth();
    const { apiKey } = useApiKey();
    const { toast } = useToast();
    const [emails, setEmails] = useState<RawGmailMessage[]>([]);
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [selectedLabelId, setSelectedLabelId] = useState<string>('IMPORTANT');
    const [isLoading, setIsLoading] = useState(false);
    const [summaries, setSummaries] = useState<Record<string, string>>({});
    const [summarizingId, setSummarizingId] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>(null);

    const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
    const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';
    const taskItemClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200';
    const taskTextClasses = viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    const fetchLabels = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/google/labels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
            const data = await res.json();
            if (data.success) setLabels(data.labels);
        } catch (e) { console.error(e) }
    }, [user]);

    const fetchEmails = useCallback(async (labelId: string, pageToken?: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { emails: fetchedEmails, nextPageToken: newNextPageToken } = await getGoogleGmailMessages(user.uid, labelId, pageToken, dateQuery);
            setEmails(prev => pageToken ? [...prev, ...fetchedEmails] : fetchedEmails);
            setNextPageToken(newNextPageToken);
        } catch (error: any) {
            toast({ title: 'Error fetching emails', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast, dateQuery]);

    useEffect(() => {
        if (dateQuery) {
            setEmails([]);
            setNextPageToken(null);
            fetchEmails(selectedLabelId);
        } else {
             fetchLabels();
             setEmails([]);
             setNextPageToken(null);
             fetchEmails(selectedLabelId);
        }
    }, [fetchLabels, fetchEmails, selectedLabelId, dateQuery]);

    const handleSummarize = async (email: RawGmailMessage) => {
        setSummarizingId(email.id);
        try {
            const response = await fetch('/api/ai/summarize-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: email.subject, snippet: email.snippet, apiKey }),
            });
            const data = await response.json();
            if (data.success) {
                setSummaries(prev => ({ ...prev, [email.id]: data.summary }));
            } else {
                throw new Error(data.message || 'Failed to summarize email.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
                toast({ title: 'AI Service Unavailable', description: 'The summarization model is temporarily overloaded. Please try again later.', variant: 'destructive' });
            } else {
                toast({ title: 'Summarization Error', description: errorMessage, variant: 'destructive' });
            }
        } finally {
            setSummarizingId(null);
        }
    };
    
    return (
        <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
             <div className="flex justify-between items-center mb-2 px-1">
                <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}><Mail size={16} /> {dateQuery === 'today' ? 'Today\'s Emails' : 'Gmail'}</h1>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEmails([]); setNextPageToken(null); fetchEmails(selectedLabelId); }}><RefreshCw className={cn("h-4 w-4", isLoading && !nextPageToken && 'animate-spin')} /></Button>
            </div>
            {!dateQuery && labels.length > 0 && (
                 <div className="mb-2">
                    <select value={selectedLabelId} onChange={e => setSelectedLabelId(e.target.value)} className="w-full text-xs p-1 rounded-md bg-transparent border border-gray-600">
                        {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            )}
             <div className="space-y-1 text-xs overflow-y-auto flex-1">
                {isLoading && emails.length === 0 && <div className="text-center p-4"><LoadingSpinner size="sm" /></div>}
                {!isLoading && emails.length === 0 && <div className="text-center p-4 text-xs text-gray-400">No emails for this view.</div>}
                {emails.map(email => (
                    <div 
                        key={email.id} 
                        className={cn("p-1.5 rounded-md flex flex-col items-start cursor-grab", taskItemClasses)}
                        draggable
                        onDragStart={(e) => onDragStart(e, {id: email.id, title: email.subject, notes: email.snippet} as RawGoogleTask)}
                        onDragEnd={onDragEnd}
                    >
                        <p className={cn("text-xs font-bold flex-1", taskTextClasses)}>{email.subject}</p>
                        <p className="text-[10px] text-gray-400 w-full truncate">{email.snippet}</p>
                        <div className="flex justify-between w-full items-center mt-1">
                            <Button variant="link" size="sm" className="p-0 h-auto text-blue-400 text-[10px]" onClick={() => window.open(email.link, '_blank')}>View Email</Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={() => handleSummarize(email)} disabled={!!summarizingId}>
                                {summarizingId === email.id ? <LoadingSpinner size="sm"/> : <Bot size={12}/>}
                            </Button>
                        </div>
                        {summaries[email.id] && (
                            <div className="mt-1 p-1.5 bg-blue-900/30 rounded-md border border-blue-500/20 text-blue-200 text-[10px]">
                                {summaries[email.id]}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {nextPageToken && (
                <div className="pt-2 mt-2 border-t border-gray-700/50">
                    <Button variant="outline" className="w-full h-8 text-xs" onClick={() => fetchEmails(selectedLabelId, nextPageToken)} disabled={isLoading}>
                         {isLoading ? <LoadingSpinner size="sm" /> : 'Load More'}
                    </Button>
                </div>
            )}
        </div>
    );
};

const PlannerTodayView = ({
  tasks,
  taskLists,
  onStatusChange,
  onDragStart,
  onDragEnd,
  viewTheme,
}: {
  tasks: Record<string, RawGoogleTask[]>;
  taskLists: GoogleTaskList[];
  onStatusChange: (listId: string, taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
  onDragEnd: (e?: React.DragEvent) => void;
  viewTheme: MaxViewTheme;
}) => {
  const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
  const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';

  const todaysTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return Object.values(tasks).flat().filter(task => task.due && task.due.startsWith(todayStr));
  }, [tasks]);

  return (
    <div className={cn("flex flex-col h-full", taskListClasses)}>
        <div className="p-2 flex-shrink-0">
            <h1 className={cn("text-sm font-bold flex items-center gap-2 mb-2 px-1", headingClasses)}>
                <Calendar size={16} /> Today's Focus
            </h1>
            <div className="space-y-1 text-xs">
                {todaysTasks.length > 0 ? todaysTasks.map(task => {
                   const list = taskLists.find(l => tasks[l.id]?.some(t => t.id === task.id));
                   if (!list) return null;
                   return (
                     <div 
                        key={task.id} 
                        className={cn("p-1.5 rounded-md flex items-start cursor-grab", viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200')}
                        draggable onDragStart={(e) => onDragStart(e, task)} onDragEnd={onDragEnd}
                      >
                         <Checkbox 
                            id={`today-${task.id}`} 
                            className={cn("h-3.5 w-3.5 mt-0.5 mr-2", viewTheme === 'dark' ? 'border-gray-500' : 'border-gray-400')}
                            checked={task.status === 'completed'}
                            onCheckedChange={() => onStatusChange(list.id, task.id)}
                         />
                         <label htmlFor={`today-${task.id}`} className={cn("text-xs flex-1", task.status === 'completed' && 'line-through text-gray-500', viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700')}>{task.title}</label>
                     </div>
                   )
                }) : <p className="text-xs text-gray-400 text-center p-4">No tasks due today.</p>}
            </div>
        </div>
        <div className="flex-1 min-h-0 border-t border-gray-700/50">
             <PlannerGmailList viewTheme={viewTheme} onDragStart={onDragStart} onDragEnd={onDragEnd} dateQuery="today" />
        </div>
    </div>
  );
};


// Rewritten PlannerTaskList to be a simpler, dumber component.
const PlannerTaskList = ({
  list,
  tasks,
  onAddTask,
  onDragStart,
  onDragEnd,
  onStatusChange,
  viewTheme,
}: {
  list: Pick<GoogleTaskList, 'id' | 'title'> & { icon?: React.ElementType }; // Allow for a generic list object
  tasks: RawGoogleTask[];
  onAddTask?: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
  onDragEnd: (e?: React.DragEvent) => void;
  onStatusChange: (listId: string, taskId: string) => void;
  viewTheme: MaxViewTheme;
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const canAddTask = !!onAddTask;

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const title = newTaskTitle.trim();
        if (title && onAddTask) {
            onAddTask(list.id, title);
            setNewTaskTitle('');
        }
    };
    
    // UI styling classes based on theme
    const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
    const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';
    const placeholderClasses = viewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    const taskItemClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200';
    const taskTextClasses = viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700';
    const Icon = list.icon || Inbox;

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const renderTask = (task: RawGoogleTask) => (
        <div 
          key={task.id} 
          className={cn("p-1.5 rounded-md flex items-start cursor-grab", taskItemClasses)}
          draggable
          onDragStart={(e) => onDragStart(e, task)}
          onDragEnd={onDragEnd}
        >
            <Checkbox 
              id={task.id} 
              className={cn("h-3.5 w-3.5 mt-0.5 mr-2", viewTheme === 'dark' ? 'border-gray-500' : 'border-gray-400')} 
              checked={task.status === 'completed'}
              onCheckedChange={() => onStatusChange(list.id, task.id)}
            />
            <label htmlFor={task.id} className={cn("text-xs flex-1", task.status === 'completed' && 'line-through text-gray-500', taskTextClasses)}>
                {task.title}
            </label>
        </div>
    );

    return (
        <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
            <div className="flex justify-between items-center mb-2 px-1">
                <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}>
                    <Icon size={16} /> {list.title}
                </h1>
            </div>
            {canAddTask && (
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
            )}
            <div className="space-y-1 text-xs overflow-y-auto">
                {pendingTasks.map(renderTask)}
                {completedTasks.length > 0 && (
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="completed" className="border-t border-gray-700/50 mt-2 pt-2">
                             <AccordionTrigger className="text-xs text-gray-500 hover:no-underline py-1">Completed ({completedTasks.length})</AccordionTrigger>
                             <AccordionContent className="pb-0 space-y-1">
                                {completedTasks.map(renderTask)}
                             </AccordionContent>
                        </AccordionItem>
                     </Accordion>
                )}
            </div>
        </div>
    );
};


// Main Component
interface PlannerSecondarySidebarProps {
  activeView: ActivePlannerView;
  tasks: Record<string, RawGoogleTask[]>;
  taskLists: GoogleTaskList[];
  isLoading: boolean;
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
  onDragEnd: (e?: React.DragEvent) => void;
  onStatusChange: (listId: string, taskId: string) => void;
  viewTheme: MaxViewTheme;
}

export default function PlannerSecondarySidebar(props: PlannerSecondarySidebarProps) {
  const { activeView, taskLists, tasks, isLoading, onAddTask, onDragStart, onDragEnd, onStatusChange, viewTheme } = props;

  // 1. Handle loading state
  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;
  }
  
  if (activeView === 'today') {
    return <PlannerTodayView {...props} />;
  }

  // 2. Explicitly render Gmail component if activeView is 'gmail'
  if (activeView === 'gmail') {
    return <PlannerGmailList viewTheme={viewTheme} onDragStart={onDragStart} onDragEnd={onDragEnd}/>
  }

  // 3. Handle the "All tasks" view
  if (activeView === 'all_tasks') {
    const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
    const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';
    const taskItemClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200';
    const taskTextClasses = viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    const allCompletedTasks = useMemo(() => 
        Object.values(tasks).flat().filter(t => t.status === 'completed'), 
    [tasks]);

    return (
        <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
            <div className="flex justify-between items-center mb-2 px-1">
                <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}>
                    <Columns size={16} /> All Tasks
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto">
                <Accordion type="multiple" className="w-full space-y-1">
                    {taskLists.map(list => {
                        const pendingTasks = tasks[list.id]?.filter(t => t.status !== 'completed') || [];
                        if (pendingTasks.length === 0) return null;
                        
                        return (
                            <AccordionItem value={list.id} key={list.id} className="border-none">
                                <AccordionTrigger className="p-1.5 rounded-md text-xs font-semibold hover:no-underline hover:bg-gray-700/50">
                                    {list.title}
                                </AccordionTrigger>
                                <AccordionContent className="pl-2 pt-1 pb-0">
                                    <div className="space-y-1 text-xs">
                                        {pendingTasks.map(task => (
                                            <div 
                                              key={task.id} 
                                              className={cn("p-1.5 rounded-md flex items-start cursor-grab", taskItemClasses)}
                                              draggable
                                              onDragStart={(e) => onDragStart(e, task)}
                                              onDragEnd={onDragEnd}
                                            >
                                                <Checkbox 
                                                    id={`all-${task.id}`} 
                                                    className={cn("h-3.5 w-3.5 mt-0.5 mr-2", viewTheme === 'dark' ? 'border-gray-500' : 'border-gray-400')}
                                                    onCheckedChange={() => onStatusChange(list.id, task.id)}
                                                    checked={task.status === 'completed'}
                                                />
                                                <label htmlFor={`all-${task.id}`} className={cn("text-xs flex-1", taskTextClasses)}>{task.title}</label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>

                {allCompletedTasks.length > 0 && (
                    <div className="mt-4">
                        <Accordion type="single" collapsible className="w-full" defaultValue='completed'>
                            <AccordionItem value="completed" className="border-t border-gray-700/50 pt-2">
                                <AccordionTrigger className="text-xs text-gray-500 hover:no-underline py-1">
                                    Completed ({allCompletedTasks.length})
                                </AccordionTrigger>
                                <AccordionContent className="pb-0 space-y-1">
                                    {allCompletedTasks.map(task => {
                                        const list = taskLists.find(l => tasks[l.id]?.some(t => t.id === task.id));
                                        if (!list) return null;
                                        return (
                                             <div key={task.id} className={cn("p-1.5 rounded-md flex items-start", taskItemClasses)}>
                                                <Checkbox 
                                                    id={`all-completed-${task.id}`} 
                                                    className={cn("h-3.5 w-3.5 mt-0.5 mr-2", viewTheme === 'dark' ? 'border-gray-500' : 'border-gray-400')}
                                                    onCheckedChange={() => onStatusChange(list.id, task.id)}
                                                    checked={true}
                                                />
                                                <label htmlFor={`all-completed-${task.id}`} className="text-xs flex-1 line-through text-gray-500">{task.title}</label>
                                            </div>
                                        )
                                    })}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}
            </div>
        </div>
    );
  }

  // 4. Find the selected task list based on activeView ID
  const selectedTaskList = taskLists.find(list => list.id === activeView);
  
  // 5. If a valid task list is selected, render it
  if (selectedTaskList) {
      const tasksForSelectedList = tasks[selectedTaskList.id] || [];
      return <PlannerTaskList 
                list={selectedTaskList}
                tasks={tasksForSelectedList}
                onAddTask={onAddTask}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onStatusChange={onStatusChange}
                viewTheme={viewTheme}
            />
  }

  // 6. If it's a special view like "upcoming", or any other unknown view, render nothing.
  return null;
}

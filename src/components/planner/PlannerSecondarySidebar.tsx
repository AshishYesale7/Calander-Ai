
'use client';

import type { ReactNode } from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { GoogleTaskList, RawGoogleTask, RawGmailMessage, GmailLabel, RawCalendarEvent } from '@/types';
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
import PlannerUpcomingView from './PlannerUpcomingView';
import { format } from 'date-fns';

const PlannerGoogleCalendarList = ({ events, isLoading, viewTheme, onDragStart, onDragEnd }: { events: RawCalendarEvent[], isLoading: boolean, viewTheme: MaxViewTheme, onDragStart: (e: React.DragEvent<HTMLDivElement>, item: RawCalendarEvent) => void, onDragEnd: (e?: React.DragEvent) => void }) => {
    const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
    const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';
    const itemClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200';
    const textClasses = viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    return (
        <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
             <div className="flex justify-between items-center mb-2 px-1">
                <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}><Calendar size={16} /> Google Calendar</h1>
            </div>
             <div className="space-y-1 text-xs overflow-y-auto flex-1">
                {isLoading && events.length === 0 && <div className="text-center p-4"><LoadingSpinner size="sm" /></div>}
                {!isLoading && events.length === 0 && <div className="text-center p-4 text-xs text-gray-400">No upcoming events found.</div>}
                {events.map(event => {
                    const isAllDay = !event.startDateTime.includes('T');
                    return (
                        <div 
                            key={event.id} 
                            className={cn("p-1.5 rounded-md flex flex-col items-start cursor-grab", itemClasses)}
                            draggable
                            onDragStart={(e) => onDragStart(e, event)}
                            onDragEnd={onDragEnd}
                        >
                            <p className={cn("text-xs font-bold flex-1", textClasses)}>{event.summary}</p>
                            <p className="text-[10px] text-gray-400 w-full truncate">
                                {isAllDay 
                                    ? format(new Date(event.startDateTime), 'MMM d') 
                                    : `${format(new Date(event.startDateTime), 'MMM d, p')}`
                                }
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
};


const PlannerGmailList = ({ viewTheme, onDragStart, onDragEnd, dateQuery }: { viewTheme: MaxViewTheme, onDragStart: (e: React.DragEvent<HTMLDivElement>, item: RawGmailMessage) => void, onDragEnd: (e?: React.DragEvent) => void, dateQuery?: 'today' }) => {
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
                        onDragStart={(e) => onDragStart(e, email as unknown as RawGoogleTask)}
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

const PlannerTaskList = ({
  list,
  tasks,
  isTasksLoading,
  onAddTask,
  onDragStart,
  onDragEnd,
  onStatusChange,
  viewTheme,
}: {
  list: GoogleTaskList;
  tasks: RawGoogleTask[];
  isTasksLoading: boolean;
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, item: RawGoogleTask) => void;
  onDragEnd: (e?: React.DragEvent) => void;
  onStatusChange: (listId: string, taskId: string) => void;
  viewTheme: MaxViewTheme;
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(list.id, newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };
  const taskTextClasses = viewTheme === 'dark' ? 'text-gray-300' : 'text-gray-700';

  return (
    <AccordionItem value={list.id} className="border-b-0">
      <AccordionTrigger className="p-2 text-sm font-semibold hover:no-underline">{list.title}</AccordionTrigger>
      <AccordionContent className="pb-0 pl-2 pr-1 space-y-1 text-xs">
        <form onSubmit={e => { e.preventDefault(); handleAddTask(); }} className="flex items-center gap-1 mb-2 px-1">
          <Plus size={14} className="text-gray-500" />
          <Input 
            value={newTaskTitle} 
            onChange={e => setNewTaskTitle(e.target.value)} 
            placeholder="Add a task" 
            className="h-6 text-xs bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </form>
        {isTasksLoading ? (
            <div className="py-4 text-center"><LoadingSpinner size="sm" /></div>
        ) : (
            tasks.map(task => (
                <div 
                    key={task.id} 
                    className="flex items-start gap-2 p-1 rounded-md hover:bg-gray-700/30 cursor-grab"
                    draggable
                    onDragStart={(e) => onDragStart(e, task)}
                    onDragEnd={onDragEnd}
                >
                    <Checkbox id={`task-${task.id}`} checked={task.status === 'completed'} onCheckedChange={() => onStatusChange(list.id, task.id)} className="mt-0.5" />
                    <label htmlFor={`task-${task.id}`} className={cn("flex-1", taskTextClasses)}>{task.title}</label>
                </div>
            ))
        )}
      </AccordionContent>
    </AccordionItem>
  );
};


// --- MAIN COMPONENT ---
interface PlannerSecondarySidebarProps {
  activeView: ActivePlannerView;
  tasks: Record<string, RawGoogleTask[]>;
  taskLists: GoogleTaskList[];
  googleEvents: RawCalendarEvent[]; // New prop
  isTasksLoading: boolean;
  isGoogleEventsLoading: boolean; // New prop
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, item: RawGoogleTask | RawCalendarEvent) => void; // Updated type
  onDragEnd: (e?: React.DragEvent) => void;
  onStatusChange: (listId: string, taskId: string) => void;
  viewTheme: MaxViewTheme;
}

export default function PlannerSecondarySidebar(props: PlannerSecondarySidebarProps) {
  const { activeView, taskLists, tasks, isTasksLoading, onAddTask, onDragStart, onDragEnd, onStatusChange, viewTheme, googleEvents, isGoogleEventsLoading } = props;
  
  const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
  const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';

  if (activeView === 'gmail') {
      return <PlannerGmailList viewTheme={viewTheme} onDragStart={onDragStart as any} onDragEnd={onDragEnd} />;
  }
  
  if (activeView === 'today') {
      return <PlannerGmailList viewTheme={viewTheme} onDragStart={onDragStart as any} onDragEnd={onDragEnd} dateQuery="today" />;
  }

  if (activeView === 'upcoming') {
    return <PlannerUpcomingView viewTheme={viewTheme} />;
  }
  
  if (activeView === 'google') {
    return <PlannerGoogleCalendarList events={googleEvents} isLoading={isGoogleEventsLoading} viewTheme={viewTheme} onDragStart={onDragStart} onDragEnd={onDragEnd} />;
  }
  
  // Default to "All tasks" or a specific task list
  const selectedTaskList = taskLists.find(list => list.id === activeView);

  return (
    <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
      <div className="flex justify-between items-center mb-2 px-1">
        <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}><Columns size={16} /> All Tasks</h1>
        <Button variant="ghost" size="icon" className="h-6 w-6"><Filter className="h-4 w-4" /></Button>
      </div>
      <Accordion type="multiple" defaultValue={taskLists.map(l => l.id)} className="w-full">
        {taskLists.map(list => (
          <PlannerTaskList 
            key={list.id} 
            list={list} 
            tasks={tasks[list.id] || []} 
            isTasksLoading={isTasksLoading}
            onAddTask={onAddTask}
            onDragStart={onDragStart as any}
            onDragEnd={onDragEnd}
            onStatusChange={onStatusChange}
            viewTheme={viewTheme}
          />
        ))}
      </Accordion>
    </div>
  );
}


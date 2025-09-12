
'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { GoogleTaskList, RawGoogleTask, RawGmailMessage, GmailLabel } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '../ui/checkbox';
import { Plus, Mail, Inbox, Filter, RefreshCw, Bot, Calendar } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { ActivePlannerView, MaxViewTheme } from './MaximizedPlannerView';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { summarizeEmail } from '@/ai/flows/summarize-email-flow';

interface PlannerSecondarySidebarProps {
  activeView: ActivePlannerView;
  tasks: Record<string, RawGoogleTask[]>;
  taskLists: GoogleTaskList[];
  isLoading: boolean;
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
  viewTheme: MaxViewTheme;
}

const PlannerGmailList = ({ viewTheme, onDragStart }: { viewTheme: MaxViewTheme, onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void }) => {
    const { user } = useAuth();
    const { apiKey } = useApiKey();
    const { toast } = useToast();
    const [emails, setEmails] = useState<RawGmailMessage[]>([]);
    const [labels, setLabels] = useState<GmailLabel[]>([]);
    const [selectedLabelId, setSelectedLabelId] = useState<string>('IMPORTANT');
    const [isLoading, setIsLoading] = useState(false);
    const [summaries, setSummaries] = useState<Record<string, string>>({});
    const [summarizingId, setSummarizingId] = useState<string | null>(null);

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

    const fetchEmails = useCallback(async (labelId: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/google/emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid, labelId }) });
            const data = await res.json();
            if (data.success) setEmails(data.emails);
            else throw new Error(data.message);
        } catch (error: any) {
            toast({ title: 'Error fetching emails', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchLabels();
        fetchEmails(selectedLabelId);
    }, [fetchLabels, fetchEmails, selectedLabelId]);

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
                <h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}><Mail size={16} /> Gmail</h1>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchEmails(selectedLabelId)}><RefreshCw className={cn("h-4 w-4", isLoading && 'animate-spin')} /></Button>
            </div>
            <div className="mb-2">
                {labels.length > 0 && (
                    <select value={selectedLabelId} onChange={e => setSelectedLabelId(e.target.value)} className="w-full text-xs p-1 rounded-md bg-transparent border border-gray-600">
                        {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                )}
            </div>
             <div className="space-y-1 text-xs overflow-y-auto">
                {isLoading && <div className="text-center p-4"><LoadingSpinner size="sm" /></div>}
                {!isLoading && emails.map(email => (
                    <div 
                        key={email.id} 
                        className={cn("p-1.5 rounded-md flex flex-col items-start cursor-grab", taskItemClasses)}
                        draggable
                        onDragStart={(e) => onDragStart(e, {id: email.id, title: email.subject, notes: email.snippet} as RawGoogleTask)}
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
        </div>
    );
};

const PlannerTaskList = ({
  taskLists,
  tasks,
  allTasks,
  activeListId,
  onAddTask,
  onDragStart,
  viewTheme,
}: {
  taskLists: GoogleTaskList[];
  tasks: RawGoogleTask[];
  allTasks: Record<string, RawGoogleTask[]>;
  activeListId: string;
  onAddTask: (listId: string, title: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: RawGoogleTask) => void;
  viewTheme: MaxViewTheme;
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    
    const activeViewTitle = useMemo(() => {
        if (activeListId === 'all_tasks') return 'All Tasks';
        if (activeListId === 'today') return 'Today';
        if (activeListId === 'upcoming') return 'Upcoming';
        const activeList = taskLists.find(list => list.id === activeListId);
        return activeList?.title || ''; // Removed "My Tasks" fallback
    }, [activeListId, taskLists]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const title = newTaskTitle.trim();
        const listId = taskLists.find(l => l.id === activeListId)?.id || taskLists[0]?.id;
        if (title && listId) {
            onAddTask(listId, title);
            setNewTaskTitle('');
        }
    };
    
    const getMockTaskDetails = (title: string) => {
        const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const durations = ['1h', '1h 15m', '1h 30m', '45m', '2h'];
        const tags = [ { name: 'Newsletter', color: 'bg-green-500' }, { name: 'Film', color: 'bg-blue-500' }, { name: 'Thumbnails', color: 'bg-purple-500' }, { name: 'Scripts', color: 'bg-orange-500' }, { name: 'Book', color: 'bg-red-500' }];
        const hasMetadata = Math.abs(hash % 5) > 1;
        return { duration: hasMetadata ? durations[Math.abs(hash) % durations.length] : null, tag: hasMetadata ? tags[Math.abs(hash) % tags.length] : null, metadata: hasMetadata ? 'Content Calendar' : null };
    }
    
    const taskListClasses = viewTheme === 'dark' ? 'bg-gray-800/60 border-r border-gray-700/50' : 'bg-stone-100 border-r border-gray-200';
    const headingClasses = viewTheme === 'dark' ? 'text-white' : 'text-gray-800';
    const placeholderClasses = viewTheme === 'dark' ? 'text-gray-500' : 'text-gray-400';
    const taskItemClasses = viewTheme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-stone-200';
    const taskTextClasses = viewTheme === 'dark' ? 'text-gray-200' : 'text-gray-700';

    const renderTaskItem = (task: RawGoogleTask) => {
      const mockDetails = getMockTaskDetails(task.title);
      return (
          <div key={task.id} className={cn("p-1.5 rounded-md flex flex-col items-start cursor-grab", taskItemClasses)} draggable onDragStart={(e) => onDragStart(e, task)}>
              <div className="flex items-start gap-2 w-full">
                  <Checkbox id={task.id} className={cn("h-3.5 w-3.5 mt-0.5", viewTheme === 'dark' ? 'border-gray-500' : 'border-gray-400')} />
                  <label htmlFor={task.id} className={cn("text-xs flex-1", taskTextClasses)}>{task.title}</label>
                  {mockDetails.duration && (<span className={cn("text-[10px] font-medium whitespace-nowrap", viewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>{mockDetails.duration}</span>)}
                  {mockDetails.tag && (<span className={cn("text-white text-[10px] font-bold px-1.5 py-0.5 rounded", mockDetails.tag.color)}>{mockDetails.tag.name}</span>)}
              </div>
               {mockDetails.metadata && (<div className={cn("pl-6 text-[10px] flex items-center gap-1", viewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')}><Calendar size={10}/><span>{mockDetails.metadata}</span></div>)}
          </div>
      );
    }

    return (
        <div className={cn("p-2 flex flex-col h-full", taskListClasses)}>
            <div className="flex justify-between items-center mb-2 px-1"><h1 className={cn("text-sm font-bold flex items-center gap-2", headingClasses)}><Inbox size={16} /> {activeViewTitle}</h1><Button variant="ghost" size="icon" className="h-6 w-6"><Filter className="h-4 w-4" /></Button></div>
            <form onSubmit={handleAddTask}><div className={cn("flex items-center gap-2 mb-2 text-xs h-8 px-1.5", viewTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black')}><Plus className="mr-1 h-4 w-4" /><Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add new task" className={cn("bg-transparent border-none h-auto p-0 text-xs focus-visible:ring-0", placeholderClasses, headingClasses)} /></div></form>
            <div className="space-y-1 text-xs overflow-y-auto">
                 {activeListId === 'all_tasks' ? (<Accordion type="multiple" className="w-full">{taskLists.map(list => { const listTasks = allTasks[list.id] || []; if (listTasks.length === 0) return null; return (<AccordionItem value={list.id} key={list.id} className="border-b-0"><AccordionTrigger className="text-xs font-semibold hover:no-underline py-1.5">{list.title}</AccordionTrigger><AccordionContent className="pb-2 space-y-1">{listTasks.map(renderTaskItem)}</AccordionContent></AccordionItem>) })}</Accordion>) : (tasks.map(renderTaskItem))}
            </div>
        </div>
    )
};


export default function PlannerSecondarySidebar(props: PlannerSecondarySidebarProps) {
  if (props.isLoading) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;
  }
  
  if (props.activeView === 'gmail') {
    return <PlannerGmailList viewTheme={props.viewTheme} onDragStart={props.onDragStart} />
  }

  const isTaskView = ['today', 'upcoming', 'all_tasks'].includes(props.activeView) || props.taskLists.some(list => list.id === props.activeView);
  
  if (isTaskView) {
      const tasksForActiveView = useMemo(() => {
        if (props.activeView === 'all_tasks' || props.activeView === 'today' || props.activeView === 'upcoming') {
            return [];
        }
        const tasksForList = props.tasks[props.activeView];
        return Array.isArray(tasksForList) ? tasksForList : [];
      }, [props.activeView, props.tasks]);
      
      return <PlannerTaskList 
                taskLists={props.taskLists}
                tasks={tasksForActiveView}
                allTasks={props.tasks}
                activeListId={props.activeView}
                onAddTask={props.onAddTask}
                onDragStart={props.onDragStart}
                viewTheme={props.viewTheme}
            />
  }

  // Render nothing if the view is not gmail and not a valid task list
  return null;
}

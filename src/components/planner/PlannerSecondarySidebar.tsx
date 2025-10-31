
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

// ... existing components ...

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
  
  // ... existing logic ...

  if (activeView === 'google') {
    return <PlannerGoogleCalendarList events={googleEvents} isLoading={isGoogleEventsLoading} viewTheme={viewTheme} onDragStart={onDragStart} onDragEnd={onDragEnd} />;
  }
  
  // ... other view rendering logic ...
}

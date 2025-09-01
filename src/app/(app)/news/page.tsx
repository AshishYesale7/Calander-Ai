
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { DeadlineItem, TrackedKeyword } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper, Search, Bot, PlusCircle, Trash2, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { trackDeadlines, type TrackDeadlinesOutput } from '@/ai/flows/track-deadlines-flow';
import { useApiKey } from '@/hooks/use-api-key';
import DeadlineTimeline from '@/components/news/DeadlineTimeline';
import { useAuth } from '@/context/AuthContext';
import { getTrackedKeywords, saveTrackedKeyword, deleteTrackedKeyword } from '@/services/deadlineTrackerService';
import { saveTimelineEvent, getTimelineEvents } from '@/services/timelineService';
import type { TimelineEvent } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistanceToNow, startOfDay } from 'date-fns';
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

export default function NewsPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [history, setHistory] = useState<TrackedKeyword[]>([]);
  const [addedDeadlineIds, setAddedDeadlineIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const { apiKey } = useApiKey();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsHistoryLoading(true);
    try {
        const trackedKeywords = await getTrackedKeywords(user.uid);
        setHistory(trackedKeywords);
    } catch (e) {
        toast({ title: 'Error loading history', variant: 'destructive' });
    } finally {
        setIsHistoryLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = async () => {
    if (!keyword.trim() || !user) {
      toast({ title: "Keyword Required", description: "Please enter a topic to search for." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await trackDeadlines({ keyword, apiKey });
      response.deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (response.deadlines.length === 0) {
        toast({
          title: "No Deadlines Found",
          description: `The AI could not find any specific upcoming deadlines for "${keyword}". Try a broader term.`,
        });
      } else {
        const newTrackedKeyword = await saveTrackedKeyword(user.uid, keyword, response.deadlines);
        setHistory(prev => [newTrackedKeyword, ...prev.filter(item => item.keyword.toLowerCase() !== keyword.toLowerCase())]);
        setKeyword(''); // Clear input on success
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
          title: 'Error',
          description: errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')
              ? 'The tracking model is temporarily overloaded. Please try again later.'
              : 'Failed to track deadlines. Your API key may be invalid or the service is down.',
          variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!user) return;
    const originalHistory = [...history];
    setHistory(prev => prev.filter(item => item.id !== id));
    try {
        await deleteTrackedKeyword(user.uid, id);
        toast({ title: 'History item deleted' });
    } catch (e) {
        setHistory(originalHistory);
        toast({ title: 'Error deleting history item', variant: 'destructive' });
    }
  };

  const handleAddEventToTimeline = async (deadline: DeadlineItem, searchKeyword: string) => {
    if (!user) return;
    const deadlineIdentifier = `${deadline.title}-${deadline.date}`;
    
    if (addedDeadlineIds.has(deadlineIdentifier)) {
        toast({title: 'Already Added', description: 'This deadline is already in your calendar.'});
        return;
    }
    
    toast({ title: "Adding to timeline...", description: `Saving "${deadline.title}" to your calendar.` });
    
    // Crucial Fix: Use startOfDay to ensure time is stripped for all-day events,
    // preventing timezone-related date shifts.
    const newEvent: TimelineEvent = {
        id: `deadline-${Date.now()}`,
        title: `${searchKeyword}: ${deadline.title}`,
        date: startOfDay(new Date(deadline.date)),
        type: 'deadline',
        notes: `Source: ${deadline.sourceUrl}\nDescription: ${deadline.description}`,
        isAllDay: true,
        isDeletable: true,
        priority: 'Medium',
        status: 'pending'
    };

    try {
        const { icon, ...data } = newEvent;
        const payload: any = {
          ...data,
          date: data.date.toISOString(),
          endDate: null,
        };
        
        await saveTimelineEvent(user.uid, payload, { syncToGoogle: true });
        toast({ title: "Event Added", description: `"${deadline.title}" added to your main calendar and synced to Google.` });
        setAddedDeadlineIds(prev => new Set(prev.add(deadlineIdentifier)));
    } catch(error: any) {
        let description = 'An unknown error occurred while saving the event.';
        if (typeof error.message === 'string') {
            if (error.message.includes('Google Calendar')) {
                description = `Event saved locally, but failed to sync with Google Calendar. Please check permissions in Settings.`;
            } else {
                description = error.message;
            }
        }
        toast({ title: 'Save Error', description, variant: 'destructive', duration: 8000 });
        console.error("Save Timeline Event Error:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold text-primary flex items-center">
          <Newspaper className="mr-3 h-8 w-8 text-accent" />
          AI Opportunity Tracker
        </h1>
        <p className="text-foreground/80 mt-1">
          Enter a topic, exam, or company to find and track important upcoming deadlines.
        </p>
      </div>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Track a New Topic
          </CardTitle>
          <CardDescription>
            For example: "GATE 2025", "Google Summer of Code", or "Microsoft SWE Internships".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              ref={inputRef}
              placeholder="Enter keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="bg-input/50"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !keyword.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <><LoadingSpinner size="sm" className="mr-2"/>Tracking...</>
              ) : (
                <><Bot className="mr-2 h-4 w-4" />Find Deadlines</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="frosted-glass shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
                <History className="mr-2 h-5 w-5" />
                Tracked History
            </CardTitle>
            <CardDescription>
                Your previously tracked topics. Click to expand and see deadlines.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isHistoryLoading ? (
                <div className="flex justify-center p-8"><LoadingSpinner /></div>
            ) : history.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {history.map(item => (
                        <AccordionItem value={item.id} key={item.id}>
                            <div className="flex w-full items-center justify-between hover:bg-muted/30 rounded-md">
                                <AccordionTrigger className="flex-1 text-left px-4 py-2 hover:no-underline">
                                        <span className="font-semibold text-base">{item.keyword}</span>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 pr-4">
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="frosted-glass">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete this search?</AlertDialogTitle>
                                                <AlertDialogDescription>This will remove "{item.keyword}" from your history.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteHistory(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <AccordionContent>
                                {item.deadlines.length > 0 ? (
                                    <DeadlineTimeline deadlines={item.deadlines} onAddToCalendar={(deadline) => handleAddEventToTimeline(deadline, item.keyword)} />
                                ) : (
                                    <p className="text-muted-foreground text-center text-sm p-4">No deadlines were found for this topic.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-center text-muted-foreground p-8">Your search history is empty. Track a topic to get started!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

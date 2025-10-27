
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { RawGmailMessage, GmailLabel } from '@/types';
import { Button } from '@/components/ui/button';
import { ExternalLink, Inbox, MailWarning, RefreshCw, Filter, Bot } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '../ui/scroll-area';

const EMAILS_STORAGE_KEY_PREFIX = 'futureSightGmailCache_';
const LABELS_STORAGE_KEY = 'futureSightGmailLabels';

interface ImportantEmailsCardProps {
  className?: string;
}

export default function ImportantEmailsCard({ className }: ImportantEmailsCardProps) {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();

  const [emails, setEmails] = useState<RawGmailMessage[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  
  const [selectedLabelId, setSelectedLabelId] = useState<string>('IMPORTANT');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  // Load emails from cache on mount for the selected label
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${EMAILS_STORAGE_KEY_PREFIX}${selectedLabelId}`);
      if (stored) {
        setEmails(JSON.parse(stored));
      }
    }
  }, [selectedLabelId]);

  useEffect(() => {
    if (user) {
      fetch('/api/auth/google/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
      })
      .then(res => res.json())
      .then(data => setIsGoogleConnected(data.isConnected));
    }
  }, [user]);

  const fetchLabels = useCallback(async () => {
    if (!user || !isGoogleConnected) return;
    try {
      const response = await fetch('/api/google/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (data.success) {
        setLabels(data.labels);
        localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(data.labels));
      }
    } catch (error) {
      console.error("Failed to fetch labels", error);
    }
  }, [user, isGoogleConnected]);

  const fetchEmails = useCallback(async (labelId: string) => {
    if (!user || !isGoogleConnected) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/google/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, labelId }),
      });
      const data = await response.json();
      if (data.success) {
        setEmails(data.emails);
        localStorage.setItem(`${EMAILS_STORAGE_KEY_PREFIX}${labelId}`, JSON.stringify(data.emails));
      } else {
        throw new Error(data.message || 'Failed to fetch emails.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGoogleConnected, toast]);

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

  useEffect(() => {
    if (isGoogleConnected) {
        const fetchInitialData = async () => {
            await fetchLabels();
            await fetchEmails(selectedLabelId);
        };
        fetchInitialData();

        const intervalId = setInterval(() => {
            fetchEmails(selectedLabelId);
        }, 3600000); // 1 hour

        return () => clearInterval(intervalId);
    }
  }, [isGoogleConnected, fetchLabels, fetchEmails, selectedLabelId]);

  const handleRefresh = () => {
    if (isGoogleConnected) {
      fetchLabels();
      fetchEmails(selectedLabelId);
    } else {
      toast({ title: 'Not Connected', description: 'Please connect your Google account in Settings first.', variant: 'destructive' });
    }
  };

  const handleLabelChange = (newLabelId: string) => {
    setEmails([]); // Clear old emails immediately
    setSummaries({}); // Clear old summaries
    setSelectedLabelId(newLabelId);
    // fetchEmails will be called by the useEffect watching selectedLabelId
  };
  
  const formatDate = (dateString: string) => {
    try {
        const date = new Date(parseInt(dateString, 10));
        return format(date, 'MMM d');
    } catch (e) {
        return 'Invalid date';
    }
  }

  return (
    <Card className={cn("w-full h-full flex flex-col frosted-glass", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Inbox className="mr-2 h-5 w-5 text-accent" />
              Important Emails
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-8 w-8">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                <span className="sr-only">Refresh Emails</span>
            </Button>
        </div>
        <CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select onValueChange={handleLabelChange} value={selectedLabelId} disabled={isLoading || labels.length === 0}>
                <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Filter by label..." />
                </SelectTrigger>
                <SelectContent>
                    {labels.map(label => (
                        <SelectItem key={label.id} value={label.id}>{label.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
                {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <LoadingSpinner />
                </div>
                ) : !isGoogleConnected ? (
                <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground">
                    <MailWarning className="h-8 w-8 mb-2" />
                    <p className="text-sm">Connect your Google account in Settings to see important emails here.</p>
                </div>
                ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-48 text-muted-foreground">
                    <MailWarning className="h-8 w-8 mb-2" />
                    <p className="text-sm">No emails found in this label.</p>
                    <p className="text-xs mt-1">Try another label or click refresh.</p>
                </div>
                ) : (
                emails.map(email => (
                    <div key={email.id} className="p-3 rounded-md border border-border/50 bg-background/30 space-y-1.5 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold text-foreground line-clamp-2">{email.subject}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(email.internalDate)}</span>
                        </div>
                    <p className="text-xs text-foreground/80 line-clamp-2">{email.snippet}</p>

                    {summaries[email.id] && (
                        <div className="mt-2 p-3 bg-primary/5 rounded-md border border-primary/20 animate-in fade-in duration-500">
                            <h4 className="text-sm font-semibold text-primary flex items-center mb-1">
                            <Bot className="mr-2 h-4 w-4 flex-shrink-0" /> AI Summary
                            </h4>
                            <p className="text-xs text-foreground/90 leading-relaxed">{summaries[email.id]}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        {email.link && (
                            <a href={email.link} target="_blank" rel="noopener noreferrer">
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-accent">
                                View Email <ExternalLink className="ml-1.5 h-3 w-3" />
                            </Button>
                            </a>
                        )}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2"
                            onClick={() => handleSummarize(email)} 
                            disabled={summarizingId === email.id}
                        >
                        {summarizingId === email.id ? (
                            <LoadingSpinner size="sm" className="mr-2"/>
                        ) : (
                            <Bot className="mr-2 h-4 w-4" />
                        )}
                            Summarize
                        </Button>
                    </div>
                    </div>
                ))
                )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

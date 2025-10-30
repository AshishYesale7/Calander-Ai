'use client';
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bot, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useApiKey } from '@/hooks/use-api-key';
import { getGoogleCalendarEvents } from '@/services/googleCalendarService';
import { getGoogleTasks } from '@/services/googleTasksService';
import { processGoogleData, type ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { saveTimelineEvent } from '@/services/timelineService';
import { useTimezone } from '@/hooks/use-timezone';
import type { TimelineEvent } from '@/types';

interface GoogleSyncWidgetProps {
  onSyncComplete: () => void;
}

export default function GoogleSyncWidget({ onSyncComplete }: GoogleSyncWidgetProps) {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const { timezone } = useTimezone();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if(user) {
        fetch('/api/auth/google/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
        })
        .then(res => res.json())
        .then(data => setIsGoogleConnected(data.isConnected));
    }
  }, [user]);

  const handleSync = async () => {
    if (!user || !isGoogleConnected) return;

    setIsSyncing(true);
    toast({ title: "Syncing with Google...", description: "Fetching your events and tasks." });

    try {
      const [calendarEvents, googleTasks] = await Promise.all([
          getGoogleCalendarEvents(user.uid),
          getGoogleTasks(user.uid)
      ]);

      if (calendarEvents.length === 0 && googleTasks.length === 0) {
        toast({ title: "No New Items", description: "No new events or tasks found." });
        setIsSyncing(false);
        return;
      }

      const result = await processGoogleData({ calendarEvents, googleTasks, apiKey, userId: user.uid });
      
      const savePromises = result.insights.map(insight => {
        const newEvent: TimelineEvent = {
          id: `custom-${Date.now()}-${Math.random()}`,
          googleEventId: insight.googleEventId,
          googleTaskId: insight.googleTaskId,
          date: new Date(insight.date),
          endDate: insight.endDate ? new Date(insight.endDate) : undefined,
          title: insight.title,
          type: 'ai_suggestion',
          notes: insight.summary,
          isAllDay: insight.isAllDay,
          isDeletable: true,
          priority: 'None',
          status: 'pending',
          reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
        };
        const { icon, ...payload } = {
          ...newEvent,
          date: newEvent.date.toISOString(),
          endDate: newEvent.endDate ? newEvent.endDate.toISOString() : null,
        };
        return saveTimelineEvent(user.uid, payload, { syncToGoogle: true, timezone });
      });

      await Promise.all(savePromises);
      onSyncComplete();
      toast({ title: "Sync Complete", description: `${result.insights.length} items were synced.` });

    } catch (e: any) {
      toast({ title: "Sync Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col frosted-glass">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">Sync with Google</CardTitle>
        <CardDescription>Import events and tasks from your Google account.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        {isGoogleConnected === null ? (
          <LoadingSpinner />
        ) : isGoogleConnected ? (
          <Button onClick={handleSync} disabled={isSyncing} className="w-full">
            {isSyncing ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        ) : (
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Please connect your Google account in Settings to enable sync.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

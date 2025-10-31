
'use client';
import { useState } from 'react';
import EventCalendarView from '@/components/timeline/EventCalendarView';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import { getGoogleCalendarEvents } from '@/services/googleCalendarService';
import { getGoogleTasks } from '@/services/googleTasksService';
import { useToast } from '@/hooks/use-toast';
import { saveTimelineEvent } from '@/services/timelineService';
import { useTimezone } from '@/hooks/use-timezone';
import type { TimelineEvent } from '@/types';

interface CalendarWidgetProps {
  events: TimelineEvent[];
  onDayClick: (date: Date) => void;
  onToggleTrash: () => void;
  onSyncComplete: () => void;
  onAddEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
  onEditEvent: (event: TimelineEvent) => void;
}

export default function CalendarWidget({ 
  events,
  onDayClick, 
  onToggleTrash, 
  onSyncComplete, 
  onAddEvent, 
  onDeleteEvent, 
  onEditEvent 
}: CalendarWidgetProps) {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const { timezone } = useTimezone();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCalendarData = async () => {
    if (!user) return;
    setIsSyncing(true);
    toast({ title: "Syncing...", description: "Fetching data from Google." });
    try {
      const [calendarEvents, googleTasks] = await Promise.all([
        getGoogleCalendarEvents(user.uid),
        getGoogleTasks(user.uid),
      ]);
      const result = await processGoogleData({
        calendarEvents, googleTasks, apiKey, userId: user.uid,
      });

      if(result.insights.length === 0) {
        toast({ title: "Nothing to sync", description: "Your calendar is up to date." });
        return;
      }

      for (const insight of result.insights) {
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
        await saveTimelineEvent(user.uid, payload, { syncToGoogle: false, timezone, syncToMicrosoft: false });
      }
      onSyncComplete();
      toast({ title: "Sync Complete", description: `${result.insights.length} items synced.` });
    } catch (e: any) {
      toast({ title: "Sync Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
       <EventCalendarView 
         events={events} 
         month={new Date()} 
         onMonthChange={() => {}} 
         onDayClick={onDayClick} 
         onSync={handleSyncCalendarData} 
         isSyncing={isSyncing} 
         onToggleTrash={onToggleTrash} 
         onAddEvent={onAddEvent}
         onDeleteEvent={onDeleteEvent}
         onEditEvent={onEditEvent}
       />
    </div>
  );
}

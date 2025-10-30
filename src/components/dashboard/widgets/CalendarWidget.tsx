'use client';
import { useState, useRef } from 'react';
import EventCalendarView from '@/components/timeline/EventCalendarView';
import TimelineListView from '@/components/timeline/TimelineListView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import type { TimelineEvent } from '@/types';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import { getGoogleCalendarEvents } from '@/services/googleCalendarService';
import { getGoogleTasks } from '@/services/googleTasksService';
import { useToast } from '@/hooks/use-toast';
import { saveTimelineEvent } from '@/services/timelineService';
import { useTimezone } from '@/hooks/use-timezone';

interface CalendarWidgetProps {
  onDayClick: (date: Date) => void;
  onToggleTrash: () => void;
  onSyncComplete: () => void;
}

export default function CalendarWidget({ onDayClick, onToggleTrash, onSyncComplete }: CalendarWidgetProps) {
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const { timezone } = useTimezone();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);

  // This widget doesn't manage events itself, it receives them or triggers fetches.
  // The actual event data will be passed from the main dashboard page.
  // For now, we simulate fetching.

  const handleSyncCalendarData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const [calendarEvents, googleTasks] = await Promise.all([
        getGoogleCalendarEvents(user.uid),
        getGoogleTasks(user.uid),
      ]);
      const result = await processGoogleData({
        calendarEvents, googleTasks, apiKey, userId: user.uid,
      });

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
        await saveTimelineEvent(user.uid, payload, { syncToGoogle: true, timezone });
      }
      onSyncComplete();
      toast({ title: "Sync Complete", description: `${result.insights.length} items synced.` });
    } catch (e: any) {
      toast({ title: "Sync Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  // For simplicity, this example doesn't show passing events down.
  // In a real app, `EventCalendarView` and `TimelineListView` would receive events as props.
  return (
    <div className="relative h-full flex flex-col">
       <div className="flex-shrink-0 p-4 pb-0">
          <Tabs defaultValue="calendar" className="relative">
              <div className="flex justify-between items-center mb-4 gap-2">
                <TabsList className="inline-flex h-auto p-1 rounded-full bg-black/50 backdrop-blur-sm border border-border/30">
                  <TabsTrigger value="calendar" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
                    <Calendar className="mr-2 h-4 w-4" /> Calendar
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/50 self-center" />
                  <TabsTrigger value="list" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
                    <List className="mr-2 h-4 w-4" /> List
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="calendar" className="mt-0 h-full flex-1">
                  <EventCalendarView events={[]} month={new Date()} onMonthChange={() => {}} onDayClick={onDayClick} onSync={handleSyncCalendarData} isSyncing={isSyncing} onToggleTrash={onToggleTrash} />
              </TabsContent>
              <TabsContent value="list" className="mt-0 h-full flex-1">
                  <TimelineListView events={[]} onDeleteEvent={() => {}} onEditEvent={() => {}} />
              </TabsContent>
          </Tabs>
       </div>
    </div>
  );
}
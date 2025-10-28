
'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TodaysPlanCard from '@/components/timeline/TodaysPlanCard';
import EventCalendarView from '@/components/timeline/EventCalendarView';
import SlidingTimelineView from '@/components/timeline/SlidingTimelineView';
import DayTimetableView from '@/components/timeline/DayTimetableView';
import EditEventModal from '@/components/timeline/EditEventModal';
import TimelineListView from '@/components/timeline/TimelineListView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Bot, Calendar, List, CalendarDays as CalendarIconLucide, PlusCircle, Upload, Download, Trash2 } from 'lucide-react';
import { processGoogleData } from '@/ai/flows/process-google-data-flow';
import type { ProcessGoogleDataInput, ActionableInsight } from '@/ai/flows/process-google-data-flow';
import { mockTimelineEvents } from '@/data/mock';
import type { TimelineEvent, UserPreferences } from '@/types';
import { format, parseISO, addMonths, subMonths, startOfMonth, isSameDay, startOfDay as dfnsStartOfDay, subDays, isToday, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useApiKey } from '@/hooks/use-api-key';
import { useAuth } from '@/context/AuthContext';
import { getTimelineEvents, saveTimelineEvent, deleteTimelineEvent, restoreTimelineEvent, permanentlyDeleteTimelineEvent } from '@/services/timelineService';
import { getGoogleCalendarEvents } from '@/services/googleCalendarService';
import { getGoogleTasks } from '@/services/googleTasksService';
import { getUserPreferences } from '@/services/userService';
import ImportantEmailsCard from '@/components/timeline/ImportantEmailsCard';
import NextMonthHighlightsCard from '@/components/timeline/NextMonthHighlightsCard';
import { saveAs } from 'file-saver';
import TrashPanel from '@/components/timeline/TrashPanel';
import { useTimezone } from '@/hooks/use-timezone';
import DailyStreakCard from '@/components/dashboard/DailyStreakCard';
import { useIsMobile } from '@/hooks/use-mobile';
import WidgetDashboard from '@/components/dashboard/WidgetDashboard';


const LOCAL_STORAGE_KEY = 'futureSightTimelineEvents';

const parseDatePreservingTime = (dateInput: string | Date | undefined): Date | undefined => {
  if (!dateInput) return undefined;
  if (dateInput instanceof Date && !isNaN(dateInput.valueOf())) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    try {
      const parsed = parseISO(dateInput);
      if (isNaN(parsed.valueOf())) {
        console.warn(`Invalid date string for parseISO after parsing: ${dateInput}. Returning undefined.`);
        return undefined;
      }
      return parsed;
    } catch (e) {
      console.warn(`Error parsing date string with parseISO: ${dateInput}. Returning undefined. Error: ${e}`);
      return undefined;
    }
  }
  console.warn(`Invalid date input type or value: ${dateInput}. Returning undefined.`);
  return undefined;
};

const syncToLocalStorage = (events: TimelineEvent[]) => {
    if (typeof window !== 'undefined') {
        const serializableEvents = events.map(event => {
            const { icon, ...rest } = event;
            return {
            ...rest,
            date: (event.date instanceof Date && !isNaN(event.date.valueOf())) ? event.date.toISOString() : new Date().toISOString(),
            endDate: (event.endDate instanceof Date && !isNaN(event.endDate.valueOf())) ? event.endDate.toISOString() : undefined,
            deletedAt: event.deletedAt ? event.deletedAt.toISOString() : undefined,
            color: event.color,
            googleEventId: event.googleEventId,
            googleTaskId: event.googleTaskId,
            };
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableEvents));
    }
};

const loadFromLocalStorage = (): TimelineEvent[] => {
    if (typeof window === 'undefined') {
      return mockTimelineEvents.map(event => ({
        ...event,
        date: parseDatePreservingTime(event.date) || new Date(),
        endDate: parseDatePreservingTime(event.endDate),
        isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
        color: event.color,
      }));
    }
    try {
      const storedEventsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEventsString) {
        const parsedEvents: (Omit<TimelineEvent, 'icon' | 'date' | 'endDate' | 'deletedAt'> & { date: string, endDate?: string, deletedAt?: string, color?: string })[] = JSON.parse(storedEventsString);
        return parsedEvents.map(event => {
          const parsedDate = parseDatePreservingTime(event.date);
          const parsedEndDate = parseDatePreservingTime(event.endDate);
          if (!parsedDate) {
            console.warn(`Skipping event with invalid date from localStorage: ${event.id}, date: ${event.date}`);
            return null;
          }
          return {
            ...event,
            date: parsedDate,
            endDate: parsedEndDate,
            deletedAt: event.deletedAt ? parseDatePreservingTime(event.deletedAt) : undefined,
            isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
            color: event.color,
          } as TimelineEvent;
        }).filter(event => event !== null) as TimelineEvent[];
      }
    } catch (error) {
      console.error("Error reading timeline events from localStorage:", error);
    }
    return mockTimelineEvents.map(event => {
      const parsedDate = parseDatePreservingTime(event.date);
      const parsedEndDate = parseDatePreservingTime(event.endDate);
      if (!parsedDate) {
         console.warn(`Skipping mock event with invalid date: ${event.id}, date: ${event.date}`);
         return null;
      }
      return {
        ...event,
        date: parsedDate,
        endDate: parsedEndDate,
        isDeletable: event.isDeletable === undefined ? (event.id.startsWith('ai-') ? true : false) : event.isDeletable,
        color: event.color,
      };
    }).filter(event => event !== null) as TimelineEvent[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeDisplayMonth, setActiveDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<TimelineEvent | null>(null);
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  
  const { apiKey } = useApiKey();
  const { timezone } = useTimezone();
  const [allTimelineEvents, setAllTimelineEvents] = useState<TimelineEvent[]>(loadFromLocalStorage);
  const [isTrashPanelOpen, setIsTrashPanelOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const fetchAllEvents = useCallback(async () => {
      if (user) {
        try {
          const firestoreEvents = await getTimelineEvents(user.uid);
          setAllTimelineEvents(firestoreEvents);
          syncToLocalStorage(firestoreEvents);
        } catch (error: any) {
           if (error.message.includes('Failed to fetch')) {
             console.warn("Could not sync timeline, likely offline.");
             toast({ title: "Offline Mode" });
           } else {
             console.error("Failed to sync timeline from Firestore, using local data.", error);
             toast({ title: "Sync Error", description: "Could not sync timeline.", variant: "destructive"});
           }
        }
      }
  }, [user, toast]);
  
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  const { activeEvents, recentlyDeletedEvents } = useMemo(() => {
    const active: TimelineEvent[] = [];
    const deleted: TimelineEvent[] = [];
    const threeDaysAgo = subDays(new Date(), 3);

    for (const event of allTimelineEvents) {
      if (event.deletedAt) {
        if (event.deletedAt instanceof Date && !isNaN(event.deletedAt.valueOf()) && event.deletedAt > threeDaysAgo) {
          deleted.push(event);
        }
      } else {
        active.push(event);
      }
    }
    return { activeEvents: active, recentlyDeletedEvents: deleted.sort((a,b) => b.deletedAt!.getTime() - a.deletedAt!.getTime()) };
  }, [allTimelineEvents]);

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

  const transformInsightToEvent = useCallback((insight: ActionableInsight): TimelineEvent | null => {
    const eventDate = parseDatePreservingTime(insight.date);
    if (!eventDate) {
      console.warn(`Invalid data for insight. Skipping insight.`);
      return null;
    }
    const eventEndDate = parseDatePreservingTime(insight.endDate);

    if (insight.source === 'google_calendar' && insight.googleEventId) {
        return {
            id: `gcal-${insight.googleEventId}`,
            googleEventId: insight.googleEventId,
            date: eventDate,
            endDate: eventEndDate,
            title: insight.title,
            type: 'ai_suggestion',
            notes: insight.summary,
            url: insight.originalLink,
            status: 'pending',
            icon: Bot,
            isDeletable: true,
            isAllDay: insight.isAllDay || false,
            priority: 'None',
            reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
        };
    }

    if (insight.source === 'google_tasks' && insight.googleTaskId) {
        return {
            id: `gtask-${insight.googleTaskId}`,
            googleTaskId: insight.googleTaskId,
            date: eventDate,
            endDate: eventEndDate,
            title: insight.title,
            type: 'ai_suggestion',
            notes: insight.summary,
            url: insight.originalLink,
            status: 'pending',
            icon: Bot,
            isDeletable: true,
            isAllDay: true, // Tasks are always all-day
            priority: 'None',
            reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
        };
    }
    
    return null;
  }, []);

  const handleSyncCalendarData = useCallback(async () => {
    if (isGoogleConnected === null) {
      toast({ title: "Please wait", description: "Checking Google connection status..." });
      return;
    }
    if (!isGoogleConnected) {
      toast({ title: "Not Connected", description: "Please connect your Google account in Settings to sync data.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be signed in to perform this action.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSyncError(null);
    
    try {
      const [calendarEvents, googleTasks] = await Promise.all([
          getGoogleCalendarEvents(user.uid),
          getGoogleTasks(user.uid)
      ]);

      if (calendarEvents.length === 0 && googleTasks.length === 0) {
        toast({ title: "No New Items", description: "No new events or tasks found in your Google account to process." });
        setIsLoading(false);
        return;
      }

      const input: ProcessGoogleDataInput = {
        calendarEvents,
        googleTasks,
        apiKey,
        userId: user.uid,
      };

      const result = await processGoogleData(input);
      
      if (!result.insights || result.insights.length === 0) {
        toast({ title: "No Actionable Insights", description: "The AI analyzed your data but didn't find any new items to add." });
        setIsLoading(false);
        return;
      }
        
      const transformedEvents = result.insights.map(transformInsightToEvent).filter(event => event !== null) as TimelineEvent[];
      const currentEventIds = new Set(allTimelineEvents.map(e => e.id));
      const uniqueNewEventsToAdd = transformedEvents.filter(newEvent => !currentEventIds.has(newEvent.id));
      
      if (uniqueNewEventsToAdd.length > 0) {
          const updatedEvents = [...allTimelineEvents, ...uniqueNewEventsToAdd];
          setAllTimelineEvents(updatedEvents);
          syncToLocalStorage(updatedEvents);

          for (const event of uniqueNewEventsToAdd) {
            const { icon, ...data } = event;
            const payload = { ...data, date: data.date.toISOString(), endDate: data.endDate ? data.endDate.toISOString() : null };
            await saveTimelineEvent(user.uid, payload, { syncToGoogle: true, timezone });
          }
          toast({ title: "Timeline Updated", description: `${uniqueNewEventsToAdd.length} new item(s) from Google were added.` });
      } else {
          toast({ title: "Already Synced", description: "Your timeline already contains all the latest items from Google." });
      }

    } catch (error: any) {
      console.error('Error processing Google data:', error);
      const errorMessage = error.message || 'Failed to fetch or process Google data.';
      
      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
          setSyncError("The AI service is temporarily overloaded. Please try syncing again in a few moments.");
          toast({ title: "AI Service Unavailable", description: "The AI service is temporarily overloaded. Please try again later.", variant: "destructive" });
      } else {
          setSyncError(errorMessage);
          toast({ title: "Sync Error", description: errorMessage, variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [user, apiKey, isGoogleConnected, toast, allTimelineEvents, transformInsightToEvent, timezone]);

  const handleDeleteTimelineEvent = async (eventId: string) => {
    const originalEvents = allTimelineEvents;
    const eventToDelete = originalEvents.find(event => event.id === eventId);
    if (!eventToDelete || !user) return;
    
    const newEvents = originalEvents.map(event => 
      event.id === eventId ? { ...event, deletedAt: new Date() } : event
    );
    setAllTimelineEvents(newEvents);
    syncToLocalStorage(newEvents);
    
    toast({ title: "Event Moved to Trash", description: `"${eventToDelete.title}" has been deleted.` });

    if (selectedDateForDayView) {
        const remainingEventsOnDay = newEvents.filter(event =>
            !event.deletedAt && event.date instanceof Date && !isNaN(event.date.valueOf()) &&
            isSameDay(dfnsStartOfDay(event.date), dfnsStartOfDay(selectedDateForDayView))
        );
        if (remainingEventsOnDay.length === 0) {
            setSelectedDateForDayView(null);
        }
    }
    
    try {
      await deleteTimelineEvent(user.uid, eventId);
    } catch (error) {
      console.error("Failed to soft-delete event in Firestore", error);
      setAllTimelineEvents(originalEvents);
      syncToLocalStorage(originalEvents);
      toast({ title: "Sync Error", description: "Could not delete event. Please try again.", variant: "destructive" });
    }
  };
  
  const handleRestoreEvent = async (eventId: string) => {
    if (!user) return;
    await restoreTimelineEvent(user.uid, eventId);
    await fetchAllEvents();
  };

  const handlePermanentDelete = async (eventId: string) => {
    if (!user) return;
    await permanentlyDeleteTimelineEvent(user.uid, eventId);
    await fetchAllEvents();
    toast({ title: 'Event Permanently Deleted' });
  };


  const handleMonthNavigationForSharedViews = (direction: 'prev' | 'next') => {
    setActiveDisplayMonth(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
  };

  const handleDayClickFromCalendar = (day: Date, hasEvents: boolean) => {
    setSelectedDateForDayView(day);
  };

  const closeDayTimetableView = () => {
    setSelectedDateForDayView(null);
  };

  const handleOpenEditModal = useCallback((event?: TimelineEvent, isNew: boolean = false) => {
    if (event) {
      setIsAddingNewEvent(isNew);
      setEventBeingEdited({
        ...event,
        date: event.date instanceof Date ? event.date : parseDatePreservingTime(event.date as unknown as string) || new Date(),
        endDate: event.endDate ? (event.endDate instanceof Date ? event.endDate : parseDatePreservingTime(event.endDate as unknown as string)) : undefined,
      });
    } else {
      setIsAddingNewEvent(true);
      const defaultNewEventDate = selectedDateForDayView ? new Date(selectedDateForDayView) : new Date();
      defaultNewEventDate.setHours(9,0,0,0);

      setEventBeingEdited({
        id: `custom-${Date.now()}`,
        title: '',
        date: defaultNewEventDate,
        endDate: undefined,
        type: 'custom',
        notes: '',
        isAllDay: false,
        isDeletable: true,
        priority: 'None',
        status: 'pending',
        icon: CalendarIconLucide,
        reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
      });
    }
    setIsEditModalOpen(true);
  }, [selectedDateForDayView]);
  
  useEffect(() => {
    if (searchParams.get('action') === 'newEvent') {
      handleOpenEditModal();
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, handleOpenEditModal, router]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEventBeingEdited(null);
    setIsAddingNewEvent(false);
  }, []);

  const handleSaveEditedEvent = useCallback(async (updatedEvent: TimelineEvent, syncToGoogle: boolean) => {
    if (!user) {
      toast({ title: 'Not signed in', description: 'You must be signed in to save events.', variant: 'destructive' });
      return;
    }
    handleCloseEditModal();
    
    try {
        const { icon, ...data } = updatedEvent;
        const payload = {
            ...data,
            date: data.date.toISOString(),
            endDate: data.endDate ? data.endDate.toISOString() : null,
        };
        await saveTimelineEvent(user.uid, payload, { syncToGoogle, timezone });
        await fetchAllEvents();
        toast({
            title: isAddingNewEvent ? "Event Added" : "Event Updated",
            description: `"${updatedEvent.title}" has been successfully ${isAddingNewEvent ? "added" : "updated"}.`
        });
    } catch (error: any) {
        let description = 'An unknown error occurred while saving the event.';
        if (typeof error.message === 'string') {
            if (error.message.includes('Google Calendar')) {
                description = `Event saved locally, but failed to sync with Google Calendar. Please check permissions in Settings.`;
            } else {
                description = error.message;
            }
        }
        toast({ title: 'Save Error', description, variant: 'destructive', duration: 8000 });
        await fetchAllEvents();
    }
  }, [handleCloseEditModal, toast, isAddingNewEvent, user, fetchAllEvents, timezone]);

  const handleEventStatusUpdate = useCallback(async (eventId: string, newStatus: 'completed' | 'missed') => {
    const eventToUpdate = allTimelineEvents.find(event => event.id === eventId);
    if (!eventToUpdate || !user) return;

    const updatedEvent = { ...eventToUpdate, status: newStatus };
    
    setAllTimelineEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

    toast({
      title: "Status Updated",
      description: `"${updatedEvent.title}" marked as ${newStatus}.`
    });

    try {
      const { icon, ...data } = updatedEvent;
      const payload = {
        ...data,
        date: data.date.toISOString(),
        endDate: data.endDate ? data.endDate.toISOString() : null,
      };
      await saveTimelineEvent(user.uid, payload, { syncToGoogle: !!updatedEvent.googleEventId, timezone });
    } catch (error) {
      console.error("Failed to save event status to Firestore", error);
      await fetchAllEvents();
      toast({ title: "Sync Error", description: "Could not save status to server. Change is saved locally.", variant: "destructive" });
    }
  }, [allTimelineEvents, user, toast, fetchAllEvents, timezone]);

  const handleExportEvents = useCallback(() => {
    if (activeEvents.length === 0) {
      toast({ title: 'No Events', description: 'There are no events to export.', variant: 'destructive' });
      return;
    }

    const formatToICSDate = (date: Date, isAllDay: boolean): string => {
      if (isAllDay) {
        return format(date, 'yyyyMMdd');
      }
      return format(date, "yyyyMMdd'T'HHmmss'Z'");
    };
    
    const CRLF = '\r\n';

    const icsEvents = activeEvents.map(event => {
      let icsEvent = 'BEGIN:VEVENT' + CRLF;
      icsEvent += `UID:${event.id}@calendar.ai` + CRLF;
      icsEvent += `DTSTAMP:${formatToICSDate(new Date(), false)}` + CRLF;
      icsEvent += `DTSTART${event.isAllDay ? ';VALUE=DATE' : ''}:${formatToICSDate(event.date, !!event.isAllDay)}` + CRLF;
      if (event.endDate) {
        icsEvent += `DTEND${event.isAllDay ? ';VALUE=DATE' : ''}:${formatToICSDate(event.endDate, !!event.isAllDay)}` + CRLF;
      }
      icsEvent += `SUMMARY:${event.title}` + CRLF;
      if (event.notes) icsEvent += `DESCRIPTION:${event.notes.replace(/\r\n|\n|\r/g, '\\n')}` + CRLF;
      if (event.location) icsEvent += `LOCATION:${event.location}` + CRLF;
      if (event.url) icsEvent += `URL:${event.url}` + CRLF;
      icsEvent += 'END:VEVENT' + CRLF;
      return icsEvent;
    }).join('');

    const icsFileContent = `BEGIN:VCALENDAR${CRLF}VERSION:2.0${CRLF}PRODID:-//Calendar.ai//AI Calendar Assistant//EN${CRLF}${icsEvents}END:VCALENDAR`;
    
    const blob = new Blob([icsFileContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, 'calendar.ai.ics');
    toast({ title: 'Export Successful', description: 'Your calendar has been downloaded as an .ics file.' });

  }, [activeEvents, toast]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    toast({ title: 'Importing...', description: 'Reading and parsing your calendar file.' });

    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (!content) {
            toast({ title: 'Error', description: 'Could not read file content.', variant: 'destructive' });
            setIsImporting(false);
            return;
        }

        try {
            const response = await fetch('/api/calendar/parse-ics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icsContent: content }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to parse ICS file on the server.');
            }
            
            const parsedEvents = result.data;
            const eventsToSave: TimelineEvent[] = [];

            for (const key in parsedEvents) {
                const item = parsedEvents[key];
                if (item.type === 'VEVENT' && item.summary && item.start) {
                    const startDate = new Date(item.start);
                    const endDate = item.end ? new Date(item.end) : undefined;
                    
                    const isAllDay = !item.start.includes('T') || (item.end && !item.end.includes('T'));

                    const newEvent: TimelineEvent = {
                        id: `ics-${item.uid || Date.now()}-${Math.random()}`,
                        title: item.summary,
                        date: startDate,
                        endDate: endDate,
                        notes: item.description || '',
                        location: item.location || '',
                        isAllDay: isAllDay,
                        type: 'custom',
                        isDeletable: true,
                        status: 'pending',
                        priority: 'None',
                        reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
                    };
                    eventsToSave.push(newEvent);
                }
            }
            
            if (eventsToSave.length === 0) {
                toast({ title: 'No Events Found', description: 'The ICS file did not contain any importable events.' });
                setIsImporting(false);
                return;
            }

            for (const event of eventsToSave) {
                const { icon, ...data } = event;
                const payload = { ...data, date: data.date.toISOString(), endDate: data.endDate ? data.endDate.toISOString() : null };
                await saveTimelineEvent(user.uid, payload, { syncToGoogle: false, timezone });
            }

            await fetchAllEvents();
            toast({ title: 'Import Successful', description: `${eventsToSave.length} event(s) have been added to your timeline.` });

        } catch (error: any) {
            toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsImporting(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    reader.readAsText(file);
  };
  
  const [calendarViewMode, setCalendarViewMode] = useState<'calendar' | 'list'>('calendar');

  const onToggleTrash = () => setIsTrashPanelOpen(!isTrashPanelOpen);

  const calendarWidget = (
    <div className="relative h-full flex flex-col">
       <Tabs defaultValue="calendar" value={calendarViewMode} onValueChange={(value) => setCalendarViewMode(value as 'calendar' | 'list')} className="relative flex-shrink-0">
          <div className="flex justify-between items-center mb-4 gap-2 p-4 pb-0">
            <TabsList className="inline-flex h-auto p-1 rounded-full bg-black/50 backdrop-blur-sm border border-border/30">
              <TabsTrigger value="calendar" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
                <Calendar className="mr-2 h-4 w-4" /> Calendar
              </TabsTrigger>
              <div className="w-px h-6 bg-border/50 self-center" />
              <TabsTrigger value="list" className="px-4 py-1.5 text-sm h-auto rounded-full data-[state=active]:shadow-md">
                <List className="mr-2 h-4 w-4" /> List
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-1">
               <Button onClick={() => handleOpenEditModal()} className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0 justify-center w-10 h-10 p-0 rounded-full">
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Add New Event</span>
              </Button>
               <Button variant="ghost" size="icon" onClick={onToggleTrash} className="h-10 w-10 rounded-full">
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Open Trash</span>
              </Button>
            </div>
          </div>
        </Tabs>
        <div className={cn("transition-all duration-300 flex-1 min-h-0", isTrashPanelOpen && !isMobile && "pr-[22rem] xl:pr-[24rem]")}>
            {calendarViewMode === 'calendar' ? (
                 <EventCalendarView
                    events={activeEvents}
                    month={activeDisplayMonth}
                    onMonthChange={setActiveDisplayMonth}
                    onDayClick={handleDayClickFromCalendar}
                    onSync={handleSyncCalendarData}
                    isSyncing={isLoading}
                    onToggleTrash={onToggleTrash}
                    isTrashOpen={isTrashPanelOpen}
                />
            ) : (
                <TimelineListView events={activeEvents} onDeleteEvent={handleDeleteTimelineEvent} onEditEvent={handleOpenEditModal} />
            )}
        </div>
        {isTrashPanelOpen && (
            <div className="absolute right-0 top-0 h-full w-[22rem] xl:w-96 min-w-[360px]">
                <TrashPanel
                    deletedEvents={recentlyDeletedEvents}
                    onRestore={handleRestoreEvent}
                    onPermanentDelete={handlePermanentDelete}
                    onClose={() => setIsTrashPanelOpen(false)}
                />
            </div>
        )}
    </div>
  );


  if (isMobile) {
    return (
      <div className="space-y-8">
        <div className="md:col-span-2">
          <TodaysPlanCard />
        </div>
        {user?.userType !== 'professional' && <DailyStreakCard />}
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
            <Button onClick={() => handleOpenEditModal()} className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0 justify-center w-10 h-10 p-0 rounded-full">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Add New Event</span>
            </Button>
          </div>
          <TabsContent value="calendar">
            <EventCalendarView
                events={activeEvents}
                month={activeDisplayMonth}
                onMonthChange={setActiveDisplayMonth}
                onDayClick={handleDayClickFromCalendar}
                onSync={handleSyncCalendarData}
                isSyncing={isLoading}
                onToggleTrash={onToggleTrash}
                isTrashOpen={isTrashPanelOpen}
            />
            {selectedDateForDayView && <DayTimetableView date={selectedDateForDayView} events={activeEvents} onClose={closeDayTimetableView} onDeleteEvent={handleDeleteTimelineEvent} onEditEvent={handleOpenEditModal} onEventStatusChange={handleEventStatusUpdate} />}
            <SlidingTimelineView events={activeEvents} onDeleteEvent={handleDeleteTimelineEvent} onEditEvent={handleOpenEditModal} currentDisplayMonth={activeDisplayMonth} onNavigateMonth={handleMonthNavigationForSharedViews} />
          </TabsContent>
          <TabsContent value="list">
            <TimelineListView events={activeEvents} onDeleteEvent={handleDeleteTimelineEvent} onEditEvent={handleOpenEditModal} />
          </TabsContent>
        </Tabs>
        <ImportantEmailsCard />
        <NextMonthHighlightsCard events={activeEvents} />
        {eventBeingEdited && <EditEventModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} eventToEdit={eventBeingEdited} onSubmit={handleSaveEditedEvent} isAddingNewEvent={isAddingNewEvent} isGoogleConnected={!!isGoogleConnected} />}
      </div>
    );
  }

  return (
    <WidgetDashboard 
        activeEvents={activeEvents} 
        onMonthChange={setActiveDisplayMonth} 
        onDayClick={handleDayClickFromCalendar}
        onSync={handleSyncCalendarData}
        isSyncing={isLoading}
        onToggleTrash={onToggleTrash}
        isTrashOpen={isTrashPanelOpen}
        activeDisplayMonth={activeDisplayMonth}
        onNavigateMonth={handleMonthNavigationForSharedViews}
        onDeleteEvent={handleDeleteTimelineEvent}
        onEditEvent={handleOpenEditModal}
        handleOpenEditModal={handleOpenEditModal}
        calendarWidget={calendarWidget}
    >
      {selectedDateForDayView && <DayTimetableView date={selectedDateForDayView} events={activeEvents} onClose={closeDayTimetableView} onDeleteEvent={handleDeleteTimelineEvent} onEditEvent={handleOpenEditModal} onEventStatusChange={handleEventStatusUpdate} />}
      {eventBeingEdited && <EditEventModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} eventToEdit={eventBeingEdited} onSubmit={handleSaveEditedEvent} isAddingNewEvent={isAddingNewEvent} isGoogleConnected={!!isGoogleConnected} />}
    </WidgetDashboard>
  );
}

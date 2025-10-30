'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { TimelineEvent, GoogleTaskList, RawGoogleTask } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getTimelineEvents, saveTimelineEvent, deleteTimelineEvent, restoreTimelineEvent, permanentlyDeleteTimelineEvent } from '@/services/timelineService';
import { useTimezone } from '@/hooks/use-timezone';
import { useIsMobile } from '@/hooks/use-mobile';
import { subDays, startOfDay, isSameDay } from 'date-fns';
import { saveAs } from 'file-saver';
import ical from 'ical';

// Import Widget Components
import TodaysPlanWidget from '@/components/dashboard/widgets/TodaysPlanWidget';
import DailyStreakWidget from '@/components/dashboard/widgets/DailyStreakWidget';
import CalendarWidget from '@/components/dashboard/widgets/CalendarWidget';
import SlidingTimelineWidget from '@/components/dashboard/widgets/SlidingTimelineWidget';
import ImportantEmailsWidget from '@/components/dashboard/widgets/ImportantEmailsWidget';
import NextMonthHighlightsWidget from '@/components/dashboard/widgets/NextMonthHighlightsWidget';
import DayTimetableViewWidget from '@/components/dashboard/widgets/DayTimetableViewWidget';
import GoogleSyncWidget from '@/components/dashboard/widgets/GoogleSyncWidget';
import DataManagementWidget from '@/components/dashboard/widgets/DataManagementWidget';

// Main Dashboard Components
import WidgetDashboard from '@/components/dashboard/WidgetDashboard';
import MaximizedPlannerView from '@/components/planner/MaximizedPlannerView';
import EditEventModal from '@/components/timeline/EditEventModal';
import TrashPanel from '@/components/timeline/TrashPanel';

const LOCAL_STORAGE_KEY = 'futureSightTimelineEvents';

const parseDatePreservingTime = (dateInput: string | Date | undefined): Date | undefined => {
  if (!dateInput) return undefined;
  if (dateInput instanceof Date && !isNaN(dateInput.valueOf())) return dateInput;
  if (typeof dateInput === 'string') {
    try {
      const parsed = new Date(dateInput);
      if (isNaN(parsed.valueOf())) return undefined;
      return parsed;
    } catch (e) { return undefined; }
  }
  return undefined;
};

const syncToLocalStorage = (events: TimelineEvent[]) => {
    if (typeof window !== 'undefined') {
        const serializableEvents = events.map(event => ({
            ...event,
            date: event.date?.toISOString(),
            endDate: event.endDate?.toISOString(),
            deletedAt: event.deletedAt?.toISOString(),
        }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableEvents));
    }
};

const loadFromLocalStorage = (): TimelineEvent[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return parsed.map((event: any) => ({
            ...event,
            date: parseDatePreservingTime(event.date) || new Date(),
            endDate: parseDatePreservingTime(event.endDate),
            deletedAt: parseDatePreservingTime(event.deletedAt),
        })).filter((e: TimelineEvent) => e.date);
    } catch {
        return [];
    }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { timezone } = useTimezone();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const [allTimelineEvents, setAllTimelineEvents] = useState<TimelineEvent[]>(loadFromLocalStorage);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<TimelineEvent | null>(null);
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  
  const [isPlannerMaximized, setIsPlannerMaximized] = useState(false);
  const [isTrashPanelOpen, setIsTrashPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch all events from Firestore
  const fetchAllEvents = useCallback(async () => {
      if (user) {
        setIsDataLoading(true);
        try {
          const firestoreEvents = await getTimelineEvents(user.uid);
          setAllTimelineEvents(firestoreEvents);
          syncToLocalStorage(firestoreEvents);
        } catch (error: any) {
           if (error.message.includes('Failed to fetch')) {
             console.warn("Could not sync timeline, likely offline.");
           } else {
             console.error("Failed to sync timeline from Firestore, using local data.", error);
             toast({ title: "Sync Error", description: "Could not sync timeline.", variant: "destructive"});
           }
        } finally {
            setIsDataLoading(false);
        }
      } else {
        setIsDataLoading(false);
      }
  }, [user, toast]);
  
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Separate events into active and recently deleted
  const { activeEvents, recentlyDeletedEvents } = useMemo(() => {
    const active: TimelineEvent[] = [];
    const deleted: TimelineEvent[] = [];
    const threeDaysAgo = subDays(new Date(), 3);
    for (const event of allTimelineEvents) {
      if (event.deletedAt && event.deletedAt > threeDaysAgo) {
        deleted.push(event);
      } else if (!event.deletedAt) {
        active.push(event);
      }
    }
    return { activeEvents: active, recentlyDeletedEvents: deleted.sort((a,b) => b.deletedAt!.getTime() - a.deletedAt!.getTime()) };
  }, [allTimelineEvents]);

  // Modal and Panel Handlers
  const handleOpenEditModal = useCallback((event?: TimelineEvent, isNew: boolean = false) => {
    const defaultEvent: TimelineEvent = {
      id: `custom-${Date.now()}`,
      title: '',
      date: selectedDateForDayView ? new Date(selectedDateForDayView) : new Date(),
      type: 'custom',
      isDeletable: true,
      priority: 'None',
      status: 'pending',
      reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
    };
    if (!event) defaultEvent.date.setHours(9,0,0,0);
    
    setEventBeingEdited(event || defaultEvent);
    setIsAddingNewEvent(isNew);
    setIsEditModalOpen(true);
  }, [selectedDateForDayView]);

  useEffect(() => {
    if (searchParams.get('action') === 'newEvent') {
      handleOpenEditModal(undefined, true);
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, handleOpenEditModal, router]);

  // CRUD Operations
  const handleSaveEditedEvent = useCallback(async (updatedEvent: TimelineEvent, syncToGoogle: boolean) => {
    if (!user) {
      toast({ title: 'Not signed in', description: 'You must be signed in to save events.', variant: 'destructive' });
      return;
    }
    setIsEditModalOpen(false);
    try {
      const payload = {
          ...updatedEvent,
          date: updatedEvent.date.toISOString(),
          endDate: updatedEvent.endDate ? updatedEvent.endDate.toISOString() : null,
          deletedAt: null, // Ensure not soft-deleted
      };
      await saveTimelineEvent(user.uid, payload, { syncToGoogle, timezone });
      await fetchAllEvents();
      toast({
          title: isAddingNewEvent ? "Event Added" : "Event Updated",
          description: `"${updatedEvent.title}" has been successfully saved.`
      });
    } catch (error: any) {
      toast({ title: 'Save Error', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
      fetchAllEvents(); // Refetch to revert optimistic updates if any
    }
  }, [user, toast, fetchAllEvents, isAddingNewEvent, timezone]);
  
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    if (!user) return;
    const originalEvents = allTimelineEvents;
    const eventToDelete = originalEvents.find(event => event.id === eventId);
    if (!eventToDelete) return;

    setAllTimelineEvents(prev => prev.map(e => e.id === eventId ? { ...e, deletedAt: new Date() } : e));
    toast({ title: "Event Moved to Trash", description: `"${eventToDelete.title}" has been deleted.` });
    try {
      await deleteTimelineEvent(user.uid, eventId);
    } catch (error) {
      setAllTimelineEvents(originalEvents);
      toast({ title: "Sync Error", description: "Could not delete event.", variant: "destructive" });
    }
  }, [user, allTimelineEvents, toast]);

  const handleRestoreEvent = useCallback(async (eventId: string) => {
    if (!user) return;
    await restoreTimelineEvent(user.uid, eventId);
    await fetchAllEvents();
  }, [user, fetchAllEvents]);

  const handlePermanentDelete = useCallback(async (eventId: string) => {
    if (!user) return;
    await permanentlyDeleteTimelineEvent(user.uid, eventId);
    await fetchAllEvents();
    toast({ title: 'Event Permanently Deleted' });
  }, [user, fetchAllEvents, toast]);

  const handleEventStatusUpdate = useCallback(async (eventId: string, newStatus: 'completed' | 'missed') => {
    if (!user) return;
    const eventToUpdate = allTimelineEvents.find(event => event.id === eventId);
    if (!eventToUpdate) return;
    const updatedEvent = { ...eventToUpdate, status: newStatus };
    setAllTimelineEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
    try {
      const payload = {
        ...updatedEvent,
        date: updatedEvent.date.toISOString(),
        endDate: updatedEvent.endDate ? updatedEvent.endDate.toISOString() : null,
      };
      await saveTimelineEvent(user.uid, payload, { syncToGoogle: !!updatedEvent.googleEventId, timezone });
    } catch (error) {
      fetchAllEvents();
      toast({ title: "Sync Error", description: "Could not save status.", variant: "destructive" });
    }
  }, [allTimelineEvents, user, toast, fetchAllEvents, timezone]);

  const allComponents = {
    plan: <TodaysPlanWidget />,
    streak: <DailyStreakWidget />,
    calendar: <CalendarWidget onDayClick={setSelectedDateForDayView} onToggleTrash={() => setIsTrashPanelOpen(prev => !prev)} />,
    "day-timetable": <DayTimetableViewWidget date={selectedDateForDayView} events={activeEvents} onClose={() => setSelectedDateForDayView(null)} onEditEvent={handleOpenEditModal} onDeleteEvent={handleDeleteEvent} onEventStatusChange={handleEventStatusUpdate} onMaximize={() => setIsPlannerMaximized(true)} />,
    timeline: <SlidingTimelineWidget events={activeEvents} onEditEvent={handleOpenEditModal} onDeleteEvent={handleDeleteEvent} />,
    emails: <ImportantEmailsWidget />,
    "next-month": <NextMonthHighlightsWidget events={activeEvents} />,
    sync: <GoogleSyncWidget onSyncComplete={fetchAllEvents} />,
    data: <DataManagementWidget events={activeEvents} onImportComplete={fetchAllEvents} />,
  };
  
  if (isPlannerMaximized) {
    return <MaximizedPlannerView initialDate={selectedDateForDayView || new Date()} allEvents={allTimelineEvents} onMinimize={() => setIsPlannerMaximized(false)} onEditEvent={handleOpenEditModal} onDeleteEvent={handleDeleteEvent} />;
  }

  // The main dashboard layout for desktop and mobile
  if (isMobile) {
    return (
      <div className="space-y-6">
        <TodaysPlanWidget />
        <DailyStreakWidget />
        <CalendarWidget onDayClick={setSelectedDateForDayView} onToggleTrash={() => setIsTrashPanelOpen(true)} />
        {selectedDateForDayView && (
          <DayTimetableViewWidget date={selectedDateForDayView} events={activeEvents} onClose={() => setSelectedDateForDayView(null)} onEditEvent={handleOpenEditModal} onDeleteEvent={handleDeleteEvent} onEventStatusChange={handleEventStatusUpdate} onMaximize={() => setIsPlannerMaximized(true)} />
        )}
        <ImportantEmailsWidget />
        <SlidingTimelineWidget events={activeEvents} onEditEvent={handleOpenEditModal} onDeleteEvent={handleDeleteEvent} />
        <NextMonthHighlightsWidget events={activeEvents} />
        <GoogleSyncWidget onSyncComplete={fetchAllEvents} />
        <DataManagementWidget events={activeEvents} onImportComplete={fetchAllEvents} />
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <WidgetDashboard 
        components={allComponents}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
      />
      {eventBeingEdited && (
        <EditEventModal 
          isOpen={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          eventToEdit={eventBeingEdited} 
          onSubmit={handleSaveEditedEvent} 
          isAddingNewEvent={isAddingNewEvent}
          isGoogleConnected={true} // Assume connected for modal, button will be disabled if not
        />
      )}
      {isTrashPanelOpen && (
         <div className="absolute right-0 top-0 h-full w-[22rem] xl:w-96 min-w-[360px] z-20">
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
}

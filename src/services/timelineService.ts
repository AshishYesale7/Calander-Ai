
'use server';

import { db } from '@/lib/firebase';
import type { TimelineEvent } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, query, orderBy, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getAuthenticatedClient } from './googleAuthService';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from './googleCalendarService';
import { startOfDay } from 'date-fns';

const getTimelineEventsCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'timelineEvents');
};

const fromFirestore = (docData: any): TimelineEvent => {
    const data = docData.data();
    return {
        id: docData.id,
        ...data,
        // Convert Firestore Timestamp to JS Date
        date: data.date ? (data.date as Timestamp).toDate() : new Date(),
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
        deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : undefined, // Handle soft delete timestamp
        // Ensure deletable is set, defaulting based on ID prefix if not present
        isDeletable: data.isDeletable === undefined ? (docData.id.startsWith('ai-') ? true : false) : data.isDeletable,
        googleEventId: data.googleEventId || undefined,
    };
};

export const getTimelineEvents = async (userId: string): Promise<TimelineEvent[]> => {
  const eventsCollection = getTimelineEventsCollection(userId);
  // Order by date to get them in a sensible default order
  const q = query(eventsCollection, orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  // This now returns all events; client will filter active vs. deleted
  return snapshot.docs.map(fromFirestore);
};

type SaveTimelineEventOptions = {
    syncToGoogle: boolean;
};

export const saveTimelineEvent = async (
    userId: string,
    event: Omit<TimelineEvent, 'icon' | 'date' | 'endDate' | 'deletedAt'> & { date: string; endDate?: string | null; deletedAt?: string | null },
    options: SaveTimelineEventOptions
): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, event.id);

    let googleEventId = event.googleEventId || null;
    const client = await getAuthenticatedClient(userId);
    
    let eventDate = new Date(event.date);
    // Crucial fix: Ensure all-day events are always set to the start of the day UTC.
    if (event.isAllDay) {
        eventDate = startOfDay(eventDate);
    }
    const eventEndDate = event.endDate ? new Date(event.endDate) : undefined;

    // This block handles the Google Calendar sync logic.
    if (client && options.syncToGoogle) {
      try {
        const eventPayloadForGoogle: TimelineEvent = {
          ...event,
          date: eventDate,
          endDate: eventEndDate,
        } as TimelineEvent;

        if (googleEventId) {
          await updateGoogleCalendarEvent(userId, googleEventId, eventPayloadForGoogle);
        } else {
          const newGoogleEvent = await createGoogleCalendarEvent(userId, eventPayloadForGoogle);
          if (newGoogleEvent && newGoogleEvent.id) {
            googleEventId = newGoogleEvent.id;
          }
        }
      } catch (error) {
        console.error("Critical Error: Failed to sync event to Google Calendar. Saving to Firestore only.", error);
        throw new Error("Event saved locally, but failed to sync with Google Calendar. Please check permissions in Settings.");
      }
    }

    // Prepare data for Firestore.
    const dataToSave: any = {
        ...event,
        date: Timestamp.fromDate(eventDate),
        endDate: eventEndDate ? Timestamp.fromDate(eventEndDate) : null,
    };
    
    if (googleEventId) {
        dataToSave.googleEventId = googleEventId;
    } else {
        delete dataToSave.googleEventId;
    }

    // Explicitly delete null/undefined fields that we don't want to store.
    if (!dataToSave.endDate) delete dataToSave.endDate;
    if (!dataToSave.deletedAt) delete dataToSave.deletedAt;

    await setDoc(eventDocRef, dataToSave, { merge: true });
};

// This function now performs a "soft delete"
export const deleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, eventId);

    try {
        const docSnap = await getDoc(eventDocRef);
        if (docSnap.exists()) {
            const eventData = docSnap.data();
            if (eventData.googleEventId) {
                await deleteGoogleCalendarEvent(userId, eventData.googleEventId);
            }
        }
    } catch (error) {
        console.error(`Error deleting associated Google Calendar event for event ${eventId}:`, error);
    }
    
    await setDoc(eventDocRef, { deletedAt: Timestamp.now() }, { merge: true });
};

// New function to restore a soft-deleted event
export const restoreTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, eventId);

    const eventSnap = await getDoc(eventDocRef);
    if (!eventSnap.exists()) {
        console.warn(`Event ${eventId} not found for restoration.`);
        return;
    }

    const eventData = fromFirestore(eventSnap);
    let newGoogleEventId = eventData.googleEventId || null;

    if (eventData.googleEventId) {
        try {
            const newGoogleEvent = await createGoogleCalendarEvent(userId, eventData);
            if (newGoogleEvent && newGoogleEvent.id) {
                newGoogleEventId = newGoogleEvent.id;
            } else {
                newGoogleEventId = null;
            }
        } catch (error) {
            console.error(`Failed to re-create Google Calendar event for ${eventId}. Event will be restored locally only.`, error);
            newGoogleEventId = null; 
        }
    }

    await updateDoc(eventDocRef, {
        deletedAt: deleteField(),
        googleEventId: newGoogleEventId,
    });
};

export const permanentlyDeleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, eventId);
    await deleteDoc(eventDocRef);
};

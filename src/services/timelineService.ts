
'use server';

import { db } from '@/lib/firebase';
import type { TimelineEvent } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, query, orderBy, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getAuthenticatedClient as getGoogleAuthClient } from './googleAuthService';
import { getAuthenticatedClient as getMicrosoftAuthClient } from './microsoftGraphService';
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from './googleCalendarService';
// We will need to create these functions for Microsoft
// import { createMicrosoftCalendarEvent, updateMicrosoftCalendarEvent, deleteMicrosoftCalendarEvent } from './microsoftGraphService';
import { startOfDay, endOfDay } from 'date-fns';
import { sendWebPushNotification } from '@/ai/flows/send-notification-flow';
import { createNotification } from './notificationService';
import { logUserActivity } from './activityLogService';

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
        date: data.date ? (data.date as Timestamp).toDate() : new Date(),
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
        deletedAt: data.deletedAt ? (data.deletedAt as Timestamp).toDate() : undefined,
        isDeletable: data.isDeletable === undefined ? (docData.id.startsWith('ai-') ? true : false) : data.isDeletable,
        googleEventId: data.googleEventId || undefined,
        microsoftEventId: data.microsoftEventId || undefined, // Add microsoftEventId
        reminder: data.reminder || { enabled: true, earlyReminder: '1_day', repeat: 'none', repeatEndDate: null },
    };
};

export const getTimelineEvents = async (userId: string): Promise<TimelineEvent[]> => {
  const eventsCollection = getTimelineEventsCollection(userId);
  const q = query(eventsCollection, orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

type SaveTimelineEventOptions = {
    syncToGoogle: boolean;
    syncToMicrosoft: boolean; // Add option for Microsoft sync
    timezone: string;
};

export const saveTimelineEvent = async (
    userId: string,
    event: Omit<TimelineEvent, 'icon' | 'date' | 'endDate' | 'deletedAt'> & { date: string; endDate?: string | null; deletedAt?: string | null },
    options: SaveTimelineEventOptions
): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, event.id);

    const docSnap = await getDoc(eventDocRef);
    const isNewEvent = !docSnap.exists();

    let googleEventId = event.googleEventId || null;
    let microsoftEventId = event.microsoftEventId || null;
    
    let eventDate = new Date(event.date);
    let eventEndDate = event.endDate ? new Date(event.endDate) : undefined;
    
    const eventPayloadForApis: TimelineEvent = {
        ...event,
        date: eventDate,
        endDate: eventEndDate,
    } as TimelineEvent;

    // Google Calendar Sync
    if (options.syncToGoogle) {
      const googleClient = await getGoogleAuthClient(userId);
      if (googleClient) {
        try {
          if (googleEventId) {
            await updateGoogleCalendarEvent(userId, googleEventId, eventPayloadForApis, options.timezone);
          } else {
            const newGoogleEvent = await createGoogleCalendarEvent(userId, eventPayloadForApis, options.timezone);
            if (newGoogleEvent && newGoogleEvent.id) {
              googleEventId = newGoogleEvent.id;
            }
          }
        } catch (error) {
          console.error("Critical Error: Failed to sync event to Google Calendar.", error);
          throw new Error("Could not sync to Google Calendar. Please check permissions in Settings.");
        }
      } else if (isNewEvent || event.googleEventId) { // Only throw error if user intended to sync
         console.warn(`User ${userId} opted to sync to Google, but is not authenticated.`);
         throw new Error("Could not sync to Google Calendar. Please connect your Google account in Settings.");
      }
    }

    // Microsoft Calendar Sync (Conceptual - requires microsoftGraphService to have similar functions)
    if (options.syncToMicrosoft) {
      const microsoftClient = await getMicrosoftAuthClient(userId);
      if (microsoftClient) {
        // Conceptual: you would implement these functions in microsoftGraphService
        // try {
        //   if (microsoftEventId) {
        //     await updateMicrosoftCalendarEvent(userId, microsoftEventId, eventPayloadForApis);
        //   } else {
        //     const newMicrosoftEvent = await createMicrosoftCalendarEvent(userId, eventPayloadForApis);
        //     if (newMicrosoftEvent && newMicrosoftEvent.id) {
        //       microsoftEventId = newMicrosoftEvent.id;
        //     }
        //   }
        // } catch (error) {
        //   console.error("Critical Error: Failed to sync event to Microsoft Calendar.", error);
        //   microsoftEventId = null;
        // }
      } else {
         console.warn(`User ${userId} opted to sync to Microsoft, but is not authenticated.`);
         microsoftEventId = null;
      }
    }

    const dataToSave: any = {
        ...event,
        date: Timestamp.fromDate(new Date(event.date)),
        endDate: event.endDate ? Timestamp.fromDate(new Date(event.endDate)) : null,
        reminder: event.reminder || { enabled: true, earlyReminder: '1_day', repeat: 'none', repeatEndDate: null },
    };
    
    dataToSave.googleEventId = googleEventId || deleteField();
    dataToSave.microsoftEventId = microsoftEventId || deleteField();
    
    if (event.deletedAt) {
        dataToSave.deletedAt = Timestamp.fromDate(new Date(event.deletedAt));
    } else {
        dataToSave.deletedAt = deleteField();
    }

    if (!dataToSave.endDate) delete dataToSave.endDate;

    await setDoc(eventDocRef, dataToSave, { merge: true });
    
    if (isNewEvent) {
      let activityType: 'event_created' | 'google_event_synced' | 'google_task_synced' = 'event_created';
      if(event.id.startsWith('gcal-')) activityType = 'google_event_synced';
      else if (event.id.startsWith('gtask-')) activityType = 'google_task_synced';
      await logUserActivity(userId, activityType, { id: event.id, title: event.title });
    }

    if (event.reminder && event.reminder.enabled && event.reminder.earlyReminder !== 'none') {
        const reminderMapping = {
            'none': '', 'on_day': 'On the day of the event', '1_day': '1 day before',
            '2_days': '2 days before', '1_week': '1 week before'
        }
        const reminderText = reminderMapping[event.reminder.earlyReminder] || 'at the scheduled time';
        const notificationMessage = `Reminder for "${event.title}" is set for ${reminderText}.`;
        
        try {
            await createNotification({ type: 'event_reminder', message: notificationMessage, link: '/dashboard', userId: userId });
        } catch (notificationError) {
            console.warn("Failed to send confirmation notification:", notificationError);
        }
    }
};

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
            // Add a similar check for Microsoft
            // if (eventData.microsoftEventId) {
            //     await deleteMicrosoftCalendarEvent(userId, eventData.microsoftEventId);
            // }
            await logUserActivity(userId, 'event_deleted', { id: eventId, title: eventData.title });
        }
    } catch (error) {
        console.error(`Error deleting associated cloud event(s) for event ${eventId}:`, error);
    }
    
    await setDoc(eventDocRef, { deletedAt: Timestamp.now() }, { merge: true });
};

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
    let newMicrosoftEventId = eventData.microsoftEventId || null;

    if (eventData.isDeletable && eventData.googleEventId) { 
        try {
            const newGoogleEvent = await createGoogleCalendarEvent(userId, eventData, 'UTC');
            newGoogleEventId = newGoogleEvent?.id || null;
        } catch (error) {
            console.error(`Failed to re-create Google Calendar event for ${eventId}.`, error);
            newGoogleEventId = null; 
        }
    }
    
    // Add similar logic for Microsoft
    // if (eventData.isDeletable && eventData.microsoftEventId) { ... }

    await updateDoc(eventDocRef, {
        deletedAt: deleteField(),
        googleEventId: newGoogleEventId,
        microsoftEventId: newMicrosoftEventId,
    });
};

export const permanentlyDeleteTimelineEvent = async (userId: string, eventId: string): Promise<void> => {
    const eventsCollection = getTimelineEventsCollection(userId);
    const eventDocRef = doc(eventsCollection, eventId);
    await deleteDoc(eventDocRef);
};

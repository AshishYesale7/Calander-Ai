
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawCalendarEvent, TimelineEvent } from '@/types';
import { startOfMonth, endOfMonth, formatISO, format, addDays, addHours, addMonths, subMonths, startOfDay } from 'date-fns';

function timelineEventToGoogleEvent(event: TimelineEvent) {
  const googleEvent: any = {
    summary: event.title,
    description: event.notes,
    location: event.location,
    // You can add more mappings here, like for attendees, etc.
  };

  if (event.isAllDay) {
    googleEvent.start = { date: format(startOfDay(event.date), 'yyyy-MM-dd') };
    // For all-day events, Google's end date is exclusive.
    // If an `endDate` is provided, we need to set the Google event's end to the day *after* it.
    // If no `endDate` is provided, it's a single-day event, so the end is the day after the start date.
    const endDateForGoogle = event.endDate ? addDays(startOfDay(event.endDate), 1) : addDays(startOfDay(event.date), 1);
    googleEvent.end = { date: format(endDateForGoogle, 'yyyy-MM-dd') };
  } else {
    googleEvent.start = { dateTime: event.date.toISOString() };
    // If no end date, default to a 1-hour duration.
    const endDate = event.endDate || addHours(event.date, 1);
    googleEvent.end = { dateTime: endDate.toISOString() };
  }
  return googleEvent;
}

export async function createGoogleCalendarEvent(userId: string, event: TimelineEvent) {
  const client = await getAuthenticatedClient(userId);
  if (!client) throw new Error("User is not authenticated with Google.");

  const calendar = google.calendar({ version: 'v3', auth: client });
  const googleEvent = timelineEventToGoogleEvent(event);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: googleEvent,
  });

  return response.data;
}

export async function updateGoogleCalendarEvent(userId: string, googleEventId: string, event: TimelineEvent) {
  const client = await getAuthenticatedClient(userId);
  if (!client) throw new Error("User is not authenticated with Google.");
  
  const calendar = google.calendar({ version: 'v3', auth: client });
  const googleEvent = timelineEventToGoogleEvent(event);

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: googleEvent,
  });
  
  return response.data;
}

export async function deleteGoogleCalendarEvent(userId: string, googleEventId: string) {
    const client = await getAuthenticatedClient(userId);
    if (!client) {
        console.warn(`User ${userId} not authenticated. Skipping Google Calendar event deletion.`);
        return;
    }
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
        });
    } catch (error: any) {
        // If the event is already deleted on Google's side (410 Gone), we don't need to throw an error.
        if (error.code === 410) {
            console.log(`Event ${googleEventId} already deleted in Google Calendar.`)
        } else {
            console.error(`Error deleting Google Calendar event for user ${userId}:`, error);
            throw new Error('Failed to delete Google Calendar event.');
        }
    }
}


export async function getGoogleCalendarEvents(userId: string): Promise<RawCalendarEvent[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    // This case should be handled by the UI before calling this function,
    // but as a safeguard, we return an empty array.
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch calendar events.`);
    return [];
  }

  const calendar = google.calendar({ version: 'v3', auth: client });
  const now = new Date();
  // Fetch events from 3 months in the past to 3 months in the future
  const timeMin = startOfMonth(subMonths(now, 3)).toISOString();
  const timeMax = endOfMonth(addMonths(now, 3)).toISOString();

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      return [];
    }

    // Transform Google API event format to our RawCalendarEvent format
    return events.map((event): RawCalendarEvent | null => {
      // Google returns either dateTime (for timed events) or date (for all-day events)
      const startDateTime = event.start?.dateTime || event.start?.date;
      const endDateTime = event.end?.dateTime || event.end?.date;

      if (!event.id || !event.summary || !startDateTime || !endDateTime) {
        return null; // Skip events with missing essential data
      }

      return {
        id: event.id,
        summary: event.summary,
        description: event.description || undefined,
        startDateTime: formatISO(new Date(startDateTime)),
        endDateTime: formatISO(new Date(endDateTime)),
        htmlLink: event.htmlLink || undefined,
      };
    }).filter((event): event is RawCalendarEvent => event !== null);

  } catch (error) {
    console.error(`Error fetching Google Calendar events for user ${userId}:`, error);
    // This could be due to expired tokens or insufficient permissions.
    // The error will be caught by the calling function.
    throw new Error('Failed to fetch Google Calendar events.');
  }
}

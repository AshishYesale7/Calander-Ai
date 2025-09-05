
'use server';
/**
 * @fileOverview An AI agent for processing Google data (Calendar, Tasks, etc.) to extract actionable insights.
 *
 * - processGoogleData - A function that takes calendar events and tasks, then returns AI-generated actionable insights.
 * - ProcessGoogleDataInput - The input type for the processGoogleData function.
 * - ProcessGoogleDataOutput - The return type for the processGoogleData function.
 */

import { ai } from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for Google API Data
const RawCalendarEventSchema = z.object({
  id: z.string().describe("Original ID of the calendar event."),
  summary: z.string().describe("Title or summary of the calendar event."),
  description: z.string().optional().describe("Detailed description of the event."),
  startDateTime: z.string().datetime().describe("Start date and time of the event (ISO 8601 format). For all-day events, this might be just the date part, ensure to handle as start of day if time is missing."),
  endDateTime: z.string().datetime().describe("End date and time of the event (ISO 8601 format). For all-day events, this might be the start of the next day, or just the date part."),
  htmlLink: z.string().optional().describe("Link to the event in Google Calendar.")
});

const RawGoogleTaskSchema = z.object({
  id: z.string().describe("Original ID of the Google Task."),
  title: z.string().describe("Title of the task."),
  notes: z.string().optional().describe("Detailed description of the task."),
  due: z.string().datetime().optional().describe("Due date of the task (ISO 8601 format)."),
  status: z.enum(['needsAction', 'completed']).describe("Status of the task."),
  link: z.string().url().optional().describe("Link to the task."),
});

const ProcessGoogleDataPayloadSchema = z.object({
  calendarEvents: z.array(RawCalendarEventSchema)
    .optional()
    .describe("A list of Google Calendar events for a relevant period. Can be empty."),
  googleTasks: z.array(RawGoogleTaskSchema)
    .optional()
    .describe("A list of pending Google Tasks. Can be empty."),
  userId: z.string().describe("The user's unique ID.")
});

const ProcessGoogleDataInputSchema = ProcessGoogleDataPayloadSchema.extend({
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type ProcessGoogleDataInput = z.infer<typeof ProcessGoogleDataInputSchema>;

const ActionableInsightSchema = z.object({
  id: z.string().describe("A unique ID for this insight (e.g., 'cal:original_event_id' or 'task:original_task_id')."),
  googleEventId: z.string().optional().describe("The original, unmodified event ID from the Google Calendar API."),
  googleTaskId: z.string().optional().describe("The original, unmodified task ID from the Google Tasks API."),
  title: z.string().describe("A concise title for the actionable item or event. If there's a specific time associated (e.g., 'Meeting at 10:00 AM'), include it here."),
  date: z.string().datetime().describe("The primary date/time for this item (ISO 8601 format). For calendar events, use the startDateTime. For tasks, use the due date."),
  endDate: z.string().datetime().optional().describe("The end date/time for this item (ISO 8601 format), if applicable (e.g., from calendar events)."),
  isAllDay: z.boolean().optional().describe("Set to true if this is an all-day event (typically from calendar or tasks). If true, 'date' should be the start of the day, and 'endDate' might be the start of the next day or omitted."),
  summary: z.string().describe("A brief AI-generated summary of the item or key details from the event/task."),
  source: z.enum(['google_calendar', 'gmail', 'google_tasks']).describe("Indicates whether the insight originated from Google Calendar, Gmail, or Google Tasks."),
  originalLink: z.string().optional().describe("A direct link to the original Google item, if available. This should be a valid URL string.")
});
export type ActionableInsight = z.infer<typeof ActionableInsightSchema>;

const ProcessGoogleDataOutputSchema = z.object({
  insights: z.array(ActionableInsightSchema).describe("A list of actionable insights and summaries derived from the provided Google data.")
});
export type ProcessGoogleDataOutput = z.infer<typeof ProcessGoogleDataOutputSchema>;

const processGoogleDataPrompt = ai.definePrompt({
    name: 'processGoogleDataPrompt',
    input: { schema: z.object({
        calendarEventsSection: z.string(),
        googleTasksSection: z.string(),
        currentDate: z.string(),
    }) },
    output: { schema: ProcessGoogleDataOutputSchema },
    prompt: `You are an expert personal assistant AI. Your task is to analyze a user's Google data (Calendar events, Tasks) to identify important upcoming events, deadlines, and tasks.

Context:
- Today's date is {{{currentDate}}}.
- The user wants to track important items from their Google account.

Provided Data:
1. Google Calendar Events:
{{{calendarEventsSection}}}

2. Google Tasks (To-Do list):
{{{googleTasksSection}}}


---
**Combined Processing Instructions:**

1.  Review all provided calendar events and Google tasks.
2.  For each item (event or task), determine if it represents an important event, task, or deadline.
3.  Generate a concise 'title' for each insight. For calendar events with a specific time, include it in the title (e.g., "Meeting at 10:00 AM").
4.  For the 'date' field, use the full ISO 8601 'startDateTime' for calendar events and the 'due' date for tasks.
5.  Correctly identify all-day calendar events and set 'isAllDay' to true.
6.  **All Google Tasks should be treated as all-day events**. Set their 'isAllDay' flag to true.
7.  Create a brief 'summary' for each insight from the event/task description or notes.
8.  Based on the source, set the appropriate ID field:
    - For Calendar events: Use the original 'Event ID' for the 'googleEventId' field. Construct the main 'id' by prefixing 'cal:'.
    - For Tasks: Use the original 'Task ID' for the 'googleTaskId' field. Construct the main 'id' by prefixing 'task:'.
9.  Set the 'source' to 'google_calendar' or 'google_tasks' accordingly.
10. Include the 'originalLink' if available ('htmlLink' for events, 'link' for tasks).

Structure your final output strictly according to the 'ActionableInsightSchema'.
Generate the list of actionable insights based on all the provided data.
`,
});

const processGoogleDataFlow = ai.defineFlow({
    name: 'processGoogleDataFlow',
    inputSchema: ProcessGoogleDataInputSchema,
    outputSchema: ProcessGoogleDataOutputSchema,
}, async (input) => {
    const currentDate = new Date().toISOString();

    let calendarEventsSection = 'No calendar events provided.';
    if (input.calendarEvents && input.calendarEvents.length > 0) {
      calendarEventsSection = input.calendarEvents.map(event => `
- Event ID: ${event.id}
  Title: ${event.summary}
  Description: ${event.description || ''}
  Starts (ISO 8601): ${event.startDateTime}
  Ends (ISO 8601): ${event.endDateTime}
  Link: ${event.htmlLink || ''}
`).join('');
    }
    
    let googleTasksSection = 'No Google Tasks provided.';
    if (input.googleTasks && input.googleTasks.length > 0) {
      googleTasksSection = input.googleTasks.map(task => `
- Task ID: ${task.id}
  Title: ${task.title}
  Notes: ${task.notes || ''}
  Due Date (ISO 8601): ${task.due || 'Not set'}
  Link: ${task.link || ''}
`).join('');
    }

    const { output } = await processGoogleDataPrompt({
        currentDate,
        calendarEventsSection,
        googleTasksSection,
    });

    if (!output) {
      console.warn('AI did not return expected output for processGoogleDataFlow.');
      return { insights: [] };
    }
    return output;
});

export async function processGoogleData(input: ProcessGoogleDataInput): Promise<ProcessGoogleDataOutput> {
  return processGoogleDataFlow(input);
}

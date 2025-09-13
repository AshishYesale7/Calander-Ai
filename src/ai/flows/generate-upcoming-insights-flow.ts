
'use server';
/**
 * @fileOverview An AI agent for generating smart, prioritized insights about the upcoming week.
 *
 * - generateUpcomingInsights - Creates a prioritized list of tasks and prep steps for the week.
 * - GenerateUpcomingInsightsInput - The input type for the function.
 * - GenerateUpcomingInsightsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getTimelineEvents } from '@/services/timelineService';
import { getCareerGoals } from '@/services/careerGoalsService';
import { getAllTasksFromList, getGoogleTaskLists } from '@/services/googleTasksService';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import type { CareerGoal, TimelineEvent, RawGoogleTask } from '@/types';

// Input Schema: Just requires the user ID.
const GenerateUpcomingInsightsInputSchema = z.object({
  userId: z.string().describe("The user's unique ID to fetch their data."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateUpcomingInsightsInput = z.infer<typeof GenerateUpcomingInsightsInputSchema>;

// Output Schema: Defines the structure for the AI's response.
const GenerateUpcomingInsightsOutputSchema = z.object({
  prioritizedTasks: z.array(z.object({
    taskTitle: z.string().describe("The title of the task."),
    reasoning: z.string().describe("A short, single-sentence explanation of WHY this task is critical, linking it to a specific career goal or upcoming event."),
    dueDate: z.string().datetime().describe("The due date of the task in ISO 8601 format."),
  })).describe("A list of the 3-5 most critical tasks for the upcoming week, prioritized by their importance to user goals."),
  
  prepForEvents: z.array(z.object({
    eventName: z.string().describe("The name of the major event to prepare for."),
    eventDate: z.string().datetime().describe("The date of the event in ISO 8601 format."),
    suggestedMicroTasks: z.array(z.string()).describe("A list of 2-3 specific, actionable micro-tasks to prepare for this event."),
  })).describe("A list of 1-2 major upcoming events (exams, project deadlines) and suggested preparation steps."),

  upcomingDeadlines: z.array(z.object({
      title: z.string(),
      date: z.string().datetime(),
  })).describe("A simple list of hard deadlines (exams, applications) in the next 14 days."),
});
export type GenerateUpcomingInsightsOutput = z.infer<typeof GenerateUpcomingInsightsOutputSchema>;

const upcomingInsightsPrompt = ai.definePrompt({
    name: 'upcomingInsightsPrompt',
    input: { schema: z.object({
        currentDate: z.string(),
        upcomingEventsText: z.string(),
        upcomingTasksText: z.string(),
        careerGoalsText: z.string(),
    }) },
    output: { schema: GenerateUpcomingInsightsOutputSchema },
    prompt: `You are an expert productivity coach AI. Your task is to analyze a user's upcoming schedule and goals to create a smart, prioritized "Week Ahead" summary.

Current Date: {{{currentDate}}}

**User's Career Goals:**
{{{careerGoalsText}}}

**User's Upcoming Tasks (from Google Tasks):**
{{{upcomingTasksText}}}

**User's Upcoming Calendar Events:**
{{{upcomingEventsText}}}

**Instructions:**

1.  **Identify Critical Tasks:**
    *   Review all upcoming tasks and events.
    *   Select the **3 to 5 most critical tasks** due in the next 7 days.
    *   For each task, provide a concise 'reasoning' sentence that directly connects it to one of the user's career goals or a major upcoming event (e.g., "This is critical for making progress on your 'Publish Research Paper' goal.").

2.  **Suggest Event Preparation:**
    *   Identify 1-2 major, high-stakes events from the calendar in the next 14 days (e.g., "GATE Exam", "Project Alpha Demo").
    *   For each major event, suggest 2-3 small, actionable "micro-tasks" the user can do this week to prepare (e.g., "Finalize presentation deck", "Complete 2 mock tests").

3.  **List Hard Deadlines:**
    *   Create a simple list of all events with types 'exam' or 'application' that are due in the next 14 days.

Your entire output must be a single, valid JSON object that adheres to the output schema.`,
});


const generateUpcomingInsightsFlow = ai.defineFlow({
    name: 'generateUpcomingInsightsFlow',
    inputSchema: GenerateUpcomingInsightsInputSchema,
    outputSchema: GenerateUpcomingInsightsOutputSchema,
}, async (input) => {
    const now = new Date();
    const twoWeeksFromNow = endOfDay(addDays(now, 14));

    // 1. Fetch all necessary data
    const [timelineEvents, careerGoals, taskLists] = await Promise.all([
        getTimelineEvents(input.userId),
        getCareerGoals(input.userId),
        getGoogleTaskLists(input.userId),
    ]);
    
    const allTasksNested = await Promise.all(taskLists.map(list => getAllTasksFromList(input.userId, list.id)));
    const allTasks = allTasksNested.flat();

    // 2. Filter data for the relevant timeframe (next 14 days)
    const upcomingEvents = timelineEvents.filter(e => e.date >= now && e.date <= twoWeeksFromNow);
    const upcomingTasks = allTasks.filter(t => t.due && new Date(t.due) >= now && new Date(t.due) <= twoWeeksFromNow);

    // 3. Format data into text for the prompt
    const careerGoalsText = careerGoals.length > 0
        ? careerGoals.map(g => `- ${g.title} (Progress: ${g.progress}%)`).join('\n')
        : 'No career goals set.';
    
    const upcomingTasksText = upcomingTasks.length > 0
        ? upcomingTasks.map(t => `- "${t.title}" due on ${format(new Date(t.due!), 'PPP')}`).join('\n')
        : 'No upcoming tasks.';

    const upcomingEventsText = upcomingEvents.length > 0
        ? upcomingEvents.map(e => `- "${e.title}" on ${format(e.date, 'PPP')}, Type: ${e.type}`).join('\n')
        : 'No upcoming events.';
        
    // 4. Call the AI prompt
    const { output } = await upcomingInsightsPrompt({
        currentDate: now.toISOString(),
        upcomingEventsText,
        upcomingTasksText,
        careerGoalsText,
    });

    if (!output) {
      throw new Error("The AI model did not return valid insights.");
    }
    
    return output;
});


export async function generateUpcomingInsights(input: GenerateUpcomingInsightsInput): Promise<GenerateUpcomingInsightsOutput> {
  return generateUpcomingInsightsFlow(input);
}

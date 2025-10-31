
'use server';
/**
 * @fileOverview An AI agent for generating a daily briefing for the user.
 * This flow synthesizes data from Gmail, Calendar, and weekly insights.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { getGoogleGmailMessages } from '@/services/googleGmailService';
import { getTimelineEvents } from '@/services/timelineService';
import { generateUpcomingInsights } from './generate-upcoming-insights-flow';
import { startOfDay, endOfDay, format } from 'date-fns';
import { isSameDay } from 'date-fns';
import type { GenerateDailyBriefingOutput } from '@/types';
import { GenerateDailyBriefingOutputSchema } from '@/types';

const GenerateDailyBriefingInputSchema = z.object({
  userId: z.string().describe("The user's unique ID to fetch their data."),
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});

const briefingPrompt = genkit({
    name: 'dailyBriefingPrompt',
    inputSchema: z.object({
        todaysDate: z.string(),
        userName: z.string().optional(),
        todaysEvents: z.string(),
        todaysEmails: z.string(),
        weeklyInsights: z.string(),
    }),
    outputSchema: GenerateDailyBriefingOutputSchema,
}, async (input) => {
    return {
        prompt: `You are an expert personal assistant AI named 'Calendar.ai'. Your goal is to provide a clear, concise, and actionable daily briefing for a user.

Date: ${input.todaysDate}
User's Name: ${input.userName || 'there'}

**1. Today's Key Events & Deadlines:**
${input.todaysEvents}

**2. Important Emails Received Today:**
${input.todaysEmails}

**3. This Week's Overall Priorities (for context):**
${input.weeklyInsights}

---
**YOUR TASK**
Analyze all the provided information and generate a single, friendly paragraph that summarizes the user's day. Follow these instructions:

1.  **Greeting:** Start with a friendly greeting, like "Good morning, [User's Name]!".
2.  **Synthesize, Don't List:** Do not just list the events and emails. Synthesize the information into a cohesive narrative. For example, if there is a meeting about 'Project Alpha' and an email about 'Project Alpha', connect them.
3.  **Prioritize:** Mention the most critical items first. Look at event titles and email subjects for keywords like "Urgent," "Action Required," or "Deadline."
4.  **Highlight Key Info:** Briefly mention the number of meetings, key email topics, and how they relate to the weekly goals if possible.
5.  **Keep it Concise:** The entire briefing should be a single, easy-to-read paragraph.

Your entire output must be a single, valid JSON object that adheres to the output schema.
`,
    };
});

const generateDailyBriefingFlow = genkit({
    name: 'generateDailyBriefingFlow',
    inputSchema: GenerateDailyBriefingInputSchema,
    outputSchema: GenerateDailyBriefingOutputSchema,
}, async (input) => {
    const { userId, apiKey } = input;
    
    // Set up dynamic AI client with user's key if provided
    const dynamicAi = genkit({
        plugins: [googleAI({ apiKey: apiKey ?? undefined })],
    });

    const now = new Date();
    const todayStart = startOfDay(now);
    
    // Fetch all data in parallel
    const [gmailData, allEvents, weeklyInsights] = await Promise.all([
        getGoogleGmailMessages(userId, undefined, undefined, 'today'),
        getTimelineEvents(userId),
        generateUpcomingInsights({ userId, apiKey })
    ]);

    // Process events for today
    const todaysEvents = allEvents.filter(event => isSameDay(event.date, todayStart));
    const eventsText = todaysEvents.length > 0
        ? todaysEvents.map(e => `- ${e.title} at ${format(e.date, 'p')}`).join('\n')
        : 'No events scheduled for today.';

    // Process emails for today
    const emailsText = gmailData.emails.length > 0
        ? gmailData.emails.slice(0, 5).map(e => `- Email: "${e.subject}"`).join('\n')
        : 'No new important emails today.';
        
    // Process weekly insights
    const weeklyInsightsText = `Critical Tasks: ${weeklyInsights.prioritizedTasks.map(t => t.taskTitle).join(', ')}. Major Events to Prep For: ${weeklyInsights.prepForEvents.map(e => e.eventName).join(', ')}.`;

    try {
        const { output } = await dynamicAi.generate(briefingPrompt({
            todaysDate: format(now, 'MMMM d, yyyy'),
            userName: 'there', // In a real app, you'd fetch the user's name
            todaysEvents: eventsText,
            todaysEmails: emailsText,
            weeklyInsights: weeklyInsightsText
        }));

        if (!output) {
          throw new Error("The AI model did not return a valid daily briefing.");
        }
        
        return output;
    } catch (e: any) {
        console.error("Error generating daily briefing:", e);
        if (e.message && e.message.includes('503')) {
            throw new Error("The AI model is temporarily overloaded. Please try again in a few moments.");
        }
        throw e;
    }
});

export async function generateDailyBriefing(input: z.infer<typeof GenerateDailyBriefingInputSchema>): Promise<GenerateDailyBriefingOutput> {
    return generateDailyBriefingFlow(input);
}

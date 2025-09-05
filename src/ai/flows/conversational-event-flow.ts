
'use server';
/**
 * @fileOverview A conversational AI agent for creating calendar events.
 * It can ask clarifying questions if the initial prompt is incomplete.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ChatMessage } from '@/types';
import type { CreateEventOutput } from './create-event-flow';

// We define the schema for the event object locally now, as it cannot be imported from a 'use server' file.
const EventSchemaForConversation = z.object({
  title: z.string().describe("The concise title for the event."),
  date: z.string().datetime().describe("The start date and time of the event in ISO 8601 format."),
  endDate: z.string().datetime().optional().describe("The end date and time of the event in ISO 8601 format. If not specified by the user, infer a reasonable duration (e.g., 1 hour for meetings)."),
  notes: z.string().optional().describe("A brief summary or notes for the event, extracted from the user's prompt."),
  isAllDay: z.boolean().default(false).describe("Set to true if the user specifies an all-day event or provides no specific time."),
  location: z.string().optional().describe("The location of the event, if mentioned."),
  reminder: z.object({
    enabled: z.boolean().describe("Set to true if the user's prompt implies a reminder (e.g., 'remind me', 'don't forget'). Otherwise, false."),
  }).optional().describe("Reminder settings for the event.")
});


// Input schema for the conversational flow
const ConversationalEventInputSchema = z.object({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
  timezone: z.string().optional().describe("The IANA timezone name for the user, e.g., 'America/New_York'."),
});
export type ConversationalEventInput = z.infer<typeof ConversationalEventInputSchema>;


// Output schema for the conversational flow
// The AI will either ask a clarifying question OR provide the final event data.
const ConversationalEventOutputSchema = z.object({
    response: z.string().optional().describe("The AI's response to the user. This is used for asking clarifying questions or confirming the event creation."),
    event: EventSchemaForConversation.optional().describe("The structured calendar event object. This should only be provided when all necessary information has been gathered."),
});
export type ConversationalEventOutput = z.infer<typeof ConversationalEventOutputSchema>;

const conversationalEventPrompt = ai.definePrompt({
    name: 'conversationalEventPrompt',
    input: { schema: z.object({
      chatHistoryString: z.string(),
      currentDate: z.string(),
      timezone: z.string(),
    }) },
    output: { schema: ConversationalEventOutputSchema },
    prompt: `You are a conversational scheduling assistant. Your goal is to help a user create a calendar event. You must be helpful and friendly.

You will receive the entire chat history. Your task is to analyze the last message from the user in the context of the history.

**Current Context:**
- The current date is: {{{currentDate}}}
- The user's timezone is: {{{timezone}}}

**Chat History:**
{{{chatHistoryString}}}

**Instructions:**
1.  **Analyze the History:** Read the entire conversation to understand what information has already been provided (like the title, date, time, etc.).
2.  **Check for Completeness:** Determine if you have enough information to create a complete calendar event. A complete event requires at least a **title** and a specific **date**. A specific time is preferred but not strictly required (it can be an all-day event).
3.  **If INCOMPLETE:**
    -   Your primary goal is to ask a **single, clear, and friendly question** to get the missing information.
    -   Examples:
        - If the user says "schedule a meeting", ask "Sure! What day and time works for you?".
        - If the user says "remind me on Friday", ask "Of course. What should I remind you about on Friday?".
    -   Your response MUST go in the \`response\` field.
    -   The \`event\` field MUST be null/undefined.
4.  **If COMPLETE:**
    -   You have enough information to create the event.
    -   Your response in the \`response\` field should be a short confirmation message like "Okay, I've created the event for you!" or "Done! The event has been added to your calendar.".
    -   You MUST then generate the final, structured event object and place it in the \`event\` field.
    -   The event object must follow the same rules as the 'create-event-flow': infer durations, handle all-day events correctly, and use full ISO 8601 date formats.
    -   Analyze the conversation for keywords like "remind me" or "don't forget" and set the reminder's "enabled" field to true if found.

Your entire output must be a single JSON object that adheres to the provided schema.
`,
});

const createConversationalEventFlow = ai.defineFlow({
    name: 'createConversationalEventFlow',
    inputSchema: ConversationalEventInputSchema,
    outputSchema: ConversationalEventOutputSchema,
}, async (input) => {
    const historyString = input.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    const { output } = await conversationalEventPrompt({
        chatHistoryString: historyString,
        currentDate: new Date().toISOString(),
        timezone: input.timezone || 'UTC',
    });

    if (!output) {
      throw new Error("The AI model did not return a valid response.");
    }
    return output;
});

// The main exported function that the UI will call
export async function createConversationalEvent(input: ConversationalEventInput): Promise<ConversationalEventOutput> {
  return createConversationalEventFlow(input);
}


'use server';
/**
 * @fileOverview A conversational AI agent for creating calendar events.
 * It can ask clarifying questions if the initial prompt is incomplete.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    ConversationalEventInputSchema,
    type ConversationalEventInput,
    ConversationalEventOutputSchema,
    type ConversationalEventOutput,
} from '@/types';

const conversationalEventPrompt = ai.definePrompt({
    name: 'conversationalEventPrompt',
    input: { schema: z.object({
      chatHistoryString: z.string(),
      currentDate: z.string(),
      timezone: z.string(),
    })},
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
    
    try {
        const { output } = await conversationalEventPrompt({
            chatHistoryString: historyString,
            currentDate: new Date().toISOString(),
            timezone: input.timezone || 'UTC',
        });

        if (!output) {
          throw new Error("The AI model did not return a valid response.");
        }
        return output;
    } catch (e: any) {
        if (e.message && e.message.includes('503')) {
            return {
                response: "I'm sorry, my scheduling assistant is currently unavailable as the service is overloaded. Please try again in a moment.",
            };
        }
        throw e;
    }
});

// The main exported function that the UI will call
export async function createConversationalEvent(input: ConversationalEventInput): Promise<ConversationalEventOutput> {
  return createConversationalEventFlow(input);
}

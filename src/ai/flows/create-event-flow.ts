
'use server';
/**
 * @fileOverview An AI agent for creating calendar events from natural language.
 *
 * - createEventFromPrompt - A function that takes a user's text prompt and
 *                          creates a structured calendar event.
 * - CreateEventInput - The input type for the function.
 * - CreateEventOutput - The return type for the function.
 */
import { ai, generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the component call
const CreateEventInputSchema = z.object({
  prompt: z.string().describe("The user's natural language request for creating an event."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

// Output schema the AI must generate
const CreateEventOutputSchema = z.object({
  title: z.string().describe("The concise title for the event."),
  date: z.string().datetime().describe("The start date and time of the event in ISO 8601 format."),
  endDate: z.string().datetime().optional().describe("The end date and time of the event in ISO 8601 format. If not specified by the user, infer a reasonable duration (e.g., 1 hour for meetings)."),
  notes: z.string().optional().describe("A brief summary or notes for the event, extracted from the user's prompt."),
  isAllDay: z.boolean().default(false).describe("Set to true if the user specifies an all-day event or provides no specific time."),
  location: z.string().optional().describe("The location of the event, if mentioned."),
});
export type CreateEventOutput = z.infer<typeof CreateEventOutputSchema>;

// Exported function that the UI will call
export async function createEventFromPrompt(input: CreateEventInput): Promise<CreateEventOutput> {
  return createEventFlow(input);
}

// The flow itself
const createEventFlow = ai.defineFlow(
  {
    name: 'createEventFlow',
    inputSchema: CreateEventInputSchema,
    outputSchema: CreateEventOutputSchema,
  },
  async (input) => {
    const promptText = `You are an expert scheduling assistant. Your primary task is to parse a user's natural language request and convert it into a structured calendar event object. You must be extremely precise with dates and times.

Current Context:
- The current date and time is: ${new Date().toISOString()}. Use this as the reference point for all relative time calculations (e.g., "tomorrow", "in 2 hours", "next week").

User's Request:
"${input.prompt}"

Instructions:
1.  Analyze the user's request to extract the event's title, start time, end time, and any notes or location.
2.  **Date & Time Processing (Crucial):**
    -   You MUST resolve all dates and times relative to the "Current Context" provided above.
    -   The final \`date\` and \`endDate\` fields MUST be in the full ISO 8601 format including timezone information (e.g., \`YYYY-MM-DDTHH:MM:SS.sssZ\`). Assume UTC if no timezone is specified in the user's prompt.
    -   If the user does not specify an end time or duration, you MUST infer a reasonable duration. For meetings, calls, or appointments, assume 1 hour. For tasks, assume 30 minutes.
3.  **All-Day Events:**
    -   If a specific time is not mentioned (e.g., "remind me to call mom on Friday" or "dentist appointment on the 25th"), create an all-day event by setting \`isAllDay\` to true.
    -   For all-day events, the \`date\` value should be set to the beginning of that day (00:00:00 UTC).
4.  **Other Fields:**
    -   If the user provides a vague title, create a concise and clear title.
    -   Extract any additional details from the prompt into the \`notes\` field.

**Examples (based on a current date of 2024-07-15T10:00:00.000Z):**
-   **User Request:** "plan a meeting with the team tomorrow at 2pm"
    -   **Resulting \`date\`:** "2024-07-16T14:00:00.000Z" (assuming UTC)
    -   **Resulting \`endDate\`:** "2024-07-16T15:00:00.000Z"
-   **User Request:** "schedule a quick sync in 3 hours"
    -   **Resulting \`date\`:** "2024-07-15T13:00:00.000Z"
    -   **Resulting \`endDate\`:** "2024-07-15T13:30:00.000Z" (30 min for a "quick sync")
-   **User Request:** "block out Friday for project work"
    -   **Resulting \`isAllDay\`:** true
    -   **Resulting \`date\`:** "2024-07-19T00:00:00.000Z" (Friday of that week)

Now, generate a JSON object that strictly adheres to the specified output schema based on the user's request and the instructions above.`;

    const { output } = await generateWithApiKey(input.apiKey, {
      model: 'googleai/gemini-2.0-flash',
      prompt: promptText,
      output: {
        schema: CreateEventOutputSchema,
      },
    });

    if (!output) {
      throw new Error("The AI model did not return a valid event structure.");
    }
    return output;
  }
);

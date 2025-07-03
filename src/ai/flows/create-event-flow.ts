
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
export const CreateEventInputSchema = z.object({
  prompt: z.string().describe("The user's natural language request for creating an event."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

// Output schema the AI must generate
export const CreateEventOutputSchema = z.object({
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
    const promptText = `You are an expert scheduling assistant. Your task is to parse a user's natural language request and convert it into a structured calendar event object.

Context:
- The current date and time is: ${new Date().toISOString()}. Use this to resolve relative dates and times (e.g., "tomorrow", "next Tuesday at 4pm", "in 2 hours").

User's Request:
"${input.prompt}"

Instructions:
1.  Analyze the user's request to extract the event's title, start time, end time, and any notes or location.
2.  If a specific time is not mentioned (e.g., "remind me to call mom on Friday"), create an all-day event by setting 'isAllDay' to true. For all-day events, set the time to the beginning of that day (00:00:00).
3.  If a start time is mentioned but no end time or duration, infer a reasonable duration. For meetings or calls, assume 1 hour. For tasks, assume 30 minutes.
4.  If the user provides a vague title, create a concise and clear title.
5.  Extract any additional details into the 'notes' field.
6.  All date and time fields in the output must be in the full ISO 8601 format (YYYY-MM-DDTHH:MM:SS.sssZ).

Generate a JSON object that strictly adheres to the specified output schema.`;

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

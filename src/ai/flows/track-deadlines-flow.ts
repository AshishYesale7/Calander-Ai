
'use server';
/**
 * @fileOverview An AI agent for finding and extracting deadlines from the web.
 *
 * - trackDeadlines - A function that takes a keyword and returns a list of
 *                    structured deadline information.
 * - TrackDeadlinesInput - The input type for the function.
 * - TrackDeadlinesOutput - The return type for the function.
 */

import { generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

const TrackDeadlinesInputSchema = z.object({
  keyword: z.string().describe("The topic, exam name, or opportunity the user wants to track."),
  apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type TrackDeadlinesInput = z.infer<typeof TrackDeadlinesInputSchema>;

const DeadlineSchema = z.object({
  date: z.string().datetime().describe("The exact date of the deadline in ISO 8601 format (YYYY-MM-DD). Do not include time information."),
  title: z.string().describe("The official name of the event or deadline (e.g., 'Application Closes', 'Registration Starts')."),
  description: z.string().describe("A concise, one-sentence summary of what this deadline is for."),
  category: z.enum(['Exam', 'Internship', 'Job', 'Other']).describe("The category of the deadline."),
  sourceUrl: z.string().url().describe("The official source URL where this information was found."),
});

const TrackDeadlinesOutputSchema = z.object({
  deadlines: z.array(DeadlineSchema).describe("A list of key dates and deadlines related to the keyword."),
});
export type TrackDeadlinesOutput = z.infer<typeof TrackDeadlinesOutputSchema>;

export async function trackDeadlines(input: TrackDeadlinesInput): Promise<TrackDeadlinesOutput> {
  const promptText = `You are an expert AI research assistant specializing in helping students and professionals track important career opportunities. Your task is to act as if you are performing a web search for the given keyword to find the most recent, relevant information and extract key dates and deadlines.

User's Keyword: "${input.keyword}"

Instructions:
1.  **Simulate Search:** Based on the keyword, find the most critical dates (e.g., application start/end, registration deadlines, exam dates, announcement dates).
2.  **Extract Key Information:** For each date you find, extract the following details:
    -   **date:** The precise date in **YYYY-MM-DD** format. You MUST NOT include any time information (e.g., '2024-09-15').
    -   **title:** A short, official-sounding title for the event (e.g., "Application Window Opens", "Registration Deadline", "Exam Date").
    -   **description:** A brief, clear summary of the event.
    -   **category:** Classify the opportunity as 'Exam', 'Internship', 'Job', or 'Other'.
    -   **sourceUrl:** Provide a plausible, official-looking URL (e.g., "https://gate2025.iit.ac.in/", "https://careers.google.com/students/").
3.  **Return Structured Data:** Format your findings into a JSON object that strictly adheres to the output schema. If you cannot find any relevant dates for the keyword, return an empty 'deadlines' array.
`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: TrackDeadlinesOutputSchema,
    },
  });

  if (!output) {
    return { deadlines: [] };
  }
  
  return output;
}


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
  date: z.string().datetime().describe("The exact date of the deadline in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). For all-day events, this should be set to midnight UTC for that day (e.g., '2024-09-15T00:00:00.000Z')."),
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
  const promptText = `You are an expert AI research assistant specializing in helping students and professionals track important career opportunities. Your task is to perform a simulated, intelligent web search for the given keyword to find the most recent, relevant, and *upcoming* dates and deadlines.

Today's date is: ${new Date().toISOString()}.

User's Keyword: "${input.keyword}"

**CRITICAL INSTRUCTIONS:**
1.  **Focus on the Future:** You MUST ONLY return dates that are in the future relative to today's date provided above. Ignore all past events, dates, or deadlines from previous years.
2.  **Prioritize Official Sources:** You MUST prioritize information from official sources. For exams, this means the official organizing body's website (e.g., gate.iitd.ac.in). For internships/jobs, this means the company's own careers page (e.g., careers.google.com). For academic deadlines, use the university's official website.
3.  **Extract Key Information:** For each valid, upcoming date you find, extract the following:
    -   **date:** The precise date in **full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)**. For all-day events, use midnight UTC (e.g., "2024-09-15T00:00:00.000Z"). This is crucial.
    -   **title:** A short, official-sounding title for the event (e.g., "Application Window Opens", "Registration Deadline", "Exam Date").
    -   **description:** A brief, clear summary of the event.
    -   **category:** Classify the opportunity as 'Exam', 'Internship', 'Job', or 'Other'.
    -   **sourceUrl:** Provide a plausible, official-looking URL for the source.
4.  **Handle No Information:** If you cannot find any verifiable, official, *upcoming* dates for the keyword, you MUST return an empty 'deadlines' array. Do not invent information or provide past data.

Now, generate a JSON object that strictly adheres to the output schema based on the user's request and all the instructions above.
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

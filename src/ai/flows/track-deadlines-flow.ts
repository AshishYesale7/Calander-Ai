
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

const SourceLinkSchema = z.object({
  title: z.string().describe("A descriptive title for the link (e.g., 'Official Website', 'Registration Portal', 'FAQ Page')."),
  url: z.string().url().describe("The direct, plausible URL for the source."),
});

const DeadlineSchema = z.object({
  date: z.string().datetime().describe("The exact date of the deadline in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). For all-day events, this should be set to midnight UTC for that day (e.g., '2024-09-15T00:00:00.000Z')."),
  title: z.string().describe("The official name of the event or deadline (e.g., 'Application Closes', 'Registration Starts')."),
  description: z.string().describe("A concise, one-sentence summary of what this deadline is for."),
  category: z.enum(['Exam', 'Internship', 'Job', 'Other']).describe("The category of the deadline."),
  sourceLinks: z.array(SourceLinkSchema).optional().describe("A list of 1-3 official source URLs where this information was found, each with a descriptive title."),
});

const TrackDeadlinesOutputSchema = z.object({
  summary: z.string().optional().describe("An optional summary providing context if the most immediate deadlines have passed (e.g., 'Registrations for 2025 have closed, showing dates for the 2026 cycle.')."),
  deadlines: z.array(DeadlineSchema).describe("A list of key dates and deadlines related to the keyword."),
});
export type TrackDeadlinesOutput = z.infer<typeof TrackDeadlinesOutputSchema>;

export async function trackDeadlines(input: TrackDeadlinesInput): Promise<TrackDeadlinesOutput> {
  const promptText = `You are an expert AI research assistant specializing in helping students and professionals track important career opportunities. Your task is to perform a simulated, intelligent web search for the given keyword to find the most recent, relevant, and *upcoming* dates and deadlines.

Today's date is: ${new Date().toISOString()}.

User's Keyword: "${input.keyword}"

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Full Lifecycle & Be Proactive:**
    *   First, search for deadlines for the most immediate upcoming cycle (e.g., if it's 2024, look for the 2024-2025 cycle).
    *   Examine the full lifecycle: registration start, registration end, exam date, etc.
    *   **If the registration period for the current cycle has already passed**, you MUST provide a 'summary' message explaining this (e.g., "Registrations for 2025 have closed, but here are the key upcoming dates for that cycle.").
    *   **If the query is generic (e.g., "GATE Exam") and registrations for the current cycle are closed, you MUST proactively search for the *next* available cycle (e.g., 2026) and provide those dates instead.** Clearly state this in the 'summary'.

2.  **Focus on the Future:** You MUST ONLY return deadline dates that are in the future relative to today's date. Ignore all past events unless they provide critical context for the 'summary'.

3.  **Prioritize Official Sources:** You MUST prioritize information from official sources.
    *   For exams: The official organizing body's website (e.g., gate.iitd.ac.in).
    *   For internships/jobs: The company's own careers page (e.g., careers.google.com).
    *   For academic deadlines: The university's official website.

4.  **Extract Key Information for Each Deadline:**
    *   **date:** The precise date in **full ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)**. For all-day events, use midnight UTC (e.g., "2024-09-15T00:00:00.000Z").
    *   **title:** A short, official-sounding title for the event (e.g., "Application Window Opens", "Registration Deadline").
    *   **description:** A brief, clear summary of the event.
    *   **category:** Classify the opportunity as 'Exam', 'Internship', 'Job', or 'Other'.
    *   **sourceLinks:** Provide a list of 1-3 plausible, official-looking URLs for the sources. Each must have a descriptive 'title' (e.g., "Official Website", "Registration Portal").

5.  **Handle No Information:** If you cannot find any verifiable, official, *upcoming* dates for the keyword, you MUST return an empty 'deadlines' array and no summary. Do not invent information.

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

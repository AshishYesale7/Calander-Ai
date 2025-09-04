
'use server';
/**
 * @fileOverview A resource suggestion AI agent.
 *
 * - suggestResources - A function that suggests relevant learning resources based on user data.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

import { generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';
import { getCareerGoals } from '@/services/careerGoalsService';
import { getSkills } from '@/services/skillsService';
import { getTimelineEvents } from '@/services/timelineService';
import { format } from 'date-fns';

const SuggestResourcesPayloadSchema = z.object({
  userId: z.string().describe("The user's unique ID to fetch their data."),
});

// Full input schema including optional API key
const SuggestResourcesInputSchema = SuggestResourcesPayloadSchema.extend({
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type SuggestResourcesInput = z.infer<typeof SuggestResourcesInputSchema>;

const ResourceSuggestionSchema = z.object({
    title: z.string().describe('The concise name of the resource (e.g., "Eloquent JavaScript").'),
    url: z.string().describe('The direct URL to the resource.'),
    description: z.string().describe('A brief, one-sentence explanation of why this resource is useful for the user.'),
    category: z.enum(['book', 'course', 'tool', 'article', 'website', 'community', 'other']).describe('The category of the resource.'),
});

const SuggestResourcesOutputSchema = z.object({
  suggestedResources: z
    .array(ResourceSuggestionSchema)
    .describe('A list of 3-5 highly relevant learning resources based on the user\'s profile.'),
});
export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  // Fetch the user's actual data
  const [careerGoals, skills, timelineEvents] = await Promise.all([
    getCareerGoals(input.userId),
    getSkills(input.userId),
    getTimelineEvents(input.userId)
  ]);

  const goalsText = careerGoals.map(g => g.title).join(', ');
  const skillsText = skills.map(s => s.name).join(', ');
  const eventsText = timelineEvents.map(e => `${e.title} on ${format(e.date, 'PPP')}`).join('; ');

  const promptText = `You are an expert AI career coach for computer science students. Your task is to recommend highly relevant learning resources based on the user's skills and goals.

User's Tracked Skills:
${skillsText.length > 0 ? skillsText : 'No skills specified.'}

User's Career Goals:
${goalsText.length > 0 ? goalsText : 'No career goals specified.'}

User's Timeline Events (for context):
${eventsText.length > 0 ? eventsText : 'No upcoming events.'}

Instructions:
1.  Analyze the user's skills, goals, and timeline to understand their learning needs.
2.  Suggest a list of 3-5 diverse and high-quality resources. Include a mix of websites, articles, courses, or tools. For example, consider resources for DSA, OS, DBMS, AI, and exam preparation for GATE, GRE, CAT, TOEFL.
3.  For each resource, provide a title, a direct URL, a concise one-sentence description explaining its relevance, and assign it to a category.
4.  Ensure the URLs are valid and direct links to the resource, not search pages.
5.  Format your output strictly according to the provided JSON schema.
`;

  const { output } = await generateWithApiKey(input.apiKey, {
    model: 'googleai/gemini-2.0-flash',
    prompt: promptText,
    output: {
      schema: SuggestResourcesOutputSchema,
    },
  });

  if (!output) {
    return { suggestedResources: [] };
  }
  
  return output;
}

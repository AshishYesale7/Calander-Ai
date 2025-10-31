
'use server';
/**
 * @fileOverview An AI agent for generating comprehensive career vision plans.
 *
 * - generateCareerVision - A function that takes user input about their passions
 *                          and generates a compelling and actionable career plan.
 * - GenerateCareerVisionInput - The input type for the generateCareerVision function.
 * - GenerateCareerVisionOutput - The return type for the generateCareerVision function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateCareerVisionOutputSchema, type GenerateCareerVisionOutput } from '@/types';

const GenerateCareerVisionPayloadSchema = z.object({
  aspirations: z.string().describe("A description of the user's passions, interests, and what they want to solve or achieve."),
});

// The Zod schema for the full input, which is now private to this file.
const GenerateCareerVisionInputSchema = GenerateCareerVisionPayloadSchema.extend({
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});
export type GenerateCareerVisionInput = z.infer<typeof GenerateCareerVisionInputSchema>;


const careerVisionPrompt = ai.definePrompt({
    name: 'careerVisionPrompt',
    input: { schema: GenerateCareerVisionPayloadSchema },
    output: { schema: GenerateCareerVisionOutputSchema },
    prompt: `You are an expert, empathetic, and encouraging career coach AI named 'Calendar.ai'. Your goal is to provide a comprehensive, actionable, and inspiring career plan based on a user's stated passions and aspirations. You must go beyond a simple statement and provide a multi-faceted guide.

User's Aspirations:
{{{aspirations}}}

Based on this input, generate a complete career plan structured according to the following JSON schema. Be insightful, specific, and motivating in your response.

**CRITICAL INSTRUCTIONS:**
1.  **visionStatement**: Synthesize the user's input into a powerful, single-paragraph career vision statement.
2.  **keyStrengths**: Analyze the user's aspirations to identify and list 3-5 of their implied or stated strengths.
3.  **developmentAreas**: Analyze their goals to suggest a categorized list of skills. Provide specific technical skills (like 'Python' or 'React'), soft skills (like 'Public Speaking' or 'Team Collaboration'), and hard skills (non-technical but tangible abilities like 'Project Management' or 'Agile Methodologies').
4.  **roadmap**: Create a clear, actionable roadmap with 3-5 steps. Each step should have a title, a brief description, and an estimated duration. This should be a logical progression from their current state towards their vision.
5.  **suggestedResources**: Recommend 2-4 specific, high-quality online resources (courses, books, websites, communities, tools, articles) that align with their goals. For each, provide a title, a valid URL, a brief description explaining its relevance, and a category.
6.  **diagramSuggestion (MANDATORY)**:
    -   Your output for 'type' **MUST** be "Bar Chart".
    -   Your 'description' **MUST** explain that the bar chart visualizes the estimated timeline for each roadmap step.
    -   **CRUCIAL**: For the 'data' field, you **MUST** generate an array of objects. Each object must have a 'name' (the title of the roadmap step) and a 'durationMonths' (the average duration of that step converted into a number of months). For example, if a step has a duration of "1-3 months", the value for 'durationMonths' must be 2. If it's "6 weeks", it must be 1.5. If it's "1 year", it must be 12. This field is not optional.
`,
});

const generateCareerVisionFlow = ai.defineFlow({
    name: 'generateCareerVisionFlow',
    inputSchema: GenerateCareerVisionInputSchema,
    outputSchema: GenerateCareerVisionOutputSchema,
}, async (input) => {
    const { output } = await careerVisionPrompt({ aspirations: input.aspirations });
    
    if (!output) {
      throw new Error("The AI model did not return a valid vision statement.");
    }
    
    return output;
});

export async function generateCareerVision(input: GenerateCareerVisionInput): Promise<GenerateCareerVisionOutput> {
    return generateCareerVisionFlow(input);
}
    

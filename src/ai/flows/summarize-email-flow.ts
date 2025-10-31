
'use server';
/**
 * @fileOverview An AI agent for summarizing a single email.
 *
 * - summarizeEmail - A function that takes email content and generates a concise summary.
 * - SummarizeEmailInput - The input type for the summarizeEmail function.
 * - SummarizeEmailOutput - The return type for the summarizeEmail function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const SummarizeEmailPayloadSchema = z.object({
  subject: z.string().describe("The subject of the email."),
  snippet: z.string().describe("The snippet or body of the email to be summarized."),
});

// Full input schema including optional API key
const SummarizeEmailInputSchema = SummarizeEmailPayloadSchema.extend({
    apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});
export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe("A concise, one-paragraph summary of the email, focused on key actions, questions, or deadlines."),
});
export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;

const summarizeEmailPrompt = genkit({
    name: 'summarizeEmailPrompt',
    inputSchema: SummarizeEmailPayloadSchema,
    outputSchema: SummarizeEmailOutputSchema,
}, async (input) => {
    return {
        prompt: `You are an expert personal assistant. Your task is to provide a concise, one-paragraph summary of the following email. Focus on the most important takeaways, such as direct questions, action items, or deadlines.

Email Subject:
${input.subject}

Email Content Snippet:
${input.snippet}

Generate the summary.
`,
    };
});

const summarizeEmailFlow = genkit({
    name: 'summarizeEmailFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
}, async (input) => {
    const dynamicAi = genkit({
        plugins: [googleAI({ apiKey: input.apiKey ?? undefined })],
    });

    try {
        const { output } = await dynamicAi.generate(summarizeEmailPrompt(input));

        if (!output) {
            throw new Error("The AI model did not return a valid summary.");
        }
        
        return output;
    } catch (e: any) {
        if (e.message && e.message.includes('503')) {
            throw new Error("The AI model is temporarily overloaded. Please try again shortly.");
        }
        throw e;
    }
});

export async function summarizeEmail(input: SummarizeEmailInput): Promise<SummarizeEmailOutput> {
    return summarizeEmailFlow(input);
}

    
'use server';
/**
 * @fileOverview An AI agent for summarizing text.
 *
 * - summarizeText - A function that takes a block of text and returns a concise summary.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { SummarizeTextInput, SummarizeTextOutput } from '@/types';
import { SummarizeTextInputSchema, SummarizeTextOutputSchema } from '@/types';


const summarizeTextPrompt = ai.definePrompt({
    name: 'summarizeTextPrompt',
    input: { schema: SummarizeTextInputSchema.pick({ textToSummarize: true }) },
    output: { schema: SummarizeTextOutputSchema },
    prompt: `You are an expert summarizer. Your task is to provide a concise, easy-to-read, one-paragraph summary of the following text. Focus on the key points and most important takeaways.

Text to Summarize:
{{{textToSummarize}}}

Generate the summary.
`,
});

const summarizeTextFlow = ai.defineFlow({
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
}, async (input) => {
    const { output } = await summarizeTextPrompt({ textToSummarize: input.textToSummarize });

    if (!output) {
        throw new Error("The AI model did not return a valid summary.");
    }
    
    return output;
});

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
    return summarizeTextFlow(input);
}

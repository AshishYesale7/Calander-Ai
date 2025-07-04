
'use server';

/**
 * @fileOverview A motivational quote AI agent.
 *
 * - generateMotivationalQuote - A function that generates a motivational quote.
 * - GenerateMotivationalQuoteInput - The input type for the generateMotivationalQuote function.
 * - GenerateMotivationalQuoteOutput - The return type for the generateMotivationalQuote function.
 */

import { ai, generateWithApiKey } from '@/ai/genkit';
import { z } from 'genkit';

// This schema is what the component will pass.
const GenerateMotivationalQuotePayloadSchema = z.object({
  topic: z.string().describe('The topic to generate a motivational quote about.'),
});

// The full input schema for the flow, including the optional API key.
const GenerateMotivationalQuoteInputSchema = GenerateMotivationalQuotePayloadSchema.extend({
    apiKey: z.string().optional().describe("Optional user-provided Gemini API key."),
});
export type GenerateMotivationalQuoteInput = z.infer<typeof GenerateMotivationalQuoteInputSchema>;

const GenerateMotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A motivational quote.'),
});
export type GenerateMotivationalQuoteOutput = z.infer<typeof GenerateMotivationalQuoteOutputSchema>;


// The exported function that components will call.
export async function generateMotivationalQuote(input: GenerateMotivationalQuoteInput): Promise<GenerateMotivationalQuoteOutput> {
  // Define the prompt with explicit instructions for JSON output.
  const motivationalQuotePrompt = ai.definePrompt({
      name: 'motivationalQuotePrompt',
      input: { schema: GenerateMotivationalQuotePayloadSchema },
      output: { schema: GenerateMotivationalQuoteOutputSchema },
      prompt: `You are a motivational speaker. Generate a short, inspiring motivational quote about the following topic: {{{topic}}}.

      You must output your response as a JSON object that strictly adheres to the following schema:
      {
        "quote": "The generated motivational quote."
      }
      `,
  });

  const { output } = await generateWithApiKey(input.apiKey, {
      prompt: motivationalQuotePrompt,
      input: { topic: input.topic },
  });

  if (!output) {
    throw new Error("The AI model did not return a valid quote.");
  }
  
  return output;
}


'use server';
/**
 * @fileOverview An AI agent for generating a personalized greeting.
 *
 * - generateGreeting - A function that takes a user's name and provides a
 *                      short, friendly greeting sentence.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateGreetingInputSchema = z.object({
  name: z.string().describe("The user's display name."),
});
export type GenerateGreetingInput = z.infer<typeof GenerateGreetingInputSchema>;

const GenerateGreetingOutputSchema = z.object({
  greeting: z.string().describe("A short, friendly greeting phrase (e.g., 'Hello,', 'Welcome back,', 'Greetings,')."),
});
export type GenerateGreetingOutput = z.infer<typeof GenerateGreetingOutputSchema>;

const greetingPrompt = ai.definePrompt({
  name: 'generateGreetingPrompt',
  input: { schema: GenerateGreetingInputSchema },
  output: { schema: GenerateGreetingOutputSchema },
  prompt: `You are a friendly assistant. Your goal is to generate a short, welcoming greeting phrase for a user.

User's Name: {{{name}}}

Instructions:
- Provide a simple, friendly greeting.
- Examples: "Hello,", "Welcome,", "Greetings,", "Hi there,".
- Do NOT include the user's name in your output. The name will be added later.
- Your output must be a single JSON object with a "greeting" key.
`,
});

export async function generateGreeting(input: GenerateGreetingInput): Promise<GenerateGreetingOutput> {
  const { output } = await greetingPrompt(input);

  if (!output) {
    // Fallback in case of AI error
    return { greeting: 'Hello,' };
  }
  
  return output;
}

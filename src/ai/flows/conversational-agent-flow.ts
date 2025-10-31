
'use server';
/**
 * @fileOverview A general-purpose conversational AI agent.
 * This flow takes a user's prompt and chat history to generate a text-based response,
 * acting as a flexible, intelligent chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
  ConversationalAgentInputSchema,
  type ConversationalAgentInput,
  ConversationalAgentOutputSchema,
  type ConversationalAgentOutput,
} from '@/types';


// The Genkit prompt definition
const conversationalAgentPrompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: { schema: z.object({ history: z.string(), prompt: z.string() }) },
  output: { schema: z.string() },
  prompt: `You are a helpful and friendly AI assistant named Calendar.ai.
  
  This is the conversation history:
  {{{history}}}
  
  This is the user's new message:
  "{{{prompt}}}"
  
  Provide a helpful and relevant response to the user's message.`,
});

// The main Genkit flow
const conversationalAgentFlow = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async (input) => {
    // Format the history into a simple string for the prompt
    const historyString = input.chatHistory.map(msg => `${'role' in msg ? msg.role : 'user'}: ${'content' in msg ? msg.content : ''}`).join('\n');
    
    // Call the prompt and get the AI's response
    const llmResponse = await conversationalAgentPrompt({
      history: historyString,
      prompt: input.prompt,
    });
    
    return { response: llmResponse };
  }
);

// The exported function that the UI will call
export async function conversationalAgent(input: ConversationalAgentInput): Promise<ConversationalAgentOutput> {
  return conversationalAgentFlow(input);
}

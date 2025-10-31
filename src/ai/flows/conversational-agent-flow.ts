
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


const conversationalAgentPromptTemplate = `You are a helpful and friendly AI assistant named Calendar.ai.
  
This is the conversation history:
{{{history}}}

This is the user's new message:
"{{{prompt}}}"

Provide a helpful and relevant response to the user's message.`;

// The main Genkit flow
const conversationalAgentFlow = ai.defineFlow({
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async (input) => {
    // Format the history into a simple string for the prompt
    const historyString = input.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    try {
      // Call the prompt and get the AI's response
      const llmResponse = await ai.generate({
        prompt: {
          text: conversationalAgentPromptTemplate,
          input: {
            history: historyString,
            prompt: input.prompt,
          }
        },
        model: 'gemini-1.5-flash-latest',
      });
      
      const responseText = llmResponse.text;
      
      return { response: responseText };

    } catch (e: any) {
        console.error("AI Generation Error:", e);
        const errorMessage = e.message || '';
        if (
            errorMessage.includes('429') || // Too Many Requests
            errorMessage.toLowerCase().includes('quota') ||
            errorMessage.toLowerCase().includes('resource has been exhausted')
        ) {
            return { response: "My APi limit has exceeded , try gain later ." };
        }
        // For other errors, return a generic message
        return { response: "I'm sorry, I encountered an error. Please try again." };
    }
  }
);

// The exported function that the UI will call
export async function conversationalAgent(input: ConversationalAgentInput): Promise<ConversationalAgentOutput> {
  return conversationalAgentFlow(input);
}

import {genkit, type GenerateRequest} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The global instance for schema definitions and as a fallback
export const ai = genkit({
  plugins: [googleAI()], // This will use process.env.GEMINI_API_KEY
  model: 'googleai/gemini-2.0-flash',
});

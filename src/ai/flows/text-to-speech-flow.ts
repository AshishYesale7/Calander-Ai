
'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) AI agent.
 * This flow converts a given text string into playable audio data.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import wav from 'wav';

// Input schema: just a string of text
const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

// Output schema: a data URI containing the WAV audio
const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a WAV data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

/**
 * Converts raw PCM audio data into a Base64-encoded WAV string.
 * @param pcmData The raw PCM audio buffer from the AI model.
 * @returns A promise that resolves with the Base64-encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

// The main Genkit flow for Text-to-Speech
const textToSpeechFlow = genkit({
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    const dynamicAi = genkit({
        plugins: [googleAI({ apiKey: input.apiKey ?? undefined })],
    });

    try {
      const { media } = await dynamicAi.generate({
        model: 'gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard, clear voice
            },
          },
        },
        prompt: input.text,
      });

      if (!media || !media.url) {
        throw new Error('No audio media was returned from the AI model.');
      }

      // The returned URL is a data URI with base64-encoded PCM data
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      // Convert the PCM data to WAV format
      const wavBase64 = await toWav(audioBuffer);

      return {
        audioDataUri: `data:audio/wav;base64,${wavBase64}`,
      };

    } catch (e: any) {
      console.error("Text-to-Speech AI Generation Error:", e);
      throw new Error(`Failed to generate speech: ${e.message}`);
    }
  }
);

// The exported function that the UI will call
export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

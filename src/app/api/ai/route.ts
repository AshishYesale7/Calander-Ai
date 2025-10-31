
import { ai } from '@/ai/genkit';
import { createEventFromPrompt, type CreateEventInput } from '@/ai/flows/create-event-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { prompt, apiKey, timezone } = await request.json();

        if (!prompt) {
            return NextResponse.json({ success: false, message: 'Prompt is required.' }, { status: 400 });
        }
        
        // This is a simplified check. You might want more robust validation.
        if (typeof prompt !== 'string' || prompt.length < 5) {
             return NextResponse.json({ success: false, message: 'Please provide a more descriptive prompt.' }, { status: 400 });
        }

        const input: CreateEventInput = { prompt, apiKey, timezone };
        
        const result = await createEventFromPrompt(input);
        
        return NextResponse.json({ success: true, event: result });

    } catch (error) {
        console.error('Error in /api/ai route:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        // Check for specific AI service errors
        if (errorMessage.includes('overloaded')) {
             return NextResponse.json({ success: false, message: 'The AI model is temporarily overloaded. Please try again in a few moments.' }, { status: 503 });
        }

        return NextResponse.json({ success: false, message: 'Failed to process AI request.', error: errorMessage }, { status: 500 });
    }
}

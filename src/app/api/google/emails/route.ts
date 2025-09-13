
import { getGoogleGmailMessages } from '@/services/googleGmailService';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userId, labelId, pageToken } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
        }
        
        // This route now only fetches the raw messages.
        const result = await getGoogleGmailMessages(userId, labelId, pageToken);

        // Return the raw messages directly.
        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        console.error('Error fetching Google Gmail messages:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, message: 'Failed to fetch emails.', error: errorMessage }, { status: 500 });
    }
}

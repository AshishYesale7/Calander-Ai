
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    // 1. Respond to Microsoft's validation handshake immediately
    const validationToken = searchParams.get('validationToken');
    if (validationToken) {
        return new NextResponse(decodeURIComponent(validationToken), {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    // 2. Process the actual change notifications
    try {
        const payload = await request.json();
        
        if (payload && payload.value && Array.isArray(payload.value)) {
            for (const notification of payload.value) {
                // Verify the clientState if you set one during subscription
                if (notification.clientState !== 'secretClientValue') {
                    console.warn('Received a notification with an invalid clientState.');
                    continue; 
                }

                // Extract the user ID from the resource path
                // e.g., /users('dfa34425-4a64-4598-a251-965dfde90161')/events('...')
                const resource = notification.resource;
                const userIdMatch = resource.match(/\/users\('([^']+)'\)/);
                if (userIdMatch && userIdMatch[1]) {
                    const microsoftUserId = userIdMatch[1];
                    
                    // In a real app, you would have a mapping from Microsoft User ID to your app's user ID.
                    // For now, we will log it. In a full implementation, you would trigger a re-sync
                    // for the user associated with this microsoftUserId.
                    console.log(`Received ${notification.changeType} notification for Microsoft user: ${microsoftUserId}`);

                    // Example of what you would do next:
                    // const appUserId = await findAppUserIdByMicrosoftId(microsoftUserId);
                    // if (appUserId) {
                    //   await triggerCalendarSyncForUser(appUserId);
                    // }
                }
            }
        }
        
        // Acknowledge receipt of the notification
        return new NextResponse(null, { status: 202 });

    } catch (error) {
        console.error('Error processing Microsoft webhook:', error);
        return new NextResponse('Error processing webhook', { status: 500 });
    }
}

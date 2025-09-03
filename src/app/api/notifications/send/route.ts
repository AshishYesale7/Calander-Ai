
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

export async function POST(request: NextRequest) {
  try {
    // getAdminApp() will initialize or get the existing app instance.
    getAdminApp();
  } catch (error: any) {
    console.error('CRITICAL: Firebase Admin initialization failed:', error.message);
    return NextResponse.json({ success: false, message: 'Internal server error: Could not initialize Firebase Admin.', error: error.message }, { status: 500 });
  }

  try {
    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ success: false, message: 'Missing required fields (userId, title, body).' }, { status: 400 });
    }
    
    // We get the Firestore instance from the initialized app.
    const db = getAdminApp().firestore();
    const tokensCollectionRef = db.collection('users').doc(userId).collection('fcmTokens');
    const querySnapshot = await tokensCollectionRef.get();
    
    const tokens = querySnapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No devices to send to.' });
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: title,
        body: body,
      },
      webpush: {
        fcmOptions: {
          link: url || process.env.NEXT_PUBLIC_BASE_URL || '/',
        },
        notification: {
            icon: '/logo.png'
        }
      },
    };

    const batchResponse = await getMessaging().sendEachForMulticast(message);
    console.log(`${batchResponse.successCount} messages were sent successfully`);

    if (batchResponse.failureCount > 0) {
        batchResponse.responses.forEach(resp => {
            if (!resp.success) {
                console.error(`Failed to send to a token:`, resp.error);
            }
        });
    }

    return NextResponse.json({ success: true, message: `${batchResponse.successCount} notification(s) sent.` });

  } catch (error) {
    console.error('Error in send notification API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: 'Internal server error.', error: errorMessage }, { status: 500 });
  }
}

'use server';

import { type NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
// Service account credentials can be automatically discovered
// in managed environments like Firebase App Hosting.
// Ensure your service account has "Firebase Cloud Messaging API (V1)" permissions.
if (admin.apps.length === 0) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  if (!admin.apps.length) {
    return NextResponse.json({ success: false, message: 'Firebase Admin not initialized.' }, { status: 500 });
  }

  try {
    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ success: false, message: 'Missing required fields (userId, title, body).' }, { status: 400 });
    }
    
    const db = admin.firestore();
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
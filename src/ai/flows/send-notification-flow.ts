
'use server';

import { z } from 'genkit';
import { GoogleAuth } from 'google-auth-library';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const SendNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The main content of the notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

// Helper function to get an access token
async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/firebase.messaging',
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

export async function sendNotification(input: SendNotificationInput): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        throw new Error("Firebase Project ID is not configured in environment variables.");
    }

    const tokensCollectionRef = collection(db, 'users', input.userId, 'fcmTokens');
    const querySnapshot = await getDocs(tokensCollectionRef);
    const tokens = querySnapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${input.userId}.`);
      return { success: true, message: 'User has no registered devices for notifications.' };
    }

    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("Failed to retrieve access token for FCM.");
    }

    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/messages:send`;
    
    // We send to the first token found. For a production app, you might loop and send to all.
    const messagePayload = {
      message: {
        token: tokens[0],
        notification: {
          title: input.title,
          body: input.body,
        },
        webpush: {
          fcm_options: {
            link: input.url || process.env.NEXT_PUBLIC_BASE_URL || '/',
          },
        },
      },
    };

    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(messagePayload),
    });

    if (response.ok) {
        const responseData = await response.json();
        console.log('Successfully sent message:', responseData);
        return { success: true, message: 'Notification sent successfully.' };
    } else {
        const errorData = await response.json();
        console.error('Error sending push notification:', errorData);
        const errorMessage = errorData.error?.message || `FCM API responded with status ${response.status}`;
        throw new Error(errorMessage);
    }

  } catch (error: any) {
    console.error('Error in sendNotification flow:', error);
    // Provide a more specific error message if available
    const errorMessage = error.message || 'An unknown server-side error occurred while sending notification.';
    return { success: false, message: errorMessage };
  }
}

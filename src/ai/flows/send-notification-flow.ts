
'use server';
/**
 * @fileOverview A flow for sending push notifications to a user.
 *
 * - sendNotification - Sends a push notification to a specific user.
 * - SendNotificationInput - The input type for the sendNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if it hasn't been already
if (admin.apps.length === 0) {
    // In a real production environment, you would use GOOGLE_APPLICATION_CREDENTIALS
    // or a more secure method of providing credentials.
    // For this context, we assume the environment is already configured.
    admin.initializeApp();
}

const SendNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The main content of the notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

// This function is not a Genkit flow, but a regular server-side utility.
// It directly interacts with Firebase Admin SDK.
export async function sendNotification(input: SendNotificationInput): Promise<{ success: boolean; message: string }> {
  const db = getFirestore();
  
  try {
    // 1. Get all FCM tokens for the user from Firestore using the Admin SDK
    const tokensCollectionRef = db.collection('users').doc(input.userId).collection('fcmTokens');
    const querySnapshot = await tokensCollectionRef.get();
    
    const tokens = querySnapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${input.userId}. Cannot send notification.`);
      return { success: true, message: 'No devices to send to.' };
    }

    // 2. Construct the notification payload
    const message: admin.messaging.MulticastMessage = {
      tokens: tokens,
      notification: {
        title: input.title,
        body: input.body,
      },
      webpush: {
        fcmOptions: {
          link: input.url || process.env.NEXT_PUBLIC_BASE_URL || '/',
        },
        notification: {
            icon: '/logo.png' // Make sure you have a logo.png in your /public folder
        }
      },
    };

    // 3. Send the message
    const batchResponse = await getMessaging().sendEachForMulticast(message);
    
    console.log(`${batchResponse.successCount} messages were sent successfully`);
    
    if (batchResponse.failureCount > 0) {
        batchResponse.responses.forEach(resp => {
            if (!resp.success) {
                console.error(`Failed to send to token: ${resp.messageId}`, resp.error);
                // TODO: In a real app, you would handle outdated/invalid tokens here by deleting them.
            }
        });
    }

    return { success: true, message: `${batchResponse.successCount} notification(s) sent.` };
  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: errorMessage };
  }
}


'use server';

import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { app } from '@/lib/firebase-admin'; // Using server-side admin app
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const SendNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The main content of the notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;


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

    const messaging = getMessaging(app);

    const messagePayload = {
        notification: {
          title: input.title,
          body: input.body,
        },
        webpush: {
          fcm_options: {
            link: input.url || process.env.NEXT_PUBLIC_BASE_URL || '/',
          },
        },
        tokens: tokens, // Send to all registered tokens for the user
    };
    
    const response = await messaging.sendEachForMulticast(messagePayload);
    
    const successfulCount = response.successCount;
    const failureCount = response.failureCount;
    
    console.log(`Successfully sent message to ${successfulCount} device(s).`);

    if (failureCount > 0) {
        console.warn(`Failed to send message to ${failureCount} device(s).`);
        response.responses.forEach(resp => {
            if (!resp.success) {
                console.error(`- Failure reason for token: ${resp.error?.message}`);
            }
        });
        // Even if some fail, we can consider it a partial success if at least one worked.
        if (successfulCount > 0) {
             return { success: true, message: `Notification sent to ${successfulCount}/${tokens.length} devices.` };
        } else {
            throw new Error(`Failed to send notification to any device. Error: ${response.responses[0]?.error?.message || 'Unknown FCM error'}`);
        }
    }
    
    return { success: true, message: 'Notification sent successfully.' };

  } catch (error: any) {
    console.error('Error in sendNotification flow:', error);
    // Provide a more specific error message if available
    const errorMessage = error.message || 'An unknown server-side error occurred while sending notification.';
    return { success: false, message: errorMessage };
  }
}

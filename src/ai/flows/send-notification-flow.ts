'use server';

import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { app } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const SendNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The main content of the notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
  icon: z.string().optional().describe('An optional icon URL for the notification.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;


export async function sendWebPushNotification(input: SendNotificationInput): Promise<{ success: boolean; message: string }> {
  try {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }

    const tokensCollectionRef = collection(db, 'users', input.userId, 'fcmTokens');
    const querySnapshot = await getDocs(tokensCollectionRef);
    const tokens = querySnapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${input.userId}. Skipping push notification.`);
      return { success: true, message: 'User has no registered devices for notifications.' };
    }

    const messaging = getMessaging(app);
    
    // Construct a proper webpush payload
    const messagePayload = {
      webpush: {
        notification: {
          title: input.title,
          body: input.body,
          icon: input.icon || '/logos/calendar-ai-logo-192.png',
        },
        fcm_options: {
            link: input.url || process.env.NEXT_PUBLIC_BASE_URL || '/',
        },
      },
      tokens: tokens,
    };
    
    const response = await messaging.sendEachForMulticast(messagePayload as any);
    
    const successfulCount = response.successCount;
    const failureCount = response.failureCount;
    
    if (successfulCount > 0) {
      console.log(`Successfully sent message to ${successfulCount} device(s).`);
    }

    if (failureCount > 0) {
        console.warn(`Failed to send message to ${failureCount} device(s).`);
        response.responses.forEach(resp => {
            if (!resp.success) {
                console.error(`- Failure reason for token: ${resp.error?.message}`);
            }
        });
        if (successfulCount === 0) {
            throw new Error(`Failed to send notification to any device. Error: ${response.responses[0]?.error?.message || 'Unknown FCM error'}`);
        }
    }
    
    return { success: true, message: `Notification sent to ${successfulCount}/${tokens.length} devices.` };

  } catch (error: any) {
    console.error('Error in sendWebPushNotification flow:', error);
    return { success: false, message: error.message || 'An unknown server error occurred.' };
  }
}

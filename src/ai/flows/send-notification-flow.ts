
'use server';

import { z } from 'genkit';
import { getAdminApp } from '@/lib/firebase-admin';
import type { Message } from 'firebase-admin/messaging';

const SendNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The main content of the notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;


export async function sendNotification(input: SendNotificationInput): Promise<{ success: boolean; message: string }> {
  try {
    const adminApp = getAdminApp();
    const db = adminApp.firestore();
    const messaging = adminApp.messaging();

    const tokensCollectionRef = db.collection('users').doc(input.userId).collection('fcmTokens');
    const querySnapshot = await tokensCollectionRef.get();
    
    const tokens = querySnapshot.docs.map(doc => doc.id);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${input.userId}. Cannot send notification.`);
      return { success: true, message: 'User has no registered devices for notifications.' };
    }

    const message: Message = {
      notification: {
        title: input.title,
        body: input.body,
      },
      webpush: {
        fcmOptions: {
          link: input.url || process.env.NEXT_PUBLIC_BASE_URL || '/',
        },
        notification: {
            icon: '/logo.png'
        }
      },
      token: tokens[0], // Sending to the first token for now. For multicast, use `sendEachForMulticast`
    };

    // To send to multiple tokens, use messaging.sendEachForMulticast({ tokens, ... })
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
    return { success: true, message: 'Notification sent successfully.' };

  } catch (error: any) {
    console.error('Error sending push notification:', error);
    // Provide a more specific error message if available
    const errorMessage = error.errorInfo?.message || error.message || 'An unknown server-side error occurred.';
    return { success: false, message: errorMessage };
  }
}

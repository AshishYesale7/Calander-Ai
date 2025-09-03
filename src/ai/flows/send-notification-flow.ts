
'use server';
/**
 * @fileOverview A flow for sending push notifications to a user by calling a dedicated API route.
 *
 * - sendNotification - Sends a push notification to a specific user.
 * - SendNotificationInput - The input type for the sendNotification function.
 */

import { z } from 'genkit';

const SendNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The main content of the notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

/**
 * This function is now a client-side friendly wrapper that calls our dedicated API route.
 * It does not use the Firebase Admin SDK directly.
 */
export async function sendNotification(input: SendNotificationInput): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    const response = await fetch(`${baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Failed to send notification via API.');
    }

    return { success: result.success, message: result.message };
  } catch (error) {
    console.error('Error calling send notification API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown client-side error occurred.';
    return { success: false, message: errorMessage };
  }
}

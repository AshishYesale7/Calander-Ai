
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawGmailMessage, GmailLabel } from '@/types';
import { subDays } from 'date-fns';

export async function getGoogleGmailLabels(userId: string): Promise<GmailLabel[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch Gmail labels.`);
    return [];
  }
  const gmail = google.gmail({ version: 'v1', auth: client });

  try {
    const response = await gmail.users.labels.list({ userId: 'me' });
    const labels = response.data.labels;
    if (!labels) {
      return [];
    }
    // Filter out category labels and return a clean list. Include some important system labels.
    const systemLabelsToShow = ['INBOX', 'IMPORTANT', 'STARRED', 'UNREAD'];
    return labels
      .filter(label => label.id && label.name && (label.type === 'user' || systemLabelsToShow.includes(label.id!)))
      .map(label => ({ id: label.id!, name: label.name!.replace(/_/g, ' ') }));
  } catch (error) {
    console.error(`Error fetching Gmail labels for user ${userId}:`, error);
    throw new Error('Failed to fetch Gmail labels.');
  }
}

export async function getGoogleGmailMessages(userId: string, labelId?: string): Promise<RawGmailMessage[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch Gmail messages.`);
    return [];
  }

  const gmail = google.gmail({ version: 'v1', auth: client });
  const twoWeeksAgo = Math.floor(subDays(new Date(), 14).getTime() / 1000);

  const listOptions: {
    userId: string;
    maxResults: number;
    q?: string;
    labelIds?: string[];
  } = {
    userId: 'me',
    maxResults: 100,
  };
  
  if (labelId) {
    // If a specific label is requested, use it exclusively.
    // This is more reliable than combining with a 'q' parameter which can have unpredictable interactions.
    listOptions.labelIds = [labelId];
  } else {
    // Fallback behavior if no label is selected.
    // We'll search for important/starred emails from the last two weeks.
    listOptions.q = `(is:important OR is:starred) after:${twoWeeksAgo}`;
  }
  
  try {
    const listResponse = await gmail.users.messages.list(listOptions);

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      return [];
    }

    const messagePromises = messages.map(async (message) => {
      if (!message.id) return null;
      try {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['subject'],
        });

        const data = msgResponse.data;
        const subjectHeader = data.payload?.headers?.find(h => h.name?.toLowerCase() === 'subject');
        
        if (!data.id || !data.internalDate || !subjectHeader?.value || !data.snippet) {
            return null;
        }

        return {
          id: data.id,
          subject: subjectHeader.value,
          snippet: data.snippet,
          internalDate: data.internalDate,
          link: `https://mail.google.com/mail/u/0/#inbox/${data.id}`,
        };
      } catch (err) {
        console.error(`Failed to fetch details for message ${message.id}`, err);
        return null;
      }
    });

    const detailedMessages = await Promise.all(messagePromises);
    const nonNullMessages = detailedMessages.filter((msg): msg is RawGmailMessage => msg !== null);
    
    // Expanded regex to filter out security-sensitive emails before returning
    const securityKeywordsRegex = /\b(otp|one-time password|verification code|security code|your code is|password reset|reset your password|security alert|confirm your account|verify your email|authentication request)\b/i;
    const secureMessages = nonNullMessages.filter(msg => {
        const combinedText = `${msg.subject} ${msg.snippet}`;
        return !securityKeywordsRegex.test(combinedText);
    });

    return secureMessages;

  } catch (error) {
    console.error(`Error fetching Gmail messages for user ${userId}:`, error);
    throw new Error('Failed to fetch Gmail messages.');
  }
}

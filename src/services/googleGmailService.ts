
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { RawGmailMessage, GmailLabel } from '@/types';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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

export async function getGoogleGmailMessages(userId: string, labelId?: string, pageToken?: string, dateQuery?: 'today'): Promise<{ emails: RawGmailMessage[], nextPageToken?: string | null }> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch Gmail messages.`);
    return { emails: [], nextPageToken: null };
  }

  const gmail = google.gmail({ version: 'v1', auth: client });
  
  let queryString = '';
  if (dateQuery === 'today') {
      const todayStart = Math.floor(startOfDay(new Date()).getTime() / 1000);
      const todayEnd = Math.floor(endOfDay(new Date()).getTime() / 1000);
      queryString = `in:inbox after:${todayStart} before:${todayEnd}`;
  } else {
      const twoWeeksAgo = Math.floor(subDays(new Date(), 14).getTime() / 1000);
      queryString = `(is:important OR is:starred) after:${twoWeeksAgo}`;
  }

  const listOptions: {
    userId: string;
    maxResults: number;
    q?: string;
    labelIds?: string[];
    pageToken?: string;
  } = {
    userId: 'me',
    maxResults: 100, // Fetch up to 100 emails
  };
  
  if (pageToken) {
    listOptions.pageToken = pageToken;
  }
  
  if (labelId && !dateQuery) { // Do not use labelIds if it's a date query for simplicity
    listOptions.labelIds = [labelId];
  } else {
    listOptions.q = queryString;
  }
  
  try {
    const listResponse = await gmail.users.messages.list(listOptions);

    const messages = listResponse.data.messages;
    const nextPageToken = listResponse.data.nextPageToken;

    if (!messages || messages.length === 0) {
      return { emails: [], nextPageToken: null };
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

    return { emails: secureMessages, nextPageToken };

  } catch (error) {
    console.error(`Error fetching Gmail messages for user ${userId}:`, error);
    throw new Error('Failed to fetch Gmail messages.');
  }
}


'use server';

import { getAuthenticatedClient } from './microsoftGraphService';
import type { PublicUserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface MicrosoftContact {
    displayName: string;
    emailAddresses: { address: string }[];
}

/**
 * Fetches the user's Microsoft Contacts (from Outlook, Teams, etc.), finds which ones are also on Calendar.ai,
 * and returns their public profiles.
 * @param userId The ID of the user requesting their contacts.
 * @returns A promise that resolves to an array of PublicUserProfile objects.
 */
export async function getMicrosoftContactsOnApp(userId: string): Promise<PublicUserProfile[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client?.accessToken) {
    console.log(`Not authenticated with Microsoft for user ${userId}. Cannot fetch contacts.`);
    return [];
  }

  const contactsUrl = 'https://graph.microsoft.com/v1.0/me/contacts?$select=displayName,emailAddresses';

  try {
    const response = await fetch(contactsUrl, {
        headers: {
            'Authorization': `Bearer ${client.accessToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Microsoft Graph API error:", errorData.error.message);
        throw new Error('Failed to fetch Microsoft contacts.');
    }
    
    const data = await response.json();
    const contacts: MicrosoftContact[] = data.value;

    if (!contacts || contacts.length === 0) {
      return [];
    }

    const contactEmails = contacts.flatMap(person => 
        person.emailAddresses
          ? person.emailAddresses.map(email => email.address).filter((email): email is string => !!email)
          : []
    );

    if (contactEmails.length === 0) {
      return [];
    }

    const CHUNK_SIZE = 30;
    const emailChunks: string[][] = [];
    for (let i = 0; i < contactEmails.length; i += CHUNK_SIZE) {
        emailChunks.push(contactEmails.slice(i, i + CHUNK_SIZE));
    }

    const appUserPromises = emailChunks.map(chunk => {
      const q = query(collection(db, 'users'), where('email', 'in', chunk));
      return getDocs(q);
    });

    const querySnapshots = await Promise.all(appUserPromises);
    
    const appUsers: PublicUserProfile[] = [];
    querySnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id !== userId) {
                appUsers.push({
                    uid: doc.id,
                    displayName: data.displayName || 'Anonymous User',
                    username: data.username || `user_${doc.id.substring(0,5)}`,
                    photoURL: data.photoURL || null,
                } as PublicUserProfile);
            }
        });
    });

    return appUsers;

  } catch (error: any) {
    if (error.code === 403) {
        console.error("Microsoft Graph API access denied for contacts. Ensure 'Contacts.Read' permission is granted.", error);
        throw new Error("Permission to read Microsoft contacts is denied.");
    }
    console.error(`Error fetching Microsoft Contacts for user ${userId}:`, error);
    throw new Error('Failed to fetch Microsoft Contacts.');
  }
}

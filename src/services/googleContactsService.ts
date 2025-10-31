
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { PublicUserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Fetches the user's Google Contacts, finds which ones are also on Calendar.ai,
 * and returns their public profiles.
 * @param userId The ID of the user requesting their contacts.
 * @returns A promise that resolves to an array of PublicUserProfile objects.
 */
export async function getContactsOnApp(userId: string): Promise<PublicUserProfile[]> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch contacts.`);
    return [];
  }

  const people = google.people({ version: 'v1', auth: client });

  try {
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 500, // Fetch up to 500 contacts
      personFields: 'names,emailAddresses',
    });

    const connections = response.data.connections;
    if (!connections || connections.length === 0) {
      return [];
    }

    // Extract all non-empty email addresses from the contacts
    const contactEmails = connections.flatMap(person => 
      person.emailAddresses
        ? person.emailAddresses.map(email => email.value).filter((email): email is string => !!email)
        : []
    );

    if (contactEmails.length === 0) {
      return [];
    }

    // Now, query Firestore to see which of these emails exist in our `users` collection.
    // Firestore's 'in' query is limited to 30 items per query. We need to chunk the emails.
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
            // Ensure we don't list the user themselves
            if (doc.id !== userId) {
                appUsers.push({
                    uid: doc.id,
                    displayName: data.displayName || 'Anonymous User',
                    username: data.username || `user_${doc.id.substring(0,5)}`,
                    photoURL: data.photoURL || null,
                    // Add other public profile fields as needed
                } as PublicUserProfile);
            }
        });
    });

    return appUsers;

  } catch (error: any) {
    if (error.code === 403 && error.errors?.[0]?.reason === 'accessNotConfigured') {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '[your-project-id]';
        const errorMessage = `Google People API has not been enabled in project ${projectId}. Please visit https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=${projectId} to enable it.`;
        console.error(errorMessage, error);
        throw new Error("Contact sync is not configured for this application.");
    }
    console.error(`Error fetching Google Contacts for user ${userId}:`, error);
    throw new Error('Failed to fetch Google Contacts.');
  }
}

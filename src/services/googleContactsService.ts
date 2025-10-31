
'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './googleAuthService';
import type { PublicUserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore';

interface AppUserResult {
    found: boolean;
    profile?: PublicUserProfile;
    email?: string;
    phone?: string;
}

interface GoogleContact {
    displayName: string;
    email?: string;
    phone?: string;
}

/**
 * Fetches the user's Google Contacts, finds which ones are also on Calendar.ai,
 * and returns their public profiles, separated into app users and external contacts.
 * @param userId The ID of the user requesting their contacts.
 * @returns A promise that resolves to an object containing appUsers and externalContacts.
 */
export async function getGoogleContactsOnApp(userId: string): Promise<{ appUsers: PublicUserProfile[], externalContacts: GoogleContact[] }> {
  const client = await getAuthenticatedClient(userId);
  if (!client) {
    console.log(`Not authenticated with Google for user ${userId}. Cannot fetch contacts.`);
    throw new Error('Google authentication required.');
  }

  const people = google.people({ version: 'v1', auth: client });

  try {
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 500,
      personFields: 'names,emailAddresses,phoneNumbers', // Include phone numbers
    });

    const connections = response.data.connections;
    if (!connections || connections.length === 0) {
      return { appUsers: [], externalContacts: [] };
    }

    const allContactEmails = connections.flatMap(person => 
      person.emailAddresses?.map(email => email.value).filter((email): email is string => !!email) || []
    );

    const allContactPhones = connections.flatMap(person =>
        person.phoneNumbers?.map(phone => phone.value).filter((phone): phone is string => !!phone) || []
    );

    if (allContactEmails.length === 0 && allContactPhones.length === 0) {
      return { appUsers: [], externalContacts: [] };
    }

    const appUserEmails = new Set<string>();
    const appUserPhones = new Set<string>();
    const appUsers: PublicUserProfile[] = [];
    const CHUNK_SIZE = 30;

    const queryByField = async (field: 'email' | 'phoneNumber', values: string[]) => {
      if (values.length === 0) return;
      for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunk = values.slice(i, i + CHUNK_SIZE);
        const q = query(collection(db, 'users'), where(field, 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (doc.id !== userId && !appUsers.some(u => u.uid === doc.id)) {
                appUsers.push({
                    uid: doc.id,
                    displayName: data.displayName || 'Anonymous User',
                    username: data.username || `user_${doc.id.substring(0,5)}`,
                    photoURL: data.photoURL || null,
                } as PublicUserProfile);
                if (data.email) appUserEmails.add(data.email);
                if (data.phoneNumber) appUserPhones.add(data.phoneNumber);
            }
        });
      }
    };
    
    await Promise.all([
      queryByField('email', allContactEmails),
      queryByField('phoneNumber', allContactPhones)
    ]);
    
    const externalContacts: GoogleContact[] = connections
        .map(person => {
            const name = person.names?.[0]?.displayName || '';
            const email = person.emailAddresses?.[0]?.value || undefined;
            const phone = person.phoneNumbers?.[0]?.value || undefined;
            return { displayName: name, email, phone };
        })
        .filter(contact => 
            contact.displayName && 
            (!contact.email || !appUserEmails.has(contact.email)) &&
            (!contact.phone || !appUserPhones.has(contact.phone))
        );

    return { appUsers, externalContacts };

  } catch (error: any) {
    if (error.code === 403) {
      const isPermissionError = error.errors?.some((e: any) => e.reason === 'forbidden' || e.message.includes('permission'));
      if (isPermissionError) {
          throw new Error('Contacts permission denied. Please re-authenticate.');
      }
      
      const isApiNotEnabled = error.errors?.some((e: any) => e.reason === 'accessNotConfigured');
      if (isApiNotEnabled) {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '[your-project-id]';
        const errorMessage = `Google People API has not been enabled in project ${projectId}. Please visit https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=${projectId} to enable it.`;
        console.error(errorMessage, error);
        throw new Error("Contact sync is not configured for this application.");
      }
    }
    console.error(`Error fetching Google Contacts for user ${userId}:`, error);
    throw new Error('Failed to fetch Google Contacts.');
  }
}

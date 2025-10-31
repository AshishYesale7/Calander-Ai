
'use server';

import { getAuthenticatedClient } from './microsoftGraphService';
import type { PublicUserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface MicrosoftContact {
    displayName: string;
    emailAddresses: { address: string }[];
    // Microsoft Graph also returns businessPhones and mobilePhone
    businessPhones: string[];
    mobilePhone: string | null;
}

interface ExternalContact {
    displayName: string;
    email?: string;
    phone?: string;
}


/**
 * Fetches the user's Microsoft Contacts (from Outlook, Teams, etc.), finds which ones are also on Calendar.ai,
 * and returns their public profiles, separated into app users and external contacts.
 * @param userId The ID of the user requesting their contacts.
 * @returns A promise that resolves to an object containing appUsers and externalContacts.
 */
export async function getContactsOnApp(userId: string): Promise<{ appUsers: PublicUserProfile[], externalContacts: ExternalContact[] }> {
  const client = await getAuthenticatedClient(userId);
  if (!client?.accessToken) {
    console.log(`Not authenticated with Microsoft for user ${userId}. Cannot fetch contacts.`);
    throw new Error('Microsoft authentication required.');
  }

  const contactsUrl = 'https://graph.microsoft.com/v1.0/me/contacts?$select=displayName,emailAddresses,businessPhones,mobilePhone';

  try {
    const response = await fetch(contactsUrl, {
        headers: {
            'Authorization': `Bearer ${client.accessToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
             throw new Error('Contacts permission denied. Please re-authenticate.');
        }
        console.error("Microsoft Graph API error:", errorData.error.message);
        throw new Error('Failed to fetch Microsoft contacts.');
    }
    
    const data = await response.json();
    const contacts: MicrosoftContact[] = data.value;

    if (!contacts || contacts.length === 0) {
      return { appUsers: [], externalContacts: [] };
    }

    const contactEmails = contacts.flatMap(person => 
        person.emailAddresses?.map(email => email.address).filter((email): email is string => !!email) || []
    );
    const contactPhones = contacts.flatMap(person => {
        const phones: (string | null)[] = [...person.businessPhones];
        if (person.mobilePhone) phones.push(person.mobilePhone);
        return phones.filter((phone): phone is string => !!phone);
    });

    if (contactEmails.length === 0 && contactPhones.length === 0) {
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
      queryByField('email', contactEmails),
      queryByField('phoneNumber', contactPhones)
    ]);
    
    const externalContacts: ExternalContact[] = contacts
        .map(person => {
            const name = person.displayName || '';
            const email = person.emailAddresses?.[0]?.address || undefined;
            const phone = person.mobilePhone || person.businessPhones?.[0] || undefined;
            return { displayName: name, email, phone };
        })
        .filter(contact => 
            contact.displayName && 
            (!contact.email || !appUserEmails.has(contact.email)) &&
            (!contact.phone || !appUserPhones.has(contact.phone))
        );

    return { appUsers, externalContacts };

  } catch (error: any) {
    if (error.code === 403 || error.message.includes('denied')) {
        console.error("Microsoft Graph API access denied for contacts. Ensure 'Contacts.Read' permission is granted.", error);
        throw new Error('Contacts permission denied. Please re-authenticate.');
    }
    console.error(`Error fetching Microsoft Contacts for user ${userId}:`, error);
    throw new Error('Failed to fetch Microsoft Contacts.');
  }
}

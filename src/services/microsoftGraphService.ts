
'use server';

import type { Credentials } from 'google-auth-library';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { NextRequest } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function getRedirectURI(request?: NextRequest): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (request ? new URL(request.url).origin : '');
    if (!baseUrl) {
      throw new Error("Could not determine redirect URI. Please set NEXT_PUBLIC_BASE_URL in your .env file.");
    }
    return `${baseUrl}/api/auth/microsoft/callback`;
}


export async function getMicrosoftAuthUrl(request: NextRequest, state?: string | null): Promise<string> {
    const tenant = 'common'; 
    const scopes = [
        'openid',
        'profile',
        'email',
        'offline_access',
        'User.Read',
        'Calendars.ReadWrite',
        'Calendars.ReadWrite.Shared',
        'Mail.Read',
        'Mail.ReadWrite',
        'Mail.Send',
        'Mail.Read.Shared',
        'Mail.ReadWrite.Shared',
        'Mail.Send.Shared',
        'Mail.ReadBasic',
        'Mail.ReadBasic.Shared',
        'Files.ReadWrite.All',
        'Contacts.ReadWrite.Shared',
        'OnlineMeetings.ReadWrite',
        'OnlineMeetingTranscript.Read.All',
        'Notes.ReadWrite.All',
        'Tasks.ReadWrite',
        'Tasks.ReadWrite.Shared',
    ].join(' ');

    const redirectUri = await getRedirectURI(request);

    const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    url.searchParams.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_mode', 'query');
    url.searchParams.append('scope', scopes);
    url.searchParams.append('prompt', 'select_account'); // This line forces account selection
    if (state) {
        url.searchParams.append('state', state);
    }
    
    return url.toString();
}

export async function getTokensFromCode(request: NextRequest, code: string): Promise<Credentials> {
    const redirectUri = await getRedirectURI(request);
    const tenant = 'common';
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

    const scopes = [
        'openid', 'profile', 'email', 'offline_access', 'User.Read',
        'Calendars.ReadWrite', 'Calendars.ReadWrite.Shared',
        'Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'Mail.Read.Shared', 'Mail.ReadWrite.Shared', 'Mail.Send.Shared', 'Mail.ReadBasic', 'Mail.ReadBasic.Shared',
        'Files.ReadWrite.All', 'Contacts.ReadWrite.Shared', 'OnlineMeetings.ReadWrite', 'OnlineMeetingTranscript.Read.All',
        'Notes.ReadWrite.All', 'Tasks.ReadWrite', 'Tasks.ReadWrite.Shared',
    ].join(' ');
    
    const params = new URLSearchParams();
    params.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
    params.append('scope', scopes);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!);

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    const tokens = await response.json();

    if (!response.ok) {
        console.error("Microsoft token exchange error:", tokens);
        throw new Error(tokens.error_description || 'Failed to exchange code for tokens.');
    }
    
    if (tokens.expires_in && !tokens.expiry_date) {
        tokens.expiry_date = Date.now() + tokens.expires_in * 1000;
    }
    
    return tokens as Credentials;
}

export async function saveMicrosoftTokensToFirestore(userId: string, tokens: Credentials): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { microsoft_tokens: tokens }, { merge: true });
}

export async function getMicrosoftTokensFromFirestore(userId: string): Promise<Credentials | null> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists() && docSnap.data().microsoft_tokens) {
        return docSnap.data().microsoft_tokens as Credentials;
    }
    return null;
}

async function refreshAccessToken(refreshToken: string): Promise<Credentials> {
    const tenant = 'common';
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

    const scopes = [
        'openid', 'profile', 'email', 'offline_access', 'User.Read',
        'Calendars.ReadWrite', 'Calendars.ReadWrite.Shared',
        'Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'Mail.Read.Shared', 'Mail.ReadWrite.Shared', 'Mail.Send.Shared', 'Mail.ReadBasic', 'Mail.ReadBasic.Shared',
        'Files.ReadWrite.All', 'Contacts.ReadWrite.Shared', 'OnlineMeetings.ReadWrite', 'OnlineMeetingTranscript.Read.All',
        'Notes.ReadWrite.All', 'Tasks.ReadWrite', 'Tasks.ReadWrite.Shared',
    ].join(' ');
    
    const params = new URLSearchParams();
    params.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
    params.append('scope', scopes);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');
    params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!);

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    const newTokens = await response.json();
    if (!response.ok) {
        throw new Error(newTokens.error_description || 'Failed to refresh Microsoft token.');
    }
    
    if (newTokens.expires_in) {
      newTokens.expiry_date = Date.now() + newTokens.expires_in * 1000;
    }

    return newTokens;
}

export async function getAuthenticatedClient(userId: string): Promise<{ accessToken: string } | null> {
    const tokens = await getMicrosoftTokensFromFirestore(userId);
    if (!tokens) {
        return null;
    }

    if (tokens.expiry_date && tokens.expiry_date < (Date.now() + 60000)) {
        if (tokens.refresh_token) {
            try {
                const newTokens = await refreshAccessToken(tokens.refresh_token);
                await saveMicrosoftTokensToFirestore(userId, { ...tokens, ...newTokens });
                return { accessToken: newTokens.access_token! };
            } catch (error) {
                console.error(`Error refreshing Microsoft access token for user ${userId}:`, error);
                const userDocRef = doc(db, 'users', userId);
                await updateDoc(userDocRef, { microsoft_tokens: deleteField() });
                return null;
            }
        } else {
            return null;
        }
    }
    
    if (tokens.access_token) {
        return { accessToken: tokens.access_token };
    }

    return null;
}


export async function createCalendarSubscription(accessToken: string): Promise<any> {
    const subscriptionUrl = 'https://graph.microsoft.com/v1.0/subscriptions';
    
    const expirationDateTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const subscriptionData = {
        changeType: 'created,updated,deleted',
        notificationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/microsoft/webhook`,
        resource: '/me/events',
        expirationDateTime: expirationDateTime,
        clientState: 'secretClientValue', 
    };

    const response = await fetch(subscriptionUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Error creating MS Graph subscription:", error);
        throw new Error('Failed to create calendar subscription.');
    }

    return await response.json();
}

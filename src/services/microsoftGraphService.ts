
'use server';

import { google } from 'googleapis'; // This seems incorrect, should be a Microsoft library
import type { Credentials } from 'google-auth-library';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { NextRequest } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


// This needs to be a valid OAuth2 client for Microsoft, not Google.
// For now, we will create a placeholder.
// In a real scenario, you'd use a library like `@azure/msal-node` or construct the URLs manually.
const getOAuth2Client = async (request?: NextRequest) => {
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
        throw new Error("Microsoft OAuth client credentials are not configured.");
    }
    const redirectUri = await getRedirectURI(request);
    
    // This is a conceptual placeholder. The 'googleapis' library is for Google.
    // A proper implementation would use Microsoft's own libraries or manual URL construction.
    return new google.auth.OAuth2(
        MICROSOFT_CLIENT_ID,
        MICROSOFT_CLIENT_SECRET,
        redirectUri
    );
};

export async function getRedirectURI(request?: NextRequest): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (request ? new URL(request.url).origin : '');
    if (!baseUrl) {
      throw new Error("Could not determine redirect URI. Please set NEXT_PUBLIC_BASE_URL in your .env file.");
    }
    return `${baseUrl}/api/auth/microsoft/callback`;
}


export async function getMicrosoftAuthUrl(request: NextRequest, state?: string | null): Promise<string> {
    const tenant = 'consumers'; // For personal Microsoft accounts
    const scopes = [
        'openid',
        'profile',
        'email',
        'offline_access', // Important for getting a refresh token
        'Calendars.ReadWrite',
        'Mail.Read',
        'Files.Read',
        'OnlineMeetings.ReadWrite' // New scope for Teams meetings
    ].join(' ');

    const redirectUri = await getRedirectURI(request);

    const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    url.searchParams.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_mode', 'query');
    url.searchParams.append('scope', scopes);
    if (state) {
        url.searchParams.append('state', state);
    }
    
    return url.toString();
}

export async function getTokensFromCode(request: NextRequest, code: string): Promise<Credentials> {
    const redirectUri = await getRedirectURI(request);
    const tenant = 'consumers';
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
    params.append('scope', 'openid profile email offline_access Calendars.ReadWrite Mail.Read Files.Read OnlineMeetings.ReadWrite');
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

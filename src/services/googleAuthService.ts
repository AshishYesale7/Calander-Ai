
'use server';

import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { NextRequest } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google OAuth credentials in environment variables.");
}

// Make this async to comply with 'use server' exporting rules
export async function getRedirectURI(request?: NextRequest): Promise<string> {
    // 1. Prioritize the explicitly set environment variable for production consistency.
    if (NEXT_PUBLIC_BASE_URL) {
        return `${NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;
    }

    // 2. Derive from the request. This is for local/preview/dynamic environments.
    if (request) {
        const host = request.headers.get('host')!; // 'host' is a mandatory header.
        
        // Check for 'x-forwarded-proto' first (common in reverse proxies like Vercel).
        // Then fall back to the protocol from the full request URL.
        const protocol = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
        
        return `${protocol}://${host}/api/auth/google/callback`;
    }
    
    // 3. If no request and no env var, we cannot proceed.
    throw new Error("Could not determine redirect URI. Please set NEXT_PUBLIC_BASE_URL in your .env file or ensure the function is called within a Next.js request context.");
}


async function getOAuth2Client(request?: NextRequest) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth client credentials are not configured.");
    }
    const redirectUri = await getRedirectURI(request); // Await the result
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        redirectUri
    );
}

export async function getGoogleAuthUrl(request: NextRequest, state?: string | null): Promise<string> {
    const oauth2Client = await getOAuth2Client(request); // Await the result
    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/drive.readonly' // Add Drive scope
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force consent screen to get refresh_token
        scope: scopes,
        state: state ?? undefined,
    });
}

export async function getTokensFromCode(request: NextRequest, code: string): Promise<Credentials> {
    const oauth2Client = await getOAuth2Client(request); // Await the result
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
        throw new Error('Failed to retrieve tokens from Google.');
    }
    return tokens;
}

// Firestore-based token management
export async function saveGoogleTokensToFirestore(userId: string, newTokens: Credentials): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const userDocRef = doc(db, 'users', userId);
    
    const existingTokens = await getGoogleTokensFromFirestore(userId);
    
    const tokensToSave = {
        ...existingTokens,
        ...newTokens
    };
    
    if (!tokensToSave.refresh_token) {
        // If we get new tokens that DON'T have a refresh token, but we already have one stored, keep the old one.
        // This is crucial because Google often only sends the refresh token on the very first authorization.
        if (existingTokens?.refresh_token) {
            tokensToSave.refresh_token = existingTokens.refresh_token;
        } else {
           console.warn("Saving Google tokens without a refresh token. User may need to re-authenticate if the session expires completely.");
        }
    }
    
    await setDoc(userDocRef, { google_tokens: tokensToSave }, { merge: true });
}

export async function getGoogleTokensFromFirestore(userId: string): Promise<Credentials | null> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists() && docSnap.data().google_tokens) {
        const tokens = docSnap.data().google_tokens as Credentials;
        if (tokens.access_token || tokens.refresh_token) {
             return tokens;
        }
    }
    return null;
}

export async function clearGoogleTokensFromFirestore(userId: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
        google_tokens: deleteField()
    });
}

export async function getAuthenticatedClient(userId: string) {
    const tokens = await getGoogleTokensFromFirestore(userId);
    if (!tokens) {
        return null;
    }
    
    // This call will rely on NEXT_PUBLIC_BASE_URL because no request is passed.
    // This is safe for token refreshes, which do not use the redirect_uri.
    const client = await getOAuth2Client(); // Await the result
    client.setCredentials(tokens);

    // Refresh token if it's close to expiring
    if (tokens.expiry_date && tokens.expiry_date < (Date.now() + 60000)) {
        console.log(`Google access token for user ${userId} may be expired, attempting to refresh...`);
        try {
            const { credentials } = await client.refreshAccessToken();
            const newTokens = { ...tokens, ...credentials };
            client.setCredentials(newTokens);
            await saveGoogleTokensToFirestore(userId, newTokens);
            console.log(`Google access token for user ${userId} refreshed successfully.`);
        } catch (error) {
            console.error(`Error refreshing access token for user ${userId}:`, error);
            // If refresh fails, clear the invalid tokens to prompt re-authentication
            await clearGoogleTokensFromFirestore(userId);
            return null;
        }
    }
    
    return client;
}

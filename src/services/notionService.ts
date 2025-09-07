
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';

const getNotionToken = async (userId: string): Promise<string | null> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data().notion_token || null : null;
};

export async function saveNotionToken(userId: string, token: string): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { notion_token: token }, { merge: true });
}

export async function getNotionAuthUrl(state?: string | null): Promise<string> {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        throw new Error("Notion API credentials are not configured.");
    }
    
    const url = new URL('https://api.notion.com/v1/oauth/authorize');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('owner', 'user');
    if (state) {
        url.searchParams.append('state', state);
    }
    
    return url.toString();
}

export async function getTokensFromCode(code: string): Promise<any> {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error("Notion API credentials are not configured.");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!res.ok) {
        const errorBody = await res.json();
        console.error("Notion OAuth Error:", errorBody);
        throw new Error(`Failed to exchange code for token: ${errorBody.error_description || res.statusText}`);
    }

    return await res.json();
}

export async function isNotionConnected(userId: string): Promise<boolean> {
    const token = await getNotionToken(userId);
    return !!token;
}


'use client';

import { OAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from './userService';
import type { User } from 'firebase/auth';

const getMicrosoftProvider = () => {
    const provider = new OAuthProvider('microsoft.com');
    // Explicitly set the tenant to 'consumers' to ensure personal Microsoft accounts (Outlook, Hotmail) work correctly.
    // This is a common requirement to avoid environment-related errors.
    provider.setCustomParameters({
        tenant: 'consumers',
    });
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
};

const handleAuthRedirect = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getMicrosoftProvider();
    await signInWithRedirect(auth, provider);
};

// This function should be called when the application loads on the callback page.
// It processes the result of the redirect.
const handleRedirectResult = async (): Promise<User | null> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            // User has successfully signed in.
            const user = result.user;
            
            // Check if it's a new user by trying to get their profile.
            const userProfile = await getUserProfile(user.uid);
            if (!userProfile) {
                // If no profile exists, it's a new user, so create their profile.
                await createUserProfile(user);
            }
            return user;
        }
        return null;
    } catch (error: any) {
        console.error("Microsoft auth redirect result error:", error);
        // Let the calling UI handle specific error codes if needed.
        throw error;
    }
};


// We will now export a single function to handle the redirect logic,
// which will be used for both sign-in and sign-up flows from the UI.
export const triggerMicrosoftRedirect = async (): Promise<void> => {
    await handleAuthRedirect();
};

// And a function to process the result after the redirect.
export const processMicrosoftRedirect = async (): Promise<User | null> => {
    return handleRedirectResult();
}

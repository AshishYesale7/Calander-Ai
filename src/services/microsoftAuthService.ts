
'use server';

import { OAuthProvider, signInWithRedirect, getRedirectResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from './userService';

const getMicrosoftProvider = () => {
    const provider = new OAuthProvider('microsoft.com');
    // This is crucial for personal accounts (Outlook, Hotmail) to work.
    provider.setCustomParameters({
        tenant: 'consumers',
    });
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
};

// This function will be called by the UI to start the sign-in/sign-up process.
export const triggerMicrosoftRedirect = async (action: 'signin' | 'signup'): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getMicrosoftProvider();
    
    // We can store the intended action in session storage to retrieve it on the callback page.
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('msft_auth_action', action);
    }
    
    await signInWithRedirect(auth, provider);
};

// This function should be called on a dedicated callback page or when the app loads
// to process the result of the redirect.
export const processMicrosoftRedirect = async (): Promise<User | null> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            const authAction = typeof window !== 'undefined' ? sessionStorage.getItem('msft_auth_action') : 'signin';
            
            if (authAction === 'signup') {
                const userProfile = await getUserProfile(user.uid);
                if (!userProfile) {
                    await createUserProfile(user);
                }
            }
            // Clear the action from session storage after use.
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('msft_auth_action');
            }
            return user;
        }
        return null;
    } catch (error: any) {
        console.error("Microsoft auth redirect result error:", error);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('msft_auth_action');
        }
        // Let the calling UI handle specific error codes if needed.
        throw error;
    }
};

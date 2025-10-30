
'use server';

import { OAuthProvider, signInWithRedirect, getRedirectResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from './userService';

const getYahooProvider = () => {
    const provider = new OAuthProvider('yahoo.com');
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
};

export const triggerYahooRedirect = async (action: 'signin' | 'signup'): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getYahooProvider();
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('yahoo_auth_action', action);
    }
    await signInWithRedirect(auth, provider);
};

export const processYahooRedirect = async (): Promise<User | null> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            const authAction = typeof window !== 'undefined' ? sessionStorage.getItem('yahoo_auth_action') : 'signin';
            
            if (authAction === 'signup') {
                const userProfile = await getUserProfile(user.uid);
                if (!userProfile) {
                    await createUserProfile(user);
                }
            }
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('yahoo_auth_action');
            }
            return user;
        }
        return null;
    } catch (error: any) {
        console.error("Yahoo auth redirect result error:", error);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('yahoo_auth_action');
        }
        throw error;
    }
};

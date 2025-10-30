
'use server';

import { OAuthProvider, signInWithRedirect, getRedirectResult, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile } from './userService';

const getAppleProvider = () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return provider;
};

export const triggerAppleRedirect = async (action: 'signin' | 'signup'): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getAppleProvider();
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('apple_auth_action', action);
    }
    await signInWithRedirect(auth, provider);
};

export const processAppleRedirect = async (): Promise<User | null> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const user = result.user;
            const authAction = typeof window !== 'undefined' ? sessionStorage.getItem('apple_auth_action') : 'signin';
            
            if (authAction === 'signup') {
                const userProfile = await getUserProfile(user.uid);
                if (!userProfile) {
                    await createUserProfile(user);
                }
            }
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('apple_auth_action');
            }
            return user;
        }
        return null;
    } catch (error: any) {
        console.error("Apple auth redirect result error:", error);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('apple_auth_action');
        }
        throw error;
    }
};

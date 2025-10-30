
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from './userService';
import type { User } from 'firebase/auth';

const getYahooProvider = () => {
    const provider = new OAuthProvider('yahoo.com');
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
};

const handleAuth = async (isSignUp: boolean): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getYahooProvider();
    const result = await signInWithPopup(auth, provider);

    if (isSignUp) {
        await createUserProfile(result.user);
    }
    
    return result.user;
};

export const signInWithYahoo = async (): Promise<User> => {
    return handleAuth(false);
};

export const signUpWithYahoo = async (): Promise<User> => {
    return handleAuth(true);
};

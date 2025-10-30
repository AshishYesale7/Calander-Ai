
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from './userService';
import type { User } from 'firebase/auth';

const getMicrosoftProvider = () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
};

const handleAuth = async (isSignUp: boolean): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getMicrosoftProvider();
    const result = await signInWithPopup(auth, provider);

    if (isSignUp) {
        await createUserProfile(result.user);
    }
    
    return result.user;
};

export const signInWithMicrosoft = async (): Promise<User> => {
    return handleAuth(false);
};

export const signUpWithMicrosoft = async (): Promise<User> => {
    return handleAuth(true);
};

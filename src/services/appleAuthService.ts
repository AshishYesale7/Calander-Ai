
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from './userService';
import type { User } from 'firebase/auth';

const getAppleProvider = () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return provider;
};

const handleAuth = async (isSignUp: boolean): Promise<User> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    const provider = getAppleProvider();
    const result = await signInWithPopup(auth, provider);

    if (isSignUp) {
        await createUserProfile(result.user);
    }
    
    return result.user;
};

export const signInWithApple = async (): Promise<User> => {
    return handleAuth(false);
};

export const signUpWithApple = async (): Promise<User> => {
    return handleAuth(true);
};

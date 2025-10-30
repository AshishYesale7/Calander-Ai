
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const signInWithYahoo = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    const provider = new OAuthProvider('yahoo.com');
    provider.addScope('email');
    provider.addScope('profile');
    
    await signInWithPopup(auth, provider);
};

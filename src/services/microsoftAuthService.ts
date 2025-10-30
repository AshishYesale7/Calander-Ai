
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const signInWithMicrosoft = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    const provider = new OAuthProvider('microsoft.com');
    
    // This is the crucial part for personal Microsoft accounts (Outlook, Hotmail, etc.)
    // It tells Firebase to use the "consumers" endpoint.
    provider.setCustomParameters({
        tenant: 'consumers',
    });
    
    provider.addScope('email');
    provider.addScope('profile');
    
    await signInWithPopup(auth, provider);
};

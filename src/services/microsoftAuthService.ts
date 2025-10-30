
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const signInWithMicrosoft = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    const provider = new OAuthProvider('microsoft.com');
    // This is crucial for personal accounts (Outlook, Hotmail) to work.
    provider.setCustomParameters({
        tenant: 'consumers',
    });
    provider.addScope('email');
    provider.addScope('profile');
    
    await signInWithPopup(auth, provider);
};

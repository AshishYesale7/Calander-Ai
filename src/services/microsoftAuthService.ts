
'use server';

import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from './userService';

export const signInWithMicrosoft = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    
    const provider = new OAuthProvider('microsoft.com');
    
    // This is crucial for personal Microsoft accounts (Outlook, Hotmail, etc.)
    provider.setCustomParameters({
        tenant: 'consumers',
    });
    
    // Add the necessary scopes to read user data from Microsoft Graph API
    provider.addScope('User.Read'); // Basic profile information
    provider.addScope('Calendars.Read'); // Read calendar events
    provider.addScope('Mail.Read'); // Read emails
    provider.addScope('Files.Read'); // Read OneDrive files
    
    // The existing scopes for profile and email are still useful
    provider.addScope('email');
    provider.addScope('profile');
    
    await signInWithPopup(auth, provider);
};

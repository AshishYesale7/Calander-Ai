
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { UserPreferences, SocialLinks } from '@/types';
import type { User } from 'firebase/auth';

type CodingUsernames = {
    codeforces?: string;
    leetcode?: string;
    codechef?: string;
}

const getUserDocRef = (userId: string) => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    return doc(db, 'users', userId);
};

export const createUserProfile = async (user: User): Promise<void> => {
    const userDocRef = getUserDocRef(user.uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
            // Create a comprehensive default profile structure for a new user.
            const defaultProfile = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
                username: user.email?.split('@')[0] || `user${user.uid.substring(0, 5)}`,
                photoURL: user.photoURL || null,
                createdAt: new Date(),
                bio: '',
                socials: {
                    github: '',
                    linkedin: '',
                    twitter: ''
                },
                statusEmoji: null,
                countryCode: null,
                preferences: {
                    routine: []
                },
                codingUsernames: {},
                installedPlugins: [], // Initialize with empty array
                geminiApiKey: null, // Initialize API key as null
            };
            await setDoc(userDocRef, defaultProfile);
        }
    } catch (error) {
        console.error("Failed to create user profile in Firestore:", error);
        // Don't re-throw, as this is a background task.
    }
}

export const saveCodingUsernames = async (userId: string, usernames: CodingUsernames): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const usernamesToSave: { [key: string]: string | undefined | null } = {};
        for (const key in usernames) {
            const typedKey = key as keyof CodingUsernames;
            // Set to null to remove the field if the value is undefined.
            usernamesToSave[typedKey] = usernames[typedKey] || null;
        }

        await setDoc(userDocRef, { codingUsernames: usernamesToSave }, { merge: true });
    } catch (error) {
        console.error("Failed to save coding usernames to Firestore:", error);
        throw new Error("Could not save coding usernames.");
    }
};

export const getCodingUsernames = async (userId: string): Promise<CodingUsernames | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().codingUsernames) {
            return docSnap.data().codingUsernames as CodingUsernames;
        }
        return null;
    } catch (error) {
        console.error("Failed to get coding usernames from Firestore:", error);
        throw new Error("Could not retrieve coding usernames.");
    }
};


export const saveUserGeminiApiKey = async (userId: string, apiKey: string | null): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { geminiApiKey: apiKey }, { merge: true });
    } catch (error) {
        console.error("Failed to save Gemini API key to Firestore:", error);
        throw new Error("Could not save API key to your account.");
    }
};

export const getUserGeminiApiKey = async (userId: string): Promise<string | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().geminiApiKey) {
            return docSnap.data().geminiApiKey;
        }
        return null;
    } catch (error) {
        console.error("Failed to get Gemini API key from Firestore:", error);
        throw new Error("Could not retrieve API key from your account.");
    }
};

export const updateUserProfile = async (userId: string, profileData: Partial<{ displayName: string; username: string; photoURL: string | null; bio: string; socials: SocialLinks; statusEmoji: string | null, countryCode: string | null }>): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    const dataToUpdate: { [key: string]: any } = {};

    if(profileData.displayName !== undefined) dataToUpdate['displayName'] = profileData.displayName;
    if(profileData.username !== undefined) dataToUpdate['username'] = profileData.username;
    if(profileData.photoURL !== undefined) dataToUpdate['photoURL'] = profileData.photoURL;
    if(profileData.bio !== undefined) dataToUpdate['bio'] = profileData.bio;
    if(profileData.socials !== undefined) dataToUpdate['socials'] = profileData.socials;
    if(profileData.statusEmoji !== undefined) dataToUpdate['statusEmoji'] = profileData.statusEmoji;
    if(profileData.countryCode !== undefined) dataToUpdate['countryCode'] = profileData.countryCode;


    try {
        await setDoc(userDocRef, dataToUpdate, { merge: true });
    } catch (error) {
        console.error("Failed to update user profile in Firestore:", error);
        throw new Error("Could not update user profile.");
    }
};


export const getUserProfile = async (userId: string): Promise<Partial<UserPreferences & { displayName: string; username: string; photoURL: string }> | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                displayName: data.displayName,
                username: data.username,
                photoURL: data.photoURL,
                bio: data.bio,
                socials: data.socials,
                statusEmoji: data.statusEmoji,
                countryCode: data.countryCode,
                routine: data.preferences?.routine || [], // Safely access nested property
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to get user profile from Firestore:", error);
        throw new Error("Could not retrieve user profile.");
    }
};

export const saveUserFCMToken = async (userId: string, token: string): Promise<void> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const tokensCollectionRef = collection(db, 'users', userId, 'fcmTokens');
    const tokenDocRef = doc(tokensCollectionRef, token);
    try {
        // Using setDoc with the token as the ID prevents duplicate tokens from being saved.
        await setDoc(tokenDocRef, { createdAt: new Date() });
    } catch (error) {
        console.error("Failed to save FCM token to Firestore:", error);
        throw new Error("Could not save notification token.");
    }
};

// New functions for managing installed plugins
export const saveInstalledPlugins = async (userId: string, pluginNames: string[]): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { installedPlugins: pluginNames }, { merge: true });
    } catch (error) {
        console.error("Failed to save installed plugins to Firestore:", error);
        throw new Error("Could not save your installed plugins.");
    }
};

export const getInstalledPlugins = async (userId: string): Promise<string[] | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.hasOwnProperty('installedPlugins')) {
                return Array.isArray(data.installedPlugins) ? data.installedPlugins : [];
            }
        }
        return null;
    } catch (error) {
        console.error("Failed to get installed plugins from Firestore:", error);
        throw new Error("Could not retrieve your installed plugins.");
    }
};

export const saveUserPreferences = async (userId: string, preferences: Partial<UserPreferences>): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { preferences }, { merge: true });
    } catch (error) {
        console.error("Failed to save user preferences to Firestore:", error);
        throw new Error("Could not save your preferences.");
    }
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().preferences) {
            return docSnap.data().preferences as UserPreferences;
        }
        return null;
    } catch (error) {
        console.error("Failed to get user preferences from Firestore:", error);
        throw new Error("Could not retrieve your preferences.");
    }
};

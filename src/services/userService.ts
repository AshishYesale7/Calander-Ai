
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { UserPreferences } from '@/types';

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

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { preferences }, { merge: true });
    } catch (error) {
        console.error("Failed to save user preferences to Firestore:", error);
        throw new Error("Could not save your daily plan preferences.");
    }
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().preferences) {
            // Basic validation to ensure it has the 'routine' property
            const prefs = docSnap.data().preferences;
            if (prefs && Array.isArray(prefs.routine) && prefs.routine.length > 0) {
                 return prefs as UserPreferences;
            }
        }
        // Return null if no preferences are set or routine is empty, indicating setup is needed
        return null;
    } catch (error) {
        console.error("Failed to get user preferences from Firestore:", error);
        // Propagate error to be handled by the UI
        throw new Error("Could not retrieve your preferences.");
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
            // Check if the field exists. If it does, return it (even if it's an empty array).
            // If it doesn't exist, return null to indicate it's a new user profile in this context.
            if (data.hasOwnProperty('installedPlugins')) {
                return Array.isArray(data.installedPlugins) ? data.installedPlugins : [];
            }
        }
        // Return null if the document doesn't exist or the field is missing
        return null;
    } catch (error) {
        console.error("Failed to get installed plugins from Firestore:", error);
        throw new Error("Could not retrieve your installed plugins.");
    }
};

export const updateUserProfile = async (userId: string, profileData: { statusEmoji?: string | null, countryCode?: string | null }): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    const dataToUpdate: any = {};
    if(profileData.statusEmoji !== undefined) dataToUpdate['statusEmoji'] = profileData.statusEmoji;
    if(profileData.countryCode !== undefined) dataToUpdate['countryCode'] = profileData.countryCode;

    try {
        await setDoc(userDocRef, dataToUpdate, { merge: true });
    } catch (error) {
        console.error("Failed to update user profile in Firestore:", error);
        throw new Error("Could not update user profile.");
    }
};

export const getUserProfile = async (userId: string): Promise<{ statusEmoji?: string, countryCode?: string } | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                statusEmoji: data.statusEmoji,
                countryCode: data.countryCode,
            };
        }
        return null;
    } catch (error) {
        console.error("Failed to get user profile from Firestore:", error);
        throw new Error("Could not retrieve user profile.");
    }
};

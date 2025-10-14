
'use server';

import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteField, query, where, getDocs, limit, orderBy, writeBatch, Timestamp } from 'firebase/firestore';
import type { UserPreferences, SocialLinks, UserProfile } from '@/types';
import type { User } from 'firebase/auth';
import { deleteImageByUrl } from './storageService';
import { addDays } from 'date-fns';


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

export const createUserProfile = async (user: User): Promise<UserProfile> => {
    const userDocRef = getUserDocRef(user.uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
             // If profile exists, just return it.
            const existingData = docSnap.data();
             return {
                uid: user.uid,
                displayName: existingData.displayName || user.displayName || 'Anonymous',
                username: existingData.username || user.email?.split('@')[0] || `user_${user.uid.substring(0,5)}`,
                onboardingCompleted: existingData.onboardingCompleted || false,
                ...existingData,
            } as UserProfile;
        }

        const displayName = user.displayName || user.email?.split('@')[0] || 'Anonymous User';
        const username = user.email?.split('@')[0] || `user_${user.uid.substring(0, 10)}`;
        
        const defaultProfile: Omit<UserProfile, 'uid'> = {
            email: user.email,
            displayName: displayName,
            username: username,
            searchableIndex: Array.from(new Set([displayName.toLowerCase(), username.toLowerCase()])),
            photoURL: user.photoURL || null,
            coverPhotoURL: null,
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
            installedPlugins: [],
            geminiApiKey: null,
            followersCount: 0,
            followingCount: 0,
            onboardingCompleted: false, // New users always start with onboarding incomplete
        };
        await setDoc(userDocRef, defaultProfile);
        return { uid: user.uid, ...defaultProfile };

    } catch (error) {
        console.error("Failed to create/get user profile in Firestore:", error);
        throw new Error("Could not create user profile.");
    }
}

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!db) throw new Error("Firestore not initialized.");
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
};

export const saveCodingUsernames = async (userId: string, usernames: CodingUsernames): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const usernamesToSave: { [key: string]: string | undefined | null } = {};
        for (const key in usernames) {
            const typedKey = key as keyof CodingUsernames;
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

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
    const userDocRef = getUserDocRef(userId);
    const dataToUpdate: { [key: string]: any } = {};

    let needsIndexUpdate = false;

    // Construct the update object from the provided profileData
    if (profileData.displayName !== undefined) {
        dataToUpdate['displayName'] = profileData.displayName;
        needsIndexUpdate = true;
    }
    if (profileData.username !== undefined) {
        dataToUpdate['username'] = profileData.username;
        needsIndexUpdate = true;
    }
    if (profileData.photoURL !== undefined) dataToUpdate['photoURL'] = profileData.photoURL;
    if (profileData.coverPhotoURL !== undefined) dataToUpdate['coverPhotoURL'] = profileData.coverPhotoURL;
    if (profileData.bio !== undefined) dataToUpdate['bio'] = profileData.bio;
    if (profileData.socials !== undefined) dataToUpdate['socials'] = profileData.socials;
    if (profileData.statusEmoji !== undefined) dataToUpdate['statusEmoji'] = profileData.statusEmoji;
    if (profileData.countryCode !== undefined) dataToUpdate['countryCode'] = profileData.countryCode;
    if (profileData.onboardingCompleted !== undefined) dataToUpdate['onboardingCompleted'] = profileData.onboardingCompleted;

    // If username or displayName changed, fetch the document to correctly build the new index.
    if (needsIndexUpdate) {
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const currentData = docSnap.data();
                // Use the new data if it exists, otherwise fall back to the current data in Firestore.
                const newDisplayName = profileData.displayName ?? currentData.displayName;
                const newUsername = profileData.username ?? currentData.username;
                
                const indexSet = new Set<string>();
                if (newDisplayName) indexSet.add(newDisplayName.toLowerCase());
                if (newUsername) indexSet.add(newUsername.toLowerCase());

                dataToUpdate['searchableIndex'] = Array.from(indexSet);
            }
        } catch (error) {
             console.error("Could not get user doc for search index update:", error);
             throw new Error("Could not update user profile index.");
        }
    }

    try {
        await setDoc(userDocRef, dataToUpdate, { merge: true });
    } catch (error) {
        console.error("Failed to update user profile in Firestore:", error);
        throw new Error("Could not update user profile.");
    }
};


export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = getUserDocRef(userId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const dataToUpdate: {[key: string]: any} = {};
            let needsUpdate = false;

            let username = data.username;
            if (!username) {
                username = `user_${userId.substring(0, 10)}`;
                dataToUpdate.username = username;
                needsUpdate = true;
            }

            if (!data.searchableIndex) {
                 const displayName = data.displayName || 'Anonymous User';
                 dataToUpdate['searchableIndex'] = Array.from(new Set([displayName.toLowerCase(), username.toLowerCase()]));
                 needsUpdate = true;
            }

            const fieldsToDefault: (keyof PublicUserProfile)[] = ['bio', 'socials', 'statusEmoji', 'countryCode', 'photoURL', 'coverPhotoURL', 'followersCount', 'followingCount'];
            fieldsToDefault.forEach(field => {
                if (data[field] === undefined) {
                    if (field === 'socials') dataToUpdate[field] = { github: '', linkedin: '', twitter: '' };
                    else if (field === 'bio') dataToUpdate[field] = '';
                    else if (field === 'followersCount' || field === 'followingCount') dataToUpdate[field] = 0;
                    else dataToUpdate[field] = null;
                    needsUpdate = true;
                }
            });
            
            if (data.preferences === undefined) {
                dataToUpdate.preferences = { routine: [] };
                needsUpdate = true;
            }
            
            if (data.onboardingCompleted === undefined) {
                dataToUpdate.onboardingCompleted = false; // Default new users to NOT completed
                needsUpdate = true;
            }


            if (needsUpdate) {
                updateDoc(userDocRef, dataToUpdate).catch(err => {
                    console.error(`Failed to lazy-migrate profile for user ${userId}:`, err);
                });
            }

            return {
                uid: userId,
                displayName: data.displayName,
                username: username,
                photoURL: data.photoURL,
                coverPhotoURL: data.coverPhotoURL,
                bio: data.bio || '',
                socials: data.socials || { github: '', linkedin: '', twitter: '' },
                statusEmoji: data.statusEmoji || null,
                countryCode: data.countryCode || null,
                routine: data.preferences?.routine || [],
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0,
                onboardingCompleted: data.onboardingCompleted ?? false,
            } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Failed to get user profile from Firestore:", error);
        throw new Error("Could not retrieve user profile.");
    }
};

export type PublicUserProfile = {
    uid: string;
    displayName: string;
    username: string;
    photoURL: string | null;
    coverPhotoURL: string | null;
    bio: string;
    socials: SocialLinks | null;
    statusEmoji: string | null;
    countryCode: string | null;
    followersCount: number;
    followingCount: number;
}

export const getUserByUsername = async (username: string): Promise<PublicUserProfile | null> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("username", "==", username), limit(1));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        return {
            uid: userDoc.id,
            displayName: userData.displayName || 'Anonymous User',
            username: userData.username || `user_${userDoc.id.substring(0, 10)}`,
            photoURL: userData.photoURL || null,
            coverPhotoURL: userData.coverPhotoURL || null,
            bio: userData.bio || '',
            socials: userData.socials || null,
            statusEmoji: userData.statusEmoji || null,
            countryCode: userData.countryCode || null,
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
        };

    } catch (error) {
        console.error("Error getting user by username:", error);
        throw new Error("Could not retrieve user profile.");
    }
};

export type SearchedUser = {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  email: string;
};

// New function to search for users using the searchableIndex
export const searchUsers = async (searchQuery: string): Promise<SearchedUser[]> => {
  if (!db) throw new Error("Firestore is not initialized.");
  const cleanedQuery = searchQuery.toLowerCase().trim();
  
  const usersCollection = collection(db, 'users');
  let q;

  if (!cleanedQuery) {
    // If the query is empty, fetch all users (or a limited number of recent ones)
    q = query(
      usersCollection,
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  } else {
    // If there is a query, use the searchable index
    q = query(
      usersCollection,
      where('searchableIndex', 'array-contains', cleanedQuery),
      limit(10)
    );
  }

  try {
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
            uid: doc.id,
            displayName: data.displayName || 'Anonymous',
            username: data.username || '',
            email: data.email || '',
            photoURL: data.photoURL || null,
        }
    });

  } catch (error) {
    console.error("Error searching for users:", error);
    return [];
  }
};


export const saveUserFCMToken = async (userId: string, token: string): Promise<void> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const tokensCollectionRef = collection(db, 'users', userId, 'fcmTokens');
    const tokenDocRef = doc(tokensCollectionRef, token);
    try {
        await setDoc(tokenDocRef, { createdAt: new Date() });
    } catch (error) {
        console.error("Failed to save FCM token to Firestore:", error);
        throw new Error("Could not save notification token.");
    }
};

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

/**
 * Performs a "soft delete" by anonymizing user data, disabling their auth account,
 * and marking the document for future cleanup via a scheduled function.
 */
export async function anonymizeUserAccount(userId: string): Promise<void> {
    const userDocRef = doc(adminDb, 'users', userId);

    // Calculate the deletion date 30 days from now
    const deletionDate = addDays(new Date(), 30);

    // Anonymize public-facing Firestore data and set deletion status
    const anonymizedData = {
        displayName: 'Deleted User',
        username: `deleted_${userId.substring(0, 8)}`,
        photoURL: null,
        coverPhotoURL: null,
        bio: 'This account is pending deletion.',
        socials: {},
        statusEmoji: null,
        searchableIndex: [],
        geminiApiKey: null,
        deletionStatus: 'PENDING_DELETION',
        deletionScheduledAt: Timestamp.fromDate(deletionDate),
    };

    await updateDoc(userDocRef, anonymizedData);

    // Disable user in Firebase Auth using the Admin SDK
    try {
        const { getAuth } = await import('firebase-admin/auth');
        await getAuth().updateUser(userId, { disabled: true });
    } catch (error) {
        console.error(`Failed to disable auth user ${userId}:`, error);
        // Do not re-throw, as the main data has been anonymized.
        // Log this for manual review.
    }
}
    

    



'use server';

import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteField as clientDeleteField, query, where, getDocs, limit, orderBy, writeBatch } from 'firebase/firestore';
import { Timestamp, FieldValue as adminFieldValue } from 'firebase-admin/firestore';
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
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not save coding usernames.");
    };
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not retrieve coding usernames.");
    };
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not save API key to your account.");
    };
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { geminiApiKey: apiKey }, { merge: true });
    } catch (error) {
        console.error("Failed to save Gemini API key to Firestore:", error);
        throw new Error("Could not save API key to your account.");
    }
};

export const getUserGeminiApiKey = async (userId: string): Promise<string | null> => {
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not retrieve API key from your account.");
    };
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not update user profile.");
    };
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not retrieve user profile.");
    };
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
            
            const profile: UserProfile = {
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
                deletionStatus: data.deletionStatus,
            };

            if (data.deletionScheduledAt instanceof Timestamp) {
                profile.deletionScheduledAt = data.deletionScheduledAt.toDate().toISOString();
            } else if (data.deletionScheduledAt) {
                // It might already be a string if fetched and cached
                profile.deletionScheduledAt = data.deletionScheduledAt;
            }

            return profile;
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
    deletionStatus?: 'PENDING_DELETION' | 'DELETED'; // Add deletion status
}

export const getUserByUsername = async (username: string): Promise<PublicUserProfile | null> => {
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not retrieve user profile.");
    };
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("username", "==", username), limit(1));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // If the user is pending deletion, show them as "Deleted User"
        if (userData.deletionStatus === 'PENDING_DELETION' || userData.deletionStatus === 'DELETED') {
            return {
                uid: userDoc.id,
                displayName: 'Deleted User',
                username: userData.username, // Keep the username to prevent lookup issues
                photoURL: null,
                coverPhotoURL: null,
                bio: 'This account has been deleted.',
                socials: null,
                statusEmoji: null,
                countryCode: null,
                followersCount: 0,
                followingCount: 0,
                deletionStatus: userData.deletionStatus,
            };
        }

        return {
            uid: userDoc.id,
            displayName: userData.displayName || 'Anonymous User',
            username: userData.username,
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
        console.error("Firestore is not initialized.");
        throw new Error("Could not save notification token.");
    };
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not save your installed plugins.");
    };
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { installedPlugins: pluginNames }, { merge: true });
    } catch (error) {
        console.error("Failed to save installed plugins to Firestore:", error);
        throw new Error("Could not save your installed plugins.");
    }
};

export const getInstalledPlugins = async (userId: string): Promise<string[] | null> => {
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not retrieve your installed plugins.");
    };
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
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not save your preferences.");
    };
    const userDocRef = getUserDocRef(userId);
    try {
        await setDoc(userDocRef, { preferences }, { merge: true });
    } catch (error) {
        console.error("Failed to save user preferences to Firestore:", error);
        throw new Error("Could not save your preferences.");
    }
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Could not retrieve your preferences.");
    };
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

export async function anonymizeUserAccount(userId: string): Promise<void> {
    if (!adminDb) {
      throw new Error("Admin Firestore not initialized.");
    }
    const userDocRef = adminDb.collection('users').doc(userId);
    const privateDataRef = userDocRef.collection('_private').doc('profileBackup');
    const deletionDate = addDays(new Date(), 30);

    const docSnap = await userDocRef.get();
    if (!docSnap.exists) {
        throw new Error("User profile not found to anonymize.");
    }
    const currentData = docSnap.data()!;

    // Backup original data to a private subcollection
    const backupData = {
        originalDisplayName: currentData.displayName || null,
        originalPhotoURL: currentData.photoURL || null,
        originalCoverPhotoURL: currentData.coverPhotoURL || null,
        originalBio: currentData.bio || null,
        originalSocials: currentData.socials || null,
        originalStatusEmoji: currentData.statusEmoji || null,
        originalCountryCode: currentData.countryCode || null,
    };
    await privateDataRef.set(backupData);

    const anonymizedData = {
        displayName: 'Deleted User',
        photoURL: null,
        coverPhotoURL: null,
        bio: 'This account is pending deletion.',
        socials: {},
        statusEmoji: null,
        searchableIndex: [],
        deletionStatus: 'PENDING_DELETION',
        deletionScheduledAt: Timestamp.fromDate(deletionDate),
    };

    await userDocRef.update(anonymizedData);
}

export async function reclaimUserAccount(userId: string): Promise<void> {
    if (!adminDb) throw new Error("Admin Firestore not initialized.");
    
    const userDocRef = adminDb.collection('users').doc(userId);
    const privateDataRef = userDocRef.collection('_private').doc('profileBackup');

    const backupDocSnap = await privateDataRef.get();
    if (!backupDocSnap.exists) {
        throw new Error("Cannot reclaim account: Private recovery data not found.");
    }
    const backupData = backupDocSnap.data()!;
    
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists()) {
        throw new Error("User document does not exist for reclamation.");
    }
    const currentUserData = userDocSnap.data()!;

    const restoredData: any = {
        displayName: backupData.originalDisplayName,
        photoURL: backupData.originalPhotoURL,
        coverPhotoURL: backupData.originalCoverPhotoURL,
        bio: backupData.originalBio,
        socials: backupData.originalSocials,
        statusEmoji: backupData.originalStatusEmoji,
        countryCode: backupData.originalCountryCode,
        deletionStatus: adminFieldValue.delete(),
        deletionScheduledAt: adminFieldValue.delete(),
    };
    
    // Rebuild the search index
    const indexSet = new Set<string>();
    if (backupData.originalDisplayName) indexSet.add(backupData.originalDisplayName.toLowerCase());
    if (currentUserData.username) indexSet.add(currentUserData.username.toLowerCase());
    restoredData.searchableIndex = Array.from(indexSet);

    await userDocRef.update(restoredData);

    // Clean up the private recovery data
    await privateDataRef.delete();
}
    
export async function permanentlyDeleteUserData(userId: string): Promise<void> {
    if (!adminDb) throw new Error("Admin Firestore not initialized.");

    const batch = adminDb.batch();

    const collectionsToClear = [
        'activityLogs', 'careerGoals', 'careerVisions', 'dailyPlans',
        'fcmTokens', 'notifications', 'resources', 'skills', 
        'timelineEvents', 'trackedKeywords', 'followers', 'following', '_private', 'calls'
    ];

    for (const collectionName of collectionsToClear) {
        const collectionRef = adminDb.collection('users').doc(userId).collection(collectionName);
        const snapshot = await collectionRef.get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    
    const chatsCollectionRef = adminDb.collection('users').doc(userId).collection('chats');
    const chatsSnapshot = await chatsCollectionRef.get();
    for (const chatDoc of chatsSnapshot.docs) {
        const messagesCollectionRef = chatDoc.ref.collection('messages');
        const messagesSnapshot = await messagesCollectionRef.get();
        messagesSnapshot.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
        batch.delete(chatDoc.ref);
    }
    
    const streakDocRef = adminDb.collection('streaks').doc(userId);
    batch.delete(streakDocRef);

    // Get the current user data to preserve uid, email, and username
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();
    const userData = userDocSnap.data();

    // Create a new object with only the fields to keep
    const finalUserData = {
      uid: userId, // This is not a field, but for clarity
      email: userData?.email || null,
      username: userData?.username || `user_${userId.substring(0, 10)}`,
      deletionStatus: 'DELETED',
    };

    // Overwrite the entire document with only the preserved fields
    batch.set(userDocRef, finalUserData);

    await batch.commit();
}


    

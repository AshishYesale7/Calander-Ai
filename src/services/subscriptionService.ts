
'use server';

import { db } from '@/lib/firebase';
import type { UserSubscription } from '@/types';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';

export const updateUserSubscriptionStatus = async (
  userId: string,
  subscriptionData: UserSubscription
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const userDocRef = doc(db, 'users', userId);

  // Convert Date to Firestore Timestamp for storing
  const dataToSave = {
    subscription: {
        ...subscriptionData,
        endDate: Timestamp.fromDate(subscriptionData.endDate),
    }
  };

  // Use setDoc with merge: true to add/update the subscription field without overwriting the whole document
  await setDoc(userDocRef, dataToSave, { merge: true });
};

export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data().subscription) {
        const sub = docSnap.data().subscription;
        // Convert timestamp back to date
        return {
            ...sub,
            endDate: (sub.endDate as Timestamp).toDate(),
        } as UserSubscription;
    } else {
        // User exists but has no subscription, or user doc doesn't exist yet.
        // Create a new 7-day trial subscription.
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const newTrialSubscription: UserSubscription = {
            status: 'trial',
            endDate: trialEndDate,
        };
        
        try {
            // Save it to the database for this user, but don't let a failure block the user.
            await updateUserSubscriptionStatus(userId, newTrialSubscription);
        } catch (error) {
            console.warn(`Could not save new trial subscription for user ${userId} to Firestore. The user will have a trial for this session only. Error:`, error);
        }
        
        // Always return the newly created trial subscription object so the UI is not blocked
        return newTrialSubscription;
    }
};

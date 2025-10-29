
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Layouts } from 'react-grid-layout';

const getLayoutDocRef = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  // Store layout settings in a specific sub-collection for user settings
  return doc(db, 'userSettings', userId);
};

/**
 * Saves the dashboard layout to Firestore for a specific user.
 * @param userId The ID of the user.
 * @param layouts The layouts object to save for all breakpoints.
 */
export const saveLayout = async (userId: string, layouts: Layouts): Promise<void> => {
  if (!userId) return;
  const layoutDocRef = getLayoutDocRef(userId);
  try {
    // We merge the data to avoid overwriting other settings in the same document
    await setDoc(layoutDocRef, { dashboardLayouts: layouts }, { merge: true });
  } catch (error) {
    console.error("Failed to save layout to Firestore:", error);
    // We don't want to throw an error that crashes the UI for a non-critical save
    throw new Error("Could not save layout to cloud.");
  }
};

/**
 * Retrieves the dashboard layout from Firestore for a specific user.
 * @param userId The ID of the user.
 * @returns The saved layouts object or null if it doesn't exist.
 */
export const getLayout = async (userId: string): Promise<Layouts | null> => {
  if (!userId) return null;
  const layoutDocRef = getLayoutDocRef(userId);
  try {
    const docSnap = await getDoc(layoutDocRef);
    if (docSnap.exists() && docSnap.data().dashboardLayouts) {
      return docSnap.data().dashboardLayouts as Layouts;
    }
    return null;
  } catch (error) {
    console.error("Failed to get layout from Firestore:", error);
    throw new Error("Could not retrieve layout from cloud.");
  }
};

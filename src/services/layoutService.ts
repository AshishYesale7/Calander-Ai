
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Layout } from 'react-grid-layout';

const getLayoutDocRef = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  // We can store layout settings in a specific sub-collection or a single doc
  return doc(db, 'userSettings', userId);
};

/**
 * Saves the dashboard layout to Firestore for a specific user.
 * @param userId The ID of the user.
 * @param layout The layout array to save.
 */
export const saveLayout = async (userId: string, layout: Layout[]): Promise<void> => {
  if (!userId) return;
  const layoutDocRef = getLayoutDocRef(userId);
  try {
    // We merge the data to avoid overwriting other settings in the same document
    await setDoc(layoutDocRef, { dashboardLayout: layout }, { merge: true });
  } catch (error) {
    console.error("Failed to save layout to Firestore:", error);
    // We don't want to throw an error that crashes the UI for a non-critical save
    // The calling component will handle user notification
    throw error;
  }
};

/**
 * Retrieves the dashboard layout from Firestore for a specific user.
 * @param userId The ID of the user.
 * @returns The saved layout array or null if it doesn't exist.
 */
export const getLayout = async (userId: string): Promise<Layout[] | null> => {
  if (!userId) return null;
  const layoutDocRef = getLayoutDocRef(userId);
  try {
    const docSnap = await getDoc(layoutDocRef);
    if (docSnap.exists() && docSnap.data().dashboardLayout) {
      return docSnap.data().dashboardLayout as Layout[];
    }
    return null;
  } catch (error) {
    console.error("Failed to get layout from Firestore:", error);
    throw error;
  }
};

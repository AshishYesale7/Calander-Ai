
'use server';

import { db } from '@/lib/firebase';
import type { DailyPlan } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const getDailyPlanDocRef = (userId: string, dateStr: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  // Use date string like '2024-05-01' as the document ID
  return doc(db, 'users', userId, 'dailyPlans', dateStr);
};

/**
 * Saves a generated daily plan to Firestore for a specific user and date.
 * @param userId The ID of the user.
 * @param dateStr The date string in 'yyyy-MM-dd' format.
 * @param plan The daily plan object to save.
 */
export const saveDailyPlan = async (userId: string, dateStr: string, plan: DailyPlan): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const planDocRef = getDailyPlanDocRef(userId, dateStr);
  try {
    await setDoc(planDocRef, plan);
  } catch (error) {
    console.error("Failed to save daily plan to Firestore:", error);
    throw new Error("Could not save the generated plan.");
  }
};

/**
 * Retrieves a saved daily plan from Firestore for a specific user and date.
 * @param userId The ID of the user.
 * @param dateStr The date string in 'yyyy-MM-dd' format.
 * @returns The saved DailyPlan object or null if it doesn't exist.
 */
export const getDailyPlan = async (userId: string, dateStr: string): Promise<DailyPlan | null> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const planDocRef = getDailyPlanDocRef(userId, dateStr);
  try {
    const docSnap = await getDoc(planDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyPlan;
    }
    return null;
  } catch (error) {
    console.error("Failed to get daily plan from Firestore:", error);
    throw new Error("Could not retrieve the daily plan.");
  }
};

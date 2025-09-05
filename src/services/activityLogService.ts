
'use server';

import { db } from '@/lib/firebase';
import type { ActivityLog } from '@/types';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';

const getActivityLogCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'activityLogs');
};

/**
 * Logs a new user activity to Firestore.
 */
export const logUserActivity = async (
  userId: string,
  type: ActivityLog['type'],
  details: ActivityLog['details']
): Promise<void> => {
  const activityLogCollection = getActivityLogCollection(userId);
  try {
    await addDoc(activityLogCollection, {
      userId,
      type,
      details,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to log user activity:", error);
    // We don't throw here as logging is a background task and shouldn't block the UI
  }
};

const fromFirestore = (doc: any): ActivityLog => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        details: data.details,
        timestamp: (data.timestamp as Timestamp).toDate(),
    };
};

/**
 * Retrieves user activity logs within a specified date range.
 */
export const getUserActivity = async (userId: string, startDate: Date, endDate: Date): Promise<ActivityLog[]> => {
  const activityLogCollection = getActivityLogCollection(userId);
  const q = query(
    activityLogCollection,
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'asc')
  );

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Failed to get user activity from Firestore:", error);
    throw new Error("Could not retrieve user activity.");
  }
};

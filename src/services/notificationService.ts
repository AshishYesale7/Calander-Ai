
'use server';

import { db } from '@/lib/firebase';
import type { AppNotification } from '@/types';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const getNotificationsCollection = (userId: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
  return collection(db, 'users', userId, 'notifications');
};

const fromFirestore = (docData: any): AppNotification => {
  const data = docData.data();
  return {
    id: docData.id,
    type: data.type,
    message: data.message,
    link: data.link,
    isRead: data.isRead || false,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
};

export const createNotification = async (
  userId: string,
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  const notificationsCollection = getNotificationsCollection(userId);
  try {
    await addDoc(notificationsCollection, {
      ...notification,
      isRead: false,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Non-critical, so we don't throw
  }
};

export const getNotifications = async (userId: string, count: number = 20): Promise<AppNotification[]> => {
  const notificationsCollection = getNotificationsCollection(userId);
  const q = query(notificationsCollection, orderBy('createdAt', 'desc'), limit(count));

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const notifDocRef = doc(db, 'users', userId, 'notifications', notificationId);
    try {
        await updateDoc(notifDocRef, { isRead: true });
    } catch(error) {
        console.error("Failed to mark notification as read:", error);
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const notificationsCollection = getNotificationsCollection(userId);
    const q = query(notificationsCollection, where("isRead", "==", false));
    
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
    }
}

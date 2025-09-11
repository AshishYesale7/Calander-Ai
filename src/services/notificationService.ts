
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
import { sendNotification } from '@/ai/flows/send-notification-flow';

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
    imageUrl: data.imageUrl,
  };
};

export const createNotification = async (
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  // Correctly get the userId from the passed notification object
  const userId = notification.userId;
  if (!userId) {
    console.error("Cannot create notification without a userId.");
    return;
  }

  const notificationsCollection = getNotificationsCollection(userId);
  try {
    // 1. Save the notification to Firestore for the in-app panel
    await addDoc(notificationsCollection, {
      ...notification,
      isRead: false,
      createdAt: Timestamp.now(),
    });

    // 2. After saving, trigger the push notification
    await sendNotification({
        userId: userId,
        title: notification.type === 'new_follower' ? 'New Follower!' : 'New Notification',
        body: notification.message,
        url: notification.link,
    });

  } catch (error) {
    console.error("Failed to create notification and/or send push notification:", error);
    // We don't throw here as logging is a background task and shouldn't block the UI
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

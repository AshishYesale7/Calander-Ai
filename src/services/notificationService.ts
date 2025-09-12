
'use server';

import { db } from '@/lib/firebase';
import type { AppNotification } from '@/types';
import {
  collection,
  addDoc,
  query,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  doc,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { sendWebPushNotification } from '@/ai/flows/send-notification-flow';
import { logUserActivity } from './activityLogService';

const getNotificationsCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  if (!userId || typeof userId !== 'string') {
    console.error("Invalid userId passed to getNotificationsCollection:", userId);
    throw new Error("Invalid userId provided.");
  }
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
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { userId: string }
): Promise<void> => {
  const { userId, type, message, link, imageUrl } = notification;
  if (!userId || typeof userId !== 'string') {
    console.error("Cannot create notification without a valid userId.");
    return;
  }

  const notificationsCollection = getNotificationsCollection(userId);
  try {
    // 1. Create the in-app notification document in Firestore.
    const docRef = await addDoc(notificationsCollection, {
      type,
      message,
      link,
      imageUrl,
      isRead: false,
      createdAt: Timestamp.now(),
    });

    // 2. Log this autonomous activity
    await logUserActivity(userId, 'notification_sent', {
        id: docRef.id,
        title: message,
    });

    // 3. Trigger the web push notification.
    await sendWebPushNotification({
        userId: userId,
        title: type === 'new_follower' ? 'New Follower!' : 'New Reminder',
        body: message,
        url: link || '/',
        icon: imageUrl || undefined,
    });
    
  } catch (error) {
    console.error("Failed to create and send notification:", error);
    // Don't re-throw here, as creating the in-app notification might have succeeded.
    // The error is logged on the server.
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

export const clearAllNotifications = async (userId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    const notificationsCollection = getNotificationsCollection(userId);
    
    try {
        const snapshot = await getDocs(notificationsCollection);
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Failed to clear all notifications:", error);
        throw new Error("Could not clear notifications.");
    }
};

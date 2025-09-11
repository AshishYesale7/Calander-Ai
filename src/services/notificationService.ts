
'use server';

import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin'; // Use adminDb for server-side operations
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
} from 'firebase/firestore';

const getNotificationsCollection = (userId: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
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
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  const userId = notification.userId;
  if (!userId || typeof userId !== 'string') {
    console.error("Cannot create notification without a valid userId.");
    return;
  }

  const notificationsCollection = getNotificationsCollection(userId);
  try {
    await addDoc(notificationsCollection, {
      ...notification,
      isRead: false,
      createdAt: Timestamp.now(),
    });

    // After saving to Firestore, trigger the push notification via FCM
    const tokensCollectionRef = adminDb.collection('users').doc(userId).collection('fcmTokens');
    const tokensSnapshot = await tokensCollectionRef.get();
    
    if (tokensSnapshot.empty) {
      console.log(`No FCM tokens found for user ${userId}. Skipping push notification.`);
      return;
    }

    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    
    const messagePayload = {
      notification: {
        title: notification.type === 'new_follower' ? 'New Follower!' : 'New Notification',
        body: notification.message,
        icon: notification.imageUrl || '/logos/calendar-ai-logo-192.png',
      },
      webpush: {
        fcm_options: {
          link: notification.link || '/',
        },
      },
      tokens: tokens,
    };

    const { getMessaging } = await import('firebase-admin/messaging');
    await getMessaging().sendMulticast(messagePayload as any);
    
  } catch (error) {
    console.error("Failed to create and send notification:", error);
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

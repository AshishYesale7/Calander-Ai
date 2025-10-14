
'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  where,
  limit,
} from 'firebase/firestore';
import type { ChatMessage, CallData } from '@/types';

/**
 * Listens for real-time messages in a user's specific copy of a chat room.
 * @param currentUserId The ID of the current user.
 * @param otherUserId The ID of the other user in the chat.
 * @param callback A function to be called with the array of messages whenever they update.
 * @returns An unsubscribe function to stop listening to updates.
 */
export const subscribeToMessages = (
  currentUserId: string,
  otherUserId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return () => {};
  }

  const messagesCollection = collection(db, 'users', currentUserId, 'recentChats', otherUserId, 'messages');
  const q = query(messagesCollection, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate(),
        type: 'message' as const,
      } as ChatMessage));
    callback(messages);
  }, (error) => {
      console.error("Error listening to chat messages:", error);
  });

  return unsubscribe;
};

/**
 * Listens for real-time call history for a specific user.
 * @param userId The ID of the user whose call history is being fetched.
 * @param callback A function to be called with the array of calls whenever they update.
 * @returns An unsubscribe function to stop listening to updates.
 */
export const subscribeToCallHistory = (
  userId: string,
  callback: (calls: CallData[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return () => {};
  }
  
  const callsCollectionRef = collection(db, 'users', userId, 'callHistory');
  const q = query(
    callsCollectionRef, 
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const calls = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date();

        return {
          id: doc.id,
          ...data,
          timestamp,
          type: 'call' as const,
        };
      }) as CallData[];
      
    callback(calls);
  }, (error) => {
    console.error("Error listening to call history:", error);
  });

  return unsubscribe;
};


import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  where,
} from 'firebase/firestore';
import type { ChatMessage, CallData } from '@/types';

/**
 * Creates a unique chat room ID for two users.
 * @param userId1 The ID of the first user.
 * @param userId2 The ID of the second user.
 * @returns A unique string ID for the chat room.
 */
export const getChatRoomId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Listens for real-time messages in a chat room.
 * This function is intended to be called from client-side components.
 * @param currentUserId The ID of the current user.
 * @param otherUserId The ID of the other user in the chat.
 * @param callback A function to be called with the array of messages whenever they update.
 * @returns An unsubscribe function to stop listening to updates.
 */
export const getMessages = (
  currentUserId: string,
  otherUserId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return () => {}; // Return a no-op unsubscribe function
  }

  const chatRoomId = getChatRoomId(currentUserId, otherUserId);
  const messagesCollection = collection(db, 'chats', chatRoomId, 'messages');
  const q = query(messagesCollection, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      text: doc.data().text,
      senderId: doc.data().senderId,
      timestamp: (doc.data().timestamp as Timestamp).toDate(),
      type: 'message' as const, // Add type differentiator
    }));
    callback(messages);
  }, (error) => {
      console.error("Error listening to chat messages:", error);
      // You might want to handle this error in the UI
  });

  return unsubscribe;
};

/**
 * Listens for real-time call history between two users.
 */
export const getCallHistory = (
  userId1: string,
  userId2: string,
  callback: (calls: CallData[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return () => {};
  }
  
  const callsCollectionRef = collection(db, 'calls');
  const participantIds = [userId1, userId2].sort();

  // This query finds all calls where both users were participants
  // NOTE: Firestore does not support array-contains-all, so we use two array-contains queries.
  // This requires participantIds to be sorted consistently.
  const q = query(
    callsCollectionRef,
    where('participantIds', '==', participantIds),
    orderBy('createdAt', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Ensure endedAt exists and is a timestamp before converting
        const endedAt = data.endedAt ? (data.endedAt as Timestamp).toDate() : undefined;
        const createdAt = (data.createdAt as Timestamp).toDate();

        let duration;
        if (endedAt) {
          duration = Math.floor((endedAt.getTime() - createdAt.getTime()) / 1000);
        }

        return {
          id: doc.id,
          ...data,
          createdAt,
          endedAt,
          duration,
          timestamp: endedAt || createdAt, // Use endedAt for sorting if available, else createdAt
          type: 'call' as const, // Add type differentiator
        };
      })
      .filter(call => call.status === 'ended' || call.status === 'declined') as CallData[];
      
    callback(calls);
  }, (error) => {
    console.error("Error listening to call history:", error);
  });

  return unsubscribe;
};

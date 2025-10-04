'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { ChatMessage } from '@/types';

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
 * Sends a message from one user to another.
 * @param senderId The ID of the user sending the message.
 * @param receiverId The ID of the user receiving the message.
 * @param text The content of the message.
 */
export const sendMessage = async (senderId: string, receiverId: string, text: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!text.trim()) return;

  const chatRoomId = getChatRoomId(senderId, receiverId);
  const messagesCollection = collection(db, 'chats', chatRoomId, 'messages');

  await addDoc(messagesCollection, {
    text: text,
    senderId: senderId,
    timestamp: Timestamp.now(),
  });
};

/**
 * Listens for real-time messages in a chat room.
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
    }));
    callback(messages);
  });

  return unsubscribe;
};

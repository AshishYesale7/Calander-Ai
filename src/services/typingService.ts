
'use client';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getChatRoomId } from './chatService';

const getTypingDocRef = (currentUserId: string, otherUserId: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
  const chatRoomId = getChatRoomId(currentUserId, otherUserId);
  return doc(db, 'chats', chatRoomId, 'typing', currentUserId);
};

const getOtherUserTypingDocRef = (currentUserId: string, otherUserId: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
  const chatRoomId = getChatRoomId(currentUserId, otherUserId);
  // We listen to the *other* user's typing status document
  return doc(db, 'chats', chatRoomId, 'typing', otherUserId);
};

/**
 * Updates the current user's typing status in Firestore.
 * @param currentUserId The ID of the user who is typing.
 * @param otherUserId The ID of the other user in the chat.
 * @param isTyping A boolean indicating if the user is typing.
 */
export async function updateTypingStatus(
  currentUserId: string,
  otherUserId: string,
  isTyping: boolean
): Promise<void> {
  const typingDocRef = getTypingDocRef(currentUserId, otherUserId);
  try {
    await setDoc(typingDocRef, {
      isTyping,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to update typing status:", error);
  }
}

/**
 * Listens for real-time typing status of the other user in a chat.
 * @param currentUserId The ID of the current user.
 * @param otherUserId The ID of the other user in the chat.
 * @param callback A function to be called with the typing status (boolean).
 * @returns An unsubscribe function to stop listening to updates.
 */
export const listenForTyping = (
  currentUserId: string,
  otherUserId: string,
  callback: (isTyping: boolean) => void
): Unsubscribe => {
  const typingDocRef = getOtherUserTypingDocRef(currentUserId, otherUserId);

  const unsubscribe = onSnapshot(typingDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const fiveSecondsAgo = Timestamp.now().seconds - 5;
      
      // The user is considered "typing" if the flag is true AND the update was within the last 5 seconds.
      const isCurrentlyTyping = data.isTyping && data.timestamp.seconds > fiveSecondsAgo;
      callback(isCurrentlyTyping);

    } else {
      // If the document doesn't exist, they are not typing.
      callback(false);
    }
  }, (error) => {
    console.error("Error listening to typing status:", error);
    callback(false);
  });

  return unsubscribe;
};

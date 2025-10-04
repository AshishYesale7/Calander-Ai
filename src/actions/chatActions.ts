
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

// This helper function is duplicated here to keep the server action self-contained.
const getChatRoomId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Sends a message from one user to another. This is a Server Action.
 * @param senderId The ID of the user sending the message.
 * @param receiverId The ID of the user receiving the message.
 * @param text The content of the message.
 */
export const sendMessage = async (senderId: string, receiverId: string, text: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!senderId || !receiverId) throw new Error("Sender and Receiver IDs are required.");
  if (!text.trim()) return;

  const chatRoomId = getChatRoomId(senderId, receiverId);
  const messagesCollection = collection(db, 'chats', chatRoomId, 'messages');

  try {
    await addDoc(messagesCollection, {
        text: text,
        senderId: senderId,
        timestamp: Timestamp.now(),
    });
  } catch(error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message.");
  }
};

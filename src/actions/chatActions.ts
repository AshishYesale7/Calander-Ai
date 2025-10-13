
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc
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
        isDeleted: false,
        isEdited: false,
    });
  } catch(error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message.");
  }
};

/**
 * Deletes a message for all users. This is a Server Action.
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 * @param messageId The ID of the message to delete.
 */
export const deleteMessage = async (currentUserId: string, otherUserId: string, messageId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const chatRoomId = getChatRoomId(currentUserId, otherUserId);
    const messageRef = doc(db, 'chats', chatRoomId, 'messages', messageId);

    // For a "delete for everyone" feature, we can either truly delete the document
    // or update it with a "deleted" flag. Updating is often better for preserving
    // conversation flow and allowing for "This message was deleted" placeholders.
    try {
        await updateDoc(messageRef, {
            text: 'This message was deleted.',
            isDeleted: true,
        });
        // Or, to permanently delete:
        // await deleteDoc(messageRef);
    } catch(error) {
        console.error("Error deleting message:", error);
        throw new Error("Failed to delete message.");
    }
}

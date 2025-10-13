
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion
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
        deletedFor: [],
    });
  } catch(error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message.");
  }
};

/**
 * Deletes a message for the current user or for everyone. This is a Server Action.
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 * @param messageId The ID of the message to delete.
 * @param mode Determines if the deletion is for 'me' or 'everyone'.
 */
export const deleteMessage = async (currentUserId: string, otherUserId: string, messageId: string, mode: 'me' | 'everyone'): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const chatRoomId = getChatRoomId(currentUserId, otherUserId);
    const messageRef = doc(db, 'chats', chatRoomId, 'messages', messageId);

    try {
        if (mode === 'everyone') {
            await updateDoc(messageRef, {
                text: 'This message was deleted.',
                isDeleted: true,
                deletedFor: [], // Clear individual deletes if it's deleted for everyone
            });
        } else if (mode === 'me') {
            // Add the current user's ID to the `deletedFor` array.
            // arrayUnion ensures no duplicates are added.
            await updateDoc(messageRef, {
                deletedFor: arrayUnion(currentUserId),
            });
        }
    } catch(error) {
        console.error("Error deleting message:", error);
        throw new Error("Failed to delete message.");
    }
}

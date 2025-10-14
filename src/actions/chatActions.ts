
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  query,
  where
} from 'firebase/firestore';

// This helper function is duplicated here to keep the server action self-contained.
const getChatRoomId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Sends a message from one user to another. This is a Server Action.
 * It writes the message to both the sender's and receiver's copy of the chat.
 * @param senderId The ID of the user sending the message.
 * @param receiverId The ID of the user receiving the message.
 * @param text The content of the message.
 */
export const sendMessage = async (senderId: string, receiverId: string, text: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!senderId || !receiverId) throw new Error("Sender and Receiver IDs are required.");
  if (!text.trim()) return;

  const timestamp = Timestamp.now();
  const messageData = {
      text: text,
      senderId: senderId,
      timestamp: timestamp,
      isDeleted: false,
      isEdited: false,
      deletedFor: [],
  };

  try {
    const batch = writeBatch(db);

    // 1. Add message to sender's chat collection
    const senderMessagesCol = collection(db, 'users', senderId, 'recentChats', receiverId, 'messages');
    const senderMessageRef = doc(senderMessagesCol);
    batch.set(senderMessageRef, messageData);
    
    // 2. Add message to receiver's chat collection
    const receiverMessagesCol = collection(db, 'users', receiverId, 'recentChats', senderId, 'messages');
    const receiverMessageRef = doc(receiverMessagesCol);
    batch.set(receiverMessageRef, messageData);
    
    // 3. Update the recent chat metadata for both users
    const recentChatSenderRef = doc(db, 'users', senderId, 'recentChats', receiverId);
    const recentChatReceiverRef = doc(db, 'users', receiverId, 'recentChats', senderId);
    
    const recentChatUpdate = {
        lastMessage: text,
        timestamp: serverTimestamp(),
    };

    batch.set(recentChatSenderRef, recentChatUpdate, { merge: true });
    batch.set(recentChatReceiverRef, recentChatUpdate, { merge: true });

    await batch.commit();

  } catch(error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message.");
  }
};

/**
 * Deletes a message for the current user or for everyone.
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 * @param messageId The ID of the message to delete.
 * @param mode Determines if the deletion is for 'me' or 'everyone'.
 */
export const deleteMessage = async (currentUserId: string, otherUserId: string, messageId: string, mode: 'me' | 'everyone'): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const currentUserMessagesCol = collection(db, 'users', currentUserId, 'recentChats', otherUserId, 'messages');
    const messageRef = doc(currentUserMessagesCol, messageId);

    try {
        if (mode === 'everyone') {
            // If deleting for everyone, we must also delete it from the other user's collection.
            const otherUserMessagesCol = collection(db, 'users', otherUserId, 'recentChats', currentUserId, 'messages');
            const otherMessageRef = doc(otherUserMessagesCol, messageId);
            
            const batch = writeBatch(db);
            // In a real "delete for everyone", you might update the text instead of deleting.
            // For simplicity here, we'll just delete both copies.
            batch.delete(messageRef);
            batch.delete(otherMessageRef);
            await batch.commit();

        } else if (mode === 'me') {
            // "Delete for me" only deletes it from the current user's collection.
            await deleteDoc(messageRef);
        }
    } catch(error) {
        console.error("Error deleting message:", error);
        throw new Error("Failed to delete message.");
    }
}


/**
 * Deletes an entire conversation history for the current user only.
 * This is now a simple and robust operation.
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 */
export const deleteConversationForCurrentUser = async (currentUserId: string, otherUserId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");

    const batch = writeBatch(db);

    try {
        // 1. Delete the conversation metadata from the current user's recent chats.
        const recentChatRef = doc(db, 'users', currentUserId, 'recentChats', otherUserId);
        batch.delete(recentChatRef);
        
        // 2. Delete all messages within that user's copy of the conversation.
        const messagesCollectionRef = collection(db, 'users', currentUserId, 'recentChats', otherUserId, 'messages');
        const messagesSnapshot = await getDocs(messagesCollectionRef);
        messagesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 3. Delete all call logs within that user's copy of the history.
        const callsCollectionRef = collection(db, 'users', currentUserId, 'callHistory');
        const callsQuery = query(callsCollectionRef, where('otherUserId', '==', otherUserId));
        const callsSnapshot = await getDocs(callsQuery);
        callsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

    } catch (error) {
        console.error("Error deleting conversation for user:", error);
        throw new Error("Failed to delete conversation from your view.");
    }
};

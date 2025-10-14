
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

/**
 * Sends a message from one user to another.
 * This performs a batch write to create a copy of the message in both the sender's and receiver's chat collections.
 * It also updates the metadata for the recent chat for both users.
 * @param senderId The ID of the user sending the message.
 * @param receiverId The ID of the user receiving the message.
 * @param text The content of the message.
 */
export const sendMessage = async (senderId: string, receiverId: string, text: string): Promise<void> => {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!senderId || !receiverId) throw new Error("Sender and Receiver IDs are required.");
  if (!text.trim()) return;

  const timestamp = Timestamp.now();
  
  // Define a consistent message ID for both copies
  const senderMessageRef = doc(collection(db, 'users', senderId, 'chats', receiverId, 'messages'));
  const messageId = senderMessageRef.id;

  const messageData = {
      id: messageId,
      text: text,
      senderId: senderId,
      timestamp: timestamp,
      type: 'message' as const,
  };

  try {
    const batch = writeBatch(db);

    // 1. Add message to sender's chat collection
    batch.set(senderMessageRef, messageData);
    
    // 2. Add message to receiver's chat collection with the same ID
    const receiverMessageRef = doc(db, 'users', receiverId, 'chats', senderId, 'messages', messageId);
    batch.set(receiverMessageRef, messageData);
    
    // 3. Update recent chat metadata for both users
    const recentChatSenderRef = doc(db, 'users', senderId, 'chats', receiverId);
    const recentChatReceiverRef = doc(db, 'users', receiverId, 'chats', senderId);
    
    const recentChatUpdate = {
        lastMessage: text,
        timestamp: timestamp, // Use the exact same timestamp
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
 */
export const deleteMessage = async (
    currentUserId: string,
    otherUserId: string,
    messageId: string,
    mode: 'me' | 'everyone'
): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    if (mode === 'everyone') {
        const batch = writeBatch(db);
        const updateEveryone = {
            text: "This message was deleted",
            isDeleted: true,
        };
        // Mark as deleted in current user's chat
        const currentUserMsgRef = doc(db, 'users', currentUserId, 'chats', otherUserId, 'messages', messageId);
        batch.update(currentUserMsgRef, updateEveryone);
        
        // Mark as deleted in other user's chat
        const otherUserMsgRef = doc(db, 'users', otherUserId, 'chats', currentUserId, 'messages', messageId);
        batch.update(otherUserMsgRef, updateEveryone);
        
        await batch.commit();

    } else { // mode === 'me'
        // For "me", we just perform a hard delete on the user's copy of the message.
        const currentUserMsgRef = doc(db, 'users', currentUserId, 'chats', otherUserId, 'messages', messageId);
        await deleteDoc(currentUserMsgRef);
    }
};


/**
 * Deletes an entire conversation history and call logs for the current user only.
 * This is a one-sided operation and does not affect the other user's data.
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 */
export const deleteConversationForCurrentUser = async (currentUserId: string, otherUserId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");

    const batch = writeBatch(db);

    // 1. Delete the top-level chat document, which contains metadata like lastMessage.
    const recentChatRef = doc(db, 'users', currentUserId, 'chats', otherUserId);
    batch.delete(recentChatRef);
    
    // 2. Delete the corresponding call history for that user.
    const callsCollectionRef = collection(db, 'users', currentUserId, 'calls');
    const callQuery = query(callsCollectionRef, where('callerId', '==', otherUserId), where('receiverId', '==', currentUserId));
    const callQuery2 = query(callsCollectionRef, where('callerId', '==', currentUserId), where('receiverId', '==', otherUserId));
    
    try {
        const [callDocs1, callDocs2] = await Promise.all([getDocs(callQuery), getDocs(callQuery2)]);
        callDocs1.forEach(doc => batch.delete(doc.ref));
        callDocs2.forEach(doc => batch.delete(doc.ref));

        await batch.commit();

        // NOTE: The deletion of the `messages` subcollection should be handled by a scheduled Cloud Function
        // to avoid high read/write costs on the client for large conversations. This server action
        // only deletes the entry points to the conversation from the user's side.
    } catch (error) {
        console.error("Error deleting conversation metadata and calls:", error);
        throw new Error("Failed to delete conversation from your view.");
    }
};

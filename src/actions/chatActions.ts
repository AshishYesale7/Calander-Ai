
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
 * This function will delete the chat metadata, all messages in the subcollection,
 * and all associated call logs.
 */
export const deleteConversationForCurrentUser = async (currentUserId: string, otherUserId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    if (!currentUserId || !otherUserId) throw new Error("User IDs are required.");

    const batch = writeBatch(db);

    // 1. Delete all messages in the subcollection
    const messagesCollectionRef = collection(db, 'users', currentUserId, 'chats', otherUserId, 'messages');
    const messagesSnapshot = await getDocs(messagesCollectionRef);
    messagesSnapshot.forEach(doc => batch.delete(doc.ref));

    // 2. Query and delete all associated call logs from the user's call history
    const callsCollectionRef = collection(db, 'users', currentUserId, 'calls');
    const callQuery = query(callsCollectionRef, where('otherUser.uid', '==', otherUserId));
    const callSnapshot = await getDocs(callQuery);
    callSnapshot.forEach(doc => batch.delete(doc.ref));

    // 3. Instead of deleting the chat document, clear the last message to reset the preview.
    const recentChatRef = doc(db, 'users', currentUserId, 'chats', otherUserId);
    batch.update(recentChatRef, {
      lastMessage: 'Chat history cleared.',
      timestamp: serverTimestamp(),
    });
    
    try {
        // Commit all deletions at once.
        await batch.commit();
        
    } catch (error) {
        console.error("Error clearing conversation and related data:", error);
        throw new Error("Failed to clear the conversation completely.");
    }
};

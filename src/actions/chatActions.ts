
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
      deletedFor: [], // For "delete for me" functionality
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
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 * @param messageId The ID of the message to delete.
 * @param mode Determines if the deletion is for 'me' or 'everyone'.
 */
export const deleteMessage = async (
    currentUserId: string,
    otherUserId: string,
    messageId: string,
    mode: 'me' | 'everyone'
): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const batch = writeBatch(db);

    // Reference to the message in the current user's chat
    const currentUserMsgRef = doc(db, 'users', currentUserId, 'chats', otherUserId, 'messages', messageId);
    
    if (mode === 'everyone') {
        // For "everyone", we mark both documents as deleted (soft delete).
        // This is safer than hard deletion to prevent sync issues if one user is offline.
        const updateEveryone = {
            text: "This message was deleted",
            isDeleted: true,
        };
        // Get reference to the message in the other user's chat
        const otherUserMsgRef = doc(db, 'users', otherUserId, 'chats', currentUserId, 'messages', messageId);
        batch.update(currentUserMsgRef, updateEveryone);
        batch.update(otherUserMsgRef, updateEveryone);

    } else { // mode === 'me'
        // For "me", we just add the current user's ID to their copy's `deletedFor` array.
        // The client-side subscription will then filter this out from view.
        const docSnap = await getDoc(currentUserMsgRef);
        if (docSnap.exists()) {
            const currentDeletedFor = docSnap.data().deletedFor || [];
            if (!currentDeletedFor.includes(currentUserId)) {
                const updatedDeletedFor = [...currentDeletedFor, currentUserId];
                batch.update(currentUserMsgRef, { deletedFor: updatedDeletedFor });
            }
        }
    }
    
    try {
        await batch.commit();
    } catch (error) {
        console.error("Error deleting message:", error);
        throw new Error("Failed to delete message.");
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

    // This is a simplified operation because we are now only deleting the top-level chat document,
    // and its subcollections will be handled by a Cloud Function for cleanup to avoid large client-side operations.
    const recentChatRef = doc(db, 'users', currentUserId, 'chats', otherUserId);
    batch.delete(recentChatRef);
    
    // It's also safe to delete the corresponding call history directly
    const callsCollectionRef = collection(db, 'users', currentUserId, 'calls');
    const callDocsToDelete = await getDocs(query(callsCollectionRef, where('otherUser.uid', '==', otherUserId)));
    callDocsToDelete.forEach(doc => batch.delete(doc.ref));

    try {
        await batch.commit();
        // A Cloud Function with "Recursive Delete" should be set up to clean up the 'messages' subcollection.
        // This prevents the client from having to read all documents to delete them, which is slow and costly.
    } catch (error) {
        console.error("Error deleting conversation metadata:", error);
        throw new Error("Failed to delete conversation from your view.");
    }
};

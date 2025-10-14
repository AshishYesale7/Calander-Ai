
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  serverTimestamp,
  getDocs,
  query,
  where,
  getDoc,
} from 'firebase/firestore';

/**
 * Sends a message from one user to another. It writes the message to both the sender's and receiver's copy of the chat.
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
      deletedFor: [], // Initialize for "delete for me" functionality
  };

  try {
    const batch = writeBatch(db);

    // 1. Add message to sender's chat collection
    const senderMessagesCol = collection(db, 'users', senderId, 'recentChats', receiverId, 'messages');
    // Use a consistent ID for both documents to make "delete for everyone" possible
    const messageDocRef = doc(senderMessagesCol); 
    batch.set(messageDocRef, messageData);
    
    // 2. Add message to receiver's chat collection using the same ID
    const receiverMessagesCol = collection(db, 'users', receiverId, 'recentChats', senderId, 'messages');
    const receiverMessageRef = doc(receiverMessagesCol, messageDocRef.id); // Use the same ID
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
export const deleteMessage = async (
    currentUserId: string,
    otherUserId: string,
    messageId: string,
    mode: 'me' | 'everyone'
): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const batch = writeBatch(db);

    // Reference to the message in the current user's chat
    const currentUserMsgRef = doc(db, 'users', currentUserId, 'recentChats', otherUserId, 'messages', messageId);
    
    if (mode === 'everyone') {
        // For "everyone", we mark both documents as deleted.
        const updateEveryone = {
            text: "This message was deleted",
            isDeleted: true, // A hard deletion flag
            deletedFor: [], // Clear individual deletions
        };
        // Also get reference to the message in the other user's chat
        const otherUserMsgRef = doc(db, 'users', otherUserId, 'recentChats', currentUserId, 'messages', messageId);
        batch.update(currentUserMsgRef, updateEveryone);
        batch.update(otherUserMsgRef, updateEveryone);

    } else { // mode === 'me'
        // For "me", we just add the current user's ID to the deletedFor array in their own document.
        // The client-side subscription will then filter this out.
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
 * This is now a simple and robust operation because it only touches the current user's data.
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

        // 3. Delete all call logs within that user's copy of the history related to the other user.
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

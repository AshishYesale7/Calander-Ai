
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  setDoc,
  serverTimestamp,
  getDocs,
  writeBatch
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
  const timestamp = Timestamp.now();

  try {
    // 1. Add the new message
    await addDoc(messagesCollection, {
        text: text,
        senderId: senderId,
        timestamp: timestamp,
        isDeleted: false,
        isEdited: false,
        deletedFor: [],
    });
    
    // 2. Update the recent chat entry for both the sender and receiver
    const recentChatSenderRef = doc(db, 'users', senderId, 'recentChats', receiverId);
    const recentChatReceiverRef = doc(db, 'users', receiverId, 'recentChats', senderId);
    
    const recentChatData = {
        lastMessage: text,
        timestamp: serverTimestamp(), // Use server timestamp for consistency
        otherUserId: receiverId, // Storing this might simplify queries later
    };

    // Update for sender
    await setDoc(recentChatSenderRef, { ...recentChatData, otherUserId: receiverId }, { merge: true });
    // Update for receiver
    await setDoc(recentChatReceiverRef, { ...recentChatData, otherUserId: senderId }, { merge: true });

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

/**
 * Deletes an entire conversation history for the current user only.
 * It soft-deletes messages by adding the user's ID to the `deletedFor` array.
 * @param currentUserId The ID of the user requesting the deletion.
 * @param otherUserId The ID of the other user in the chat.
 */
export const deleteConversationForCurrentUser = async (currentUserId: string, otherUserId: string): Promise<void> => {
    if (!db) throw new Error("Firestore is not initialized.");

    const chatRoomId = getChatRoomId(currentUserId, otherUserId);
    const messagesCollection = collection(db, 'chats', chatRoomId, 'messages');
    
    const batch = writeBatch(db);

    try {
        // 1. Soft-delete all messages for the current user
        const messagesSnapshot = await getDocs(messagesCollection);
        messagesSnapshot.forEach(messageDoc => {
            const messageRef = doc(db, 'chats', chatRoomId, 'messages', messageDoc.id);
            batch.update(messageRef, {
                deletedFor: arrayUnion(currentUserId)
            });
        });

        // 2. Delete the conversation from the current user's recent chats list
        const recentChatRef = doc(db, 'users', currentUserId, 'recentChats', otherUserId);
        batch.delete(recentChatRef);
        
        // 3. Delete call logs between the two users (this action is destructive but call logs are less critical)
        // In a real app, you might soft-delete these too. For now, we delete.
        const callsCollectionRef = collection(db, 'calls');
        const participantIds = [currentUserId, otherUserId].sort();
        const callsQuery = query(callsCollectionRef, where('participantIds', '==', participantIds));
        const callsSnapshot = await getDocs(callsQuery);
        callsSnapshot.forEach(callDoc => {
            batch.delete(doc(db, 'calls', callDoc.id));
        });

        await batch.commit();

    } catch (error) {
        console.error("Error deleting conversation for user:", error);
        throw new Error("Failed to delete conversation.");
    }
};

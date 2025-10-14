
'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore';
import type { ChatMessage, CallData, PublicUserProfile } from '@/types';

// --- Local Storage Caching ---

const getMessageCacheKey = (userId: string, otherUserId: string) => `chatMessages_${userId}_${otherUserId}`;
const getCallHistoryCacheKey = (userId: string) => `callHistory_${userId}`;

const saveToLocal = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save to localStorage with key "${key}":`, error);
    }
  }
};

const loadFromLocal = (key: string): any[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to parse from local storage with key "${key}":`, e);
      return [];
    }
  }
  return [];
};


// --- New Recent Chats Service ---

export const subscribeToRecentChats = (
  userId: string,
  callback: (chats: PublicUserProfile[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return () => {};
  }
  
  const recentChatsRef = collection(db, 'users', userId, 'chats');
  const q = query(recentChatsRef, orderBy('timestamp', 'desc'));

  let chats: PublicUserProfile[] = [];

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const changes = snapshot.docChanges();

    // A flag to check if we need to fetch user profiles
    const profilesToFetch = new Set<string>();

    for (const change of changes) {
        const docId = change.doc.id;
        const recentChatData = change.doc.data();

        if (change.type === "added") {
            profilesToFetch.add(docId);
        }
        else if (change.type === "modified") {
            const index = chats.findIndex(c => c.id === docId);
            if (index > -1) {
                // Update in place if user profile already exists
                chats[index] = {
                    ...chats[index],
                    lastMessage: recentChatData.lastMessage,
                    timestamp: recentChatData.timestamp?.toDate(),
                };
            } else {
                 profilesToFetch.add(docId);
            }
        }
        else if (change.type === "removed") {
            chats = chats.filter(c => c.id !== docId);
        }
    }
    
    if (profilesToFetch.size > 0) {
        const fetchedProfiles = await Promise.all(
            Array.from(profilesToFetch).map(async (otherUserId) => {
                const recentChatData = snapshot.docs.find(d => d.id === otherUserId)?.data();
                if (!recentChatData) return null;

                const userDocSnap = await getDoc(doc(db, 'users', otherUserId));
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    return {
                        id: userDocSnap.id,
                        uid: userDocSnap.id,
                        displayName: userData.displayName || 'Anonymous',
                        photoURL: userData.photoURL || null,
                        username: userData.username || `user_${otherUserId.substring(0,5)}`,
                        lastMessage: recentChatData.lastMessage,
                        timestamp: recentChatData.timestamp?.toDate(),
                    } as PublicUserProfile;
                }
                return null;
            })
        );
        
        fetchedProfiles.forEach(profile => {
            if (profile) {
                const existingIndex = chats.findIndex(c => c.id === profile.id);
                if (existingIndex > -1) {
                    chats[existingIndex] = profile; // Update
                } else {
                    chats.push(profile); // Add
                }
            }
        });
    }

    // Always re-sort and call the callback
    chats.sort((a, b) => ((b as any).timestamp?.getTime() || 0) - ((a as any).timestamp?.getTime() || 0));
    callback([...chats]);

  }, (error) => {
    console.error("Error listening to recent chats:", error);
  });

  return unsubscribe;
};


// --- Messages ---

export const loadMessagesFromLocal = (currentUserId: string, otherUserId: string): ChatMessage[] => {
  const key = getMessageCacheKey(currentUserId, otherUserId);
  return loadFromLocal(key).map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
};

export const subscribeToMessages = (
  currentUserId: string,
  otherUserId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    callback(loadMessagesFromLocal(currentUserId, otherUserId));
    return () => {};
  }

  const messagesCollection = collection(db, 'users', currentUserId, 'chats', otherUserId, 'messages');
  const q = query(messagesCollection, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as Timestamp).toDate(),
      type: 'message' as const,
    } as ChatMessage));
      
    saveToLocal(getMessageCacheKey(currentUserId, otherUserId), messages);
    callback(messages);
  }, (error) => {
      console.error("Error listening to chat messages:", error);
      callback(loadMessagesFromLocal(currentUserId, otherUserId));
  });

  return unsubscribe;
};

// --- Call History ---

export const loadCallsFromLocal = (userId: string): CallData[] => {
    const key = getCallHistoryCacheKey(userId);
    return loadFromLocal(key).map((call: any) => ({
        ...call,
        timestamp: new Date(call.timestamp),
        createdAt: new Date(call.createdAt),
    }));
};

export const subscribeToCallHistory = (
  userId: string,
  callback: (calls: CallData[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    callback(loadCallsFromLocal(userId));
    return () => {};
  }
  
  const callsCollectionRef = collection(db, 'users', userId, 'calls');
  const q = query(callsCollectionRef, orderBy('timestamp', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate(),
          createdAt: (data.createdAt as Timestamp).toDate(),
          type: 'call' as const,
        } as CallData;
      });
      
    saveToLocal(getCallHistoryCacheKey(userId), calls);
    callback(calls);
  }, (error) => {
    console.error("Error listening to call history:", error);
    callback(loadCallsFromLocal(userId));
  });

  return unsubscribe;
};

    
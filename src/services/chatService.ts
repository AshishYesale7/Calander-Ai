
'use client';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { ChatMessage, CallData } from '@/types';

// Centralized key generator for consistency
const getLocalStorageKey = (userId: string, otherUserId: string, type: 'messages' | 'calls') => 
  `futureSight_${type}_${[userId, otherUserId].sort().join('_')}`;


// --- Messages ---

export const saveMessagesToLocal = (currentUserId: string, otherUserId: string, messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    const key = getLocalStorageKey(currentUserId, otherUserId, 'messages');
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save messages to local storage', error);
  }
};

export const loadMessagesFromLocal = (currentUserId: string, otherUserId: string): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const key = getLocalStorageKey(currentUserId, otherUserId, 'messages');
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [];
  } catch (error) {
    console.warn('Failed to load messages from local storage', error);
    return [];
  }
};

export const subscribeToMessages = (
  currentUserId: string,
  otherUserId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    // Immediately call back with local data if available, then return
    callback(loadMessagesFromLocal(currentUserId, otherUserId));
    return () => {};
  }

  const messagesCollection = collection(db, 'users', currentUserId, 'recentChats', otherUserId, 'messages');
  const q = query(messagesCollection, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate(),
        type: 'message' as const,
      } as ChatMessage));
      
    const filteredMessages = messages.filter(msg => !msg.deletedFor?.includes(currentUserId));
    
    saveMessagesToLocal(currentUserId, otherUserId, filteredMessages);
    callback(filteredMessages);
  }, (error) => {
      console.error("Error listening to chat messages:", error);
      // On error, still provide local data as a fallback
      callback(loadMessagesFromLocal(currentUserId, otherUserId));
  });

  return unsubscribe;
};


// --- Calls ---

export const saveCallsToLocal = (userId: string, calls: CallData[]) => {
  if (typeof window === 'undefined') return;
  try {
    const key = `futureSight_callHistory_${userId}`;
    localStorage.setItem(key, JSON.stringify(calls));
  } catch (error) {
    console.warn('Failed to save calls to local storage', error);
  }
}

export const loadCallsFromLocal = (userId: string): CallData[] => {
    if (typeof window === 'undefined') return [];
    try {
        const key = `futureSight_callHistory_${userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored).map((call: any) => ({
                ...call,
                timestamp: new Date(call.timestamp),
                createdAt: new Date(call.createdAt),
            }));
        }
        return [];
    } catch (error) {
        console.warn('Failed to load calls from local storage', error);
        return [];
    }
}

export const subscribeToCallHistory = (
  userId: string,
  callback: (calls: CallData[]) => void
): Unsubscribe => {
  if (!db) {
    console.error("Firestore is not initialized.");
    callback(loadCallsFromLocal(userId));
    return () => {};
  }
  
  const callsCollectionRef = collection(db, 'users', userId, 'callHistory');
  const q = query(callsCollectionRef, orderBy('timestamp', 'desc'));

  const unsubscribe = onSnapshot(q, async (snapshot) => {
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
      
    saveCallsToLocal(userId, calls);
    callback(calls);
  }, (error) => {
    console.error("Error listening to call history:", error);
    callback(loadCallsFromLocal(userId));
  });

  return unsubscribe;
};

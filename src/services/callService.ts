
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';

export type CallStatus = 'ringing' | 'answered' | 'declined' | 'ended';

export interface CallData {
  id: string;
  callerId: string;
  callerName: string;
  callerPhotoURL: string | null;
  receiverId: string;
  status: CallStatus;
  createdAt: any;
}

const getCallDocRef = (callId: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
  return doc(db, 'calls', callId);
};

/**
 * Initiates a call by creating a new call document in Firestore.
 */
export async function createCall(callData: Omit<CallData, 'id' | 'createdAt'>): Promise<string> {
  const callId = [callData.callerId, callData.receiverId].sort().join('_');
  const callDocRef = getCallDocRef(callId);
  await setDoc(callDocRef, {
    ...callData,
    status: 'ringing',
    createdAt: serverTimestamp(),
  });
  return callId;
}

/**
 * Updates the status of an existing call.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  const callDocRef = getCallDocRef(callId);
  if (status === 'declined' || status === 'ended') {
    // We delete the document for these terminal statuses to clean up.
    // A more robust system might keep them for call history.
    await deleteDoc(callDocRef);
  } else {
    await updateDoc(callDocRef, { status });
  }
}

/**
 * Listens for changes to a specific call document.
 * @param callId The ID of the call to listen to.
 * @param callback A function to be called with the call data.
 * @returns An unsubscribe function.
 */
export function listenToCall(callId: string, callback: (call: CallData | null) => void): Unsubscribe {
  const callDocRef = getCallDocRef(callId);
  return onSnapshot(callDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData;
      callback({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
      } as CallData);
    } else {
      // Document does not exist (e.g., call was declined/ended and deleted)
      callback(null);
    }
  });
}

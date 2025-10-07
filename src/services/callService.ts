
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
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

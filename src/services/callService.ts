
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  writeBatch,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import type { CallStatus } from '@/types';

const getCallDocRef = (callId: string) => {
  if (!db) throw new Error("Firestore is not initialized.");
  return doc(db, 'calls', callId);
};

/**
 * Initiates a call by creating a new call document in Firestore.
 */
export async function createCall(callData: {
  callerId: string;
  callerName: string;
  callerPhotoURL: string | null;
  receiverId: string;
  status: CallStatus;
}): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  const callsCollection = collection(db, 'calls');
  
  const docRef = await addDoc(callsCollection, {
    ...callData,
    participantIds: [callData.callerId, callData.receiverId].sort(), // Store sorted array for querying
    status: 'ringing',
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}

/**
 * Updates the status of an existing call.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  const callDocRef = getCallDocRef(callId);
  const docSnap = await getDoc(callDocRef);

  if (!docSnap.exists()) {
    console.error(`Call document with ID ${callId} does not exist.`);
    return;
  }
  
  const callData = docSnap.data();
  const updateData: { status: CallStatus, endedAt?: Timestamp, duration?: number } = { status };
  
  if (status === 'declined' || status === 'ended') {
    const endedAt = Timestamp.now();
    updateData.endedAt = endedAt;

    if (callData.createdAt instanceof Timestamp) {
      const durationInSeconds = endedAt.seconds - callData.createdAt.seconds;
      updateData.duration = Math.max(0, durationInSeconds); // Ensure duration is not negative
    }
    
    // Clean up ICE candidate subcollections, but leave the main call doc for history
    const callerCandidatesRef = collection(db, 'calls', callId, 'callerCandidates');
    const receiverCandidatesRef = collection(db, 'calls', callId, 'receiverCandidates');

    const callerCandidatesSnap = await getDocs(callerCandidatesRef);
    const receiverCandidatesSnap = await getDocs(receiverCandidatesRef);

    const batch = writeBatch(db);
    
    callerCandidatesSnap.forEach(doc => batch.delete(doc.ref));
    receiverCandidatesSnap.forEach(doc => batch.delete(doc.ref));
    
    // Only commit the candidate deletion here. The main doc update happens next.
    await batch.commit();
  }
  
  await updateDoc(callDocRef, updateData);
}

/**
 * Saves the WebRTC offer to the call document.
 */
export async function saveOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await updateDoc(callDocRef, { offer: { type: offer.type, sdp: offer.sdp } });
}

/**
 * Saves the WebRTC answer to the call document.
 */
export async function saveAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await updateDoc(callDocRef, { answer: { type: answer.type, sdp: answer.sdp } });
}

/**
 * Adds an ICE candidate to the caller's subcollection.
 */
export async function addCallerCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const candidatesCollection = collection(db, 'calls', callId, 'callerCandidates');
    await addDoc(candidatesCollection, candidate);
}

/**
 * Adds an ICE candidate to the receiver's subcollection.
 */
export async function addReceiverCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized.");
    const candidatesCollection = collection(db, 'calls', callId, 'receiverCandidates');
    await addDoc(candidatesCollection, candidate);
}

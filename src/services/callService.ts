

'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  onSnapshot,
  type Unsubscribe,
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
  const callId = [callData.callerId, callData.receiverId].sort().join('_');
  const callDocRef = getCallDocRef(callId);
  
  const offerDescription = callData.offerDescription;
  delete (callData as any).offerDescription;

  await setDoc(callDocRef, {
    ...callData,
    status: 'ringing',
    createdAt: serverTimestamp(),
  });
  
  if (offerDescription) {
    await updateDoc(callDocRef, { offer: offerDescription });
  }
  
  return callId;
}

/**
 * Updates the status of an existing call.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  const callDocRef = getCallDocRef(callId);
  if (status === 'declined' || status === 'ended') {
    await deleteDoc(callDocRef);
  } else {
    await updateDoc(callDocRef, { status });
  }
}

/**
 * Saves the WebRTC offer to the call document.
 */
export async function saveOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await updateDoc(callDocRef, { offer });
}

/**
 * Saves the WebRTC answer to the call document.
 */
export async function saveAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await updateDoc(callDocRef, { answer });
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

/**
 * Listens for ICE candidates from the receiver.
 */
export function listenForReceiverCandidates(callId: string, callback: (candidate: RTCIceCandidate) => void): Unsubscribe {
    if (!db) throw new Error("Firestore is not initialized.");
    const candidatesCollection = collection(db, 'calls', callId, 'receiverCandidates');
    return onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                callback(new RTCIceCandidate(change.doc.data()));
            }
        });
    });
}

/**
 * Listens for ICE candidates from the caller.
 */
export function listenForCallerCandidates(callId: string, callback: (candidate: RTCIceCandidate) => void): Unsubscribe {
    if (!db) throw new Error("Firestore is not initialized.");
    const candidatesCollection = collection(db, 'calls', callId, 'callerCandidates');
    return onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                callback(new RTCIceCandidate(change.doc.data()));
            }
        });
    });
}

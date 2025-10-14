
'use server';

import { adminDb } from '@/lib/firebase-admin';
import {
  Timestamp,
  FieldValue,
} from 'firebase-admin/firestore';
import type { CallStatus, CallType } from '@/types';

const getCallDocRef = (callId: string) => {
  if (!adminDb) throw new Error("Firestore is not initialized.");
  return adminDb.collection('calls').doc(callId);
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
  callType: CallType;
}): Promise<string> {
  if (!adminDb) throw new Error("Firestore is not initialized.");
  const callsCollection = adminDb.collection('calls');
  
  const docRef = await callsCollection.add({
    ...callData,
    participantIds: [callData.callerId, callData.receiverId].sort(),
    status: 'ringing',
    createdAt: FieldValue.serverTimestamp(),
  });
  
  return docRef.id;
}

/**
 * Updates the status of an existing call.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  const callDocRef = getCallDocRef(callId);
  const docSnap = await callDocRef.get();

  if (!docSnap.exists) {
    console.error(`Call document with ID ${callId} does not exist.`);
    return;
  }
  
  const callData = docSnap.data();
  const updateData: { status: CallStatus, endedAt?: Timestamp, duration?: number } = { status };
  
  if (status === 'declined' || status === 'ended') {
    const endedAt = Timestamp.now();
    updateData.endedAt = endedAt;

    if (callData?.createdAt instanceof Timestamp) {
      const durationInSeconds = endedAt.seconds - callData.createdAt.seconds;
      updateData.duration = Math.max(0, durationInSeconds);
    }
    
    const callerCandidatesRef = callDocRef.collection('callerCandidates');
    const receiverCandidatesRef = callDocRef.collection('receiverCandidates');

    const callerCandidatesSnap = await callerCandidatesRef.get();
    const receiverCandidatesSnap = await receiverCandidatesRef.get();

    const batch = adminDb.batch();
    
    callerCandidatesSnap.forEach(doc => batch.delete(doc.ref));
    receiverCandidatesSnap.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
  }
  
  await callDocRef.update(updateData);
}

/**
 * Saves the WebRTC offer to the call document.
 */
export async function saveOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await callDocRef.update({ offer: { type: offer.type, sdp: offer.sdp } });
}

/**
 * Saves the WebRTC answer to the call document.
 */
export async function saveAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await callDocRef.update({ answer: { type: answer.type, sdp: answer.sdp } });
}

/**
 * Adds an ICE candidate to the caller's subcollection.
 */
export async function addCallerCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!adminDb) throw new Error("Firestore is not initialized.");
    const candidatesCollection = adminDb.collection('calls').doc(callId).collection('callerCandidates');
    await candidatesCollection.add(candidate);
}

/**
 * Adds an ICE candidate to the receiver's subcollection.
 */
export async function addReceiverCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!adminDb) throw new Error("Firestore is not initialized.");
    const candidatesCollection = adminDb.collection('calls').doc(callId).collection('receiverCandidates');
    await candidatesCollection.add(candidate);
}

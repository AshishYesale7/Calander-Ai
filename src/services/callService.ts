
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
    createdAt: Timestamp.now(),
    callerMutedAudio: false,
    callerMutedVideo: false,
    receiverMutedAudio: false,
    receiverMutedVideo: false,
  });
  
  return docRef.id;
}

/**
 * Updates the mute status for a participant in a call.
 */
export async function updateCallParticipantStatus(
  callId: string,
  userId: string,
  updates: { audioMuted?: boolean; videoMuted?: boolean }
): Promise<void> {
  const callDocRef = getCallDocRef(callId);
  const docSnap = await callDocRef.get();
  if (!docSnap.exists) return;

  const callData = docSnap.data();
  const isCaller = callData?.callerId === userId;
  
  const firestoreUpdates: Record<string, boolean> = {};
  if (updates.audioMuted !== undefined) {
    firestoreUpdates[isCaller ? 'callerMutedAudio' : 'receiverMutedAudio'] = updates.audioMuted;
  }
  if (updates.videoMuted !== undefined) {
    firestoreUpdates[isCaller ? 'callerMutedVideo' : 'receiverMutedVideo'] = updates.videoMuted;
  }

  if (Object.keys(firestoreUpdates).length > 0) {
    await callDocRef.update(firestoreUpdates);
  }
}


/**
 * Updates the status of an existing call.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  if (!callId || typeof callId !== 'string') {
    console.error(`updateCallStatus called with invalid callId: ${callId}`);
    return;
  }

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
    
    // Clean up ICE candidates
    const callerCandidatesRef = callDocRef.collection('callerCandidates');
    const receiverCandidatesRef = callDocRef.collection('receiverCandidates');

    const callerCandidatesSnap = await callerCandidatesRef.get();
    const receiverCandidatesSnap = await receiverCandidatesRef.get();

    const batch = adminDb.batch();
    
    callerCandidatesSnap.forEach(doc => batch.delete(doc.ref));
    receiverCandidatesSnap.forEach(doc => batch.delete(doc.ref));
    
    if (callerCandidatesSnap.size > 0 || receiverCandidatesSnap.size > 0) {
        await batch.commit();
    }
  }
  
  await callDocRef.update(updateData);
}

/**
 * Deletes a list of call documents from Firestore using a batch write.
 */
export async function deleteCalls(callIds: string[]): Promise<void> {
    if (!adminDb) throw new Error("Firestore is not initialized.");
    if (!callIds || callIds.length === 0) return;

    const batch = adminDb.batch();

    callIds.forEach(id => {
        const callDocRef = getCallDocRef(id);
        batch.delete(callDocRef);
    });

    await batch.commit();
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


'use server';

import { adminDb } from '@/lib/firebase-admin';
import {
  Timestamp,
  FieldValue
} from 'firebase-admin/firestore';
import type { CallStatus, CallType, CallData } from '@/types';
import { getUserProfile } from './userService';

// This reference is to the SHARED call document, which is now temporary
const getCallDocRef = (callId: string) => {
  if (!adminDb) throw new Error("Firestore is not initialized.");
  return adminDb.collection('calls').doc(callId);
};

// This gets the user-specific history collection
const getCallHistoryCollection = (userId: string) => {
  if (!adminDb) throw new Error("Firestore is not initialized.");
  return adminDb.collection('users', userId, 'callHistory');
};

/**
 * Creates a call document and also adds an entry to each participant's call history.
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
  
  // 1. Create the temporary, shared call document for signaling
  const sharedCallDocRef = getCallDocRef(adminDb.collection('calls').doc().id);
  const sharedCallData = {
    ...callData,
    createdAt: Timestamp.now(),
  };
  await sharedCallDocRef.set(sharedCallData);
  const callId = sharedCallDocRef.id;

  // 2. Create the two separate, persistent history records
  const batch = adminDb.batch();
  const [callerProfile, receiverProfile] = await Promise.all([
    getUserProfile(callData.callerId),
    getUserProfile(callData.receiverId)
  ]);
  
  if (!callerProfile || !receiverProfile) {
    throw new Error("Could not find user profiles for call participants.");
  }

  const historyData = {
    ...callData,
    createdAt: Timestamp.now(),
    timestamp: Timestamp.now(),
  };

  const callerHistoryRef = getCallHistoryCollection(callData.callerId).doc(callId);
  batch.set(callerHistoryRef, { ...historyData, otherUserId: receiverProfile.uid, otherUser: receiverProfile });

  const receiverHistoryRef = getCallHistoryCollection(callData.receiverId).doc(callId);
  batch.set(receiverHistoryRef, { ...historyData, otherUserId: callerProfile.uid, otherUser: callerProfile });
  
  await batch.commit();
  return callId;
}


/**
 * Updates the status and other details of a call in BOTH user histories.
 * Also cleans up the temporary shared call document.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  if (!callId || typeof callId !== 'string') {
    console.error(`updateCallStatus called with invalid callId: ${callId}`);
    return;
  }
  if (!adminDb) throw new Error("Firestore is not initialized.");

  // Fetch the shared document to get participant IDs
  const callDocSnap = await getCallDocRef(callId).get();
  if (!callDocSnap.exists) {
      console.warn(`Call document ${callId} not found for status update, likely already cleaned up.`);
      return;
  }
  const callData = callDocSnap.data() as CallData;

  const batch = adminDb.batch();

  const callerHistoryRef = getCallHistoryCollection(callData.callerId).doc(callId);
  const receiverHistoryRef = getCallHistoryCollection(callData.receiverId).doc(callId);

  const updateData: { status: CallStatus, endedAt?: Timestamp, duration?: number } = { status };
  
  if (status === 'ended') {
      const now = Timestamp.now();
      const duration = now.seconds - callData.createdAt.seconds;
      updateData.endedAt = now;
      updateData.duration = duration > 0 ? duration : 0;
  }
  
  // Update both user's persistent call logs
  batch.update(callerHistoryRef, updateData);
  batch.update(receiverHistoryRef, updateData);

  await batch.commit();

  // If the call is over, delete the temporary signaling document
  if (status === 'ended' || status === 'declined') {
    await getCallDocRef(callId).delete().catch(err => console.error(`Failed to delete shared call doc ${callId}:`, err));
  }
}

/**
 * Deletes a list of call documents from a specific user's call history.
 * Does NOT delete the other user's history. This is now safe.
 */
export async function deleteCalls(userId: string, callIds: string[]): Promise<void> {
    if (!adminDb) throw new Error("Firestore is not initialized.");
    if (!callIds || callIds.length === 0) return;

    const batch = adminDb.batch();
    const historyCollection = getCallHistoryCollection(userId);

    callIds.forEach(id => {
        const callDocRef = historyCollection.doc(id);
        batch.delete(callDocRef);
    });

    await batch.commit();
}


/**
 * Updates the mute status for a participant in the shared call document.
 * This can remain shared as it's transient state for the active call only.
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

// These functions still operate on the temporary shared document for WebRTC signaling.
export async function saveOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await callDocRef.update({ offer: { type: offer.type, sdp: offer.sdp } });
}

export async function saveAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getCallDocRef(callId);
    await callDocRef.update({ answer: { type: answer.type, sdp: answer.sdp } });
}

export async function addCallerCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!adminDb) throw new Error("Firestore is not initialized.");
    const candidatesCollection = adminDb.collection('calls').doc(callId).collection('callerCandidates');
    await candidatesCollection.add(candidate);
}

export async function addReceiverCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!adminDb) throw new Error("Firestore is not initialized.");
    const candidatesCollection = adminDb.collection('calls').doc(callId).collection('receiverCandidates');
    await candidatesCollection.add(candidate);
}

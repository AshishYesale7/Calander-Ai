
'use server';

import { adminDb } from '@/lib/firebase-admin';
import {
  Timestamp,
  FieldValue,
  WriteBatch
} from 'firebase-admin/firestore';
import type { CallStatus, CallType, CallData, PublicUserProfile } from '@/types';
import { getUserProfile } from './userService';

const getCallDocRef = (callId: string) => {
  if (!adminDb) throw new Error("Firestore is not initialized.");
  return adminDb.collection('calls').doc(callId);
};

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
  
  const callsCollection = adminDb.collection('calls');
  const docRef = callsCollection.doc(); // Generate a new ID for the main call document
  
  const batch = adminDb.batch();

  const mainCallData = {
    ...callData,
    participantIds: [callData.callerId, callData.receiverId].sort(),
    createdAt: Timestamp.now(),
    callerMutedAudio: false,
    callerMutedVideo: false,
    receiverMutedAudio: false,
    receiverMutedVideo: false,
  };
  
  // 1. Create the main, shared call document
  batch.set(docRef, mainCallData);

  // 2. Fetch profiles to add to each user's history
  const [callerProfile, receiverProfile] = await Promise.all([
    getUserProfile(callData.callerId),
    getUserProfile(callData.receiverId)
  ]);
  
  if (!callerProfile || !receiverProfile) {
    throw new Error("Could not find user profiles for call participants.");
  }

  // 3. Create a call history record for the caller
  const callerHistoryRef = getCallHistoryCollection(callData.callerId).doc(docRef.id);
  const callerHistoryData: Partial<CallData> = { ...mainCallData, otherUserId: callData.receiverId, otherUser: receiverProfile };
  batch.set(callerHistoryRef, callerHistoryData);

  // 4. Create a call history record for the receiver
  const receiverHistoryRef = getCallHistoryCollection(callData.receiverId).doc(docRef.id);
  const receiverHistoryData: Partial<CallData> = { ...mainCallData, otherUserId: callData.callerId, otherUser: callerProfile };
  batch.set(receiverHistoryRef, receiverHistoryData);
  
  await batch.commit();
  return docRef.id;
}


/**
 * Updates the status and other details of a call in the main document and both user histories.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  if (!callId || typeof callId !== 'string') {
    console.error(`updateCallStatus called with invalid callId: ${callId}`);
    return;
  }
  if (!adminDb) throw new Error("Firestore is not initialized.");

  const callDocRef = getCallDocRef(callId);
  const docSnap = await callDocRef.get();
  if (!docSnap.exists) {
    console.error(`Call document with ID ${callId} does not exist.`);
    return;
  }
  
  const callData = docSnap.data();
  if (!callData) return;

  const batch = adminDb.batch();
  
  const updateData: { status: CallStatus, endedAt?: Timestamp, duration?: number } = { status };
  
  if (status === 'declined' || status === 'ended') {
    const endedAt = Timestamp.now();
    updateData.endedAt = endedAt;

    if (callData.createdAt instanceof Timestamp) {
      const durationInSeconds = endedAt.seconds - callData.createdAt.seconds;
      updateData.duration = Math.max(0, durationInSeconds);
    }
  }
  
  // 1. Update the main call document
  batch.update(callDocRef, updateData);

  // 2. Update the caller's history record
  const callerHistoryRef = getCallHistoryCollection(callData.callerId).doc(callId);
  batch.update(callerHistoryRef, updateData);
  
  // 3. Update the receiver's history record
  const receiverHistoryRef = getCallHistoryCollection(callData.receiverId).doc(callId);
  batch.update(receiverHistoryRef, updateData);

  await batch.commit();

  // If the call has ended, clean up the shared subcollections (ICE candidates).
  if (status === 'ended' || status === 'declined') {
    const cleanupBatch = adminDb.batch();
    const callerCandidatesRef = callDocRef.collection('callerCandidates');
    const receiverCandidatesRef = callDocRef.collection('receiverCandidates');
    
    const callerCandidatesSnap = await callerCandidatesRef.get();
    const receiverCandidatesSnap = await receiverCandidatesRef.get();
    
    callerCandidatesSnap.forEach(doc => cleanupBatch.delete(doc.ref));
    receiverCandidatesSnap.forEach(doc => cleanupBatch.delete(doc.ref));
    
    if (callerCandidatesSnap.size > 0 || receiverCandidatesSnap.size > 0) {
        await cleanupBatch.commit();
    }
  }
}

/**
 * Deletes a list of call documents from a specific user's call history.
 * Does NOT delete the shared call document or the other user's history.
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

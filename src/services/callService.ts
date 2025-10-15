
'use server';

import { adminDb } from '@/lib/firebase-admin';
import {
  Timestamp,
} from 'firebase-admin/firestore';
import type { CallStatus, CallType, CallData } from '@/types';
import { getUserProfile } from './userService';

// Refers to the temporary, shared call document for WebRTC signaling
const getSharedCallDocRef = (callId: string) => {
  if (!adminDb) throw new Error("Firestore Admin is not initialized.");
  return adminDb.collection('calls').doc(callId);
};

// Refers to the user's permanent, private copy of the call history
const getUserCallHistoryCollection = (userId: string) => {
  if (!adminDb) throw new Error("Firestore Admin is not initialized.");
  return adminDb.collection('users').doc(userId).collection('calls');
};

/**
 * Creates a call.
 * 1. Creates a temporary shared document in the top-level 'calls' collection for WebRTC signaling.
 * 2. Creates a permanent, separate copy of the call record in each participant's 'calls' subcollection.
 */
export async function createCall(callData: {
  callerId: string;
  callerName: string;
  callerPhotoURL: string | null;
  receiverId: string;
  status: CallStatus;
  callType: CallType;
}): Promise<string> {
  if (!adminDb) throw new Error("Firestore Admin is not initialized.");

  // 1. Create the temporary signaling document
  const sharedCallDocRef = getSharedCallDocRef(adminDb.collection('calls').doc().id);
  const callId = sharedCallDocRef.id;
  
  const sharedCallData = { 
      ...callData,
      createdAt: Timestamp.now(),
      participantIds: [callData.callerId, callData.receiverId], 
  };
  
  // 2. Create duplicated, permanent records for each user's history
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
    id: callId,
    createdAt: Timestamp.now(),
    timestamp: Timestamp.now(), 
  };

  const callerHistoryRef = getUserCallHistoryCollection(callData.callerId).doc(callId);
  batch.set(callerHistoryRef, { ...historyData, otherUser: { uid: receiverProfile.uid, displayName: receiverProfile.displayName, photoURL: receiverProfile.photoURL } });

  const receiverHistoryRef = getUserCallHistoryCollection(callData.receiverId).doc(callId);
  batch.set(receiverHistoryRef, { ...historyData, otherUser: { uid: callerProfile.uid, displayName: callerProfile.displayName, photoURL: callerProfile.photoURL } });
  
  batch.set(sharedCallDocRef, sharedCallData);

  await batch.commit();
  return callId;
}

/**
 * Updates the status of a call.
 * It updates both users' permanent history records.
 * If the call is ended or declined, it also cleans up the temporary signaling document.
 */
export async function updateCallStatus(callId: string, status: CallStatus): Promise<void> {
  if (!callId || typeof callId !== 'string') {
    console.error(`updateCallStatus called with invalid callId: ${callId}`);
    return;
  }
  if (!adminDb) throw new Error("Firestore Admin is not initialized.");

  const sharedCallDocRef = getSharedCallDocRef(callId);
  const callDocSnap = await sharedCallDocRef.get();
  
  const callDocExists = callDocSnap.exists;

  const updateData: { status: CallStatus, endedAt?: Timestamp, duration?: number } = { status };
  let callData: CallData | null = null;
  
  if (callDocExists) {
    callData = callDocSnap.data() as CallData;
  }
  
  if (status === 'ended' && callData && callData.createdAt) {
      const now = Timestamp.now();
      const createTime = callData.createdAt instanceof Timestamp ? callData.createdAt : new Timestamp(callData.createdAt.seconds, callData.createdAt.nanoseconds);
      const duration = now.seconds - createTime.seconds;
      updateData.endedAt = now;
      updateData.duration = duration > 0 ? duration : 0;
  }

  const batch = adminDb.batch();

  if (callData && callData.callerId && callData.receiverId) {
      const callerHistoryRef = getUserCallHistoryCollection(callData.callerId).doc(callId);
      const receiverHistoryRef = getUserCallHistoryCollection(callData.receiverId).doc(callId);
      batch.update(callerHistoryRef, updateData);
      batch.update(receiverHistoryRef, updateData);
  } else {
      console.warn(`Signaling document ${callId} data is incomplete, cannot update user history.`);
  }

  if (callDocExists) {
    batch.update(sharedCallDocRef, { status });
  }
  
  await batch.commit();

  if (status === 'ended' || status === 'declined') {
      setTimeout(async () => {
          try {
              if (callDocSnap.exists) {
                const cleanupBatch = adminDb.batch();
                const callerCandidatesRef = sharedCallDocRef.collection('callerCandidates');
                const receiverCandidatesRef = sharedCallDocRef.collection('receiverCandidates');
                
                const callerCandidatesSnap = await callerCandidatesRef.get();
                callerCandidatesSnap.forEach(doc => cleanupBatch.delete(doc.ref));
                
                const receiverCandidatesSnap = await receiverCandidatesRef.get();
                receiverCandidatesSnap.forEach(doc => cleanupBatch.delete(doc.ref));
                
                if (callerCandidatesSnap.size > 0 || receiverCandidatesSnap.size > 0) {
                    await cleanupBatch.commit();
                }
                
                await sharedCallDocRef.delete();
              }
          } catch(err) {
              console.warn(`Non-critical error during cleanup of signaling doc ${callId}:`, err);
          }
      }, 5000);
  }
}

export async function deleteCalls(userId: string, callIds: string[]): Promise<void> {
    if (!adminDb) throw new Error("Firestore Admin is not initialized.");
    if (!callIds || callIds.length === 0) return;

    const batch = adminDb.batch();
    const historyCollection = getUserCallHistoryCollection(userId);

    callIds.forEach(id => {
        const callDocRef = historyCollection.doc(id);
        batch.delete(callDocRef);
    });
    await batch.commit();
}

export async function updateCallParticipantStatus(callId: string, userId: string, updates: { audioMuted?: boolean; videoMuted?: boolean }): Promise<void> {
  const callDocRef = getSharedCallDocRef(callId);
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

export async function saveOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getSharedCallDocRef(callId);
    await callDocRef.update({ offer: { type: offer.type, sdp: offer.sdp } });
}

export async function saveAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const callDocRef = getSharedCallDocRef(callId);
    await callDocRef.update({ answer: { type: answer.type, sdp: answer.sdp } });
}

export async function addCallerCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!adminDb) throw new Error("Firestore Admin is not initialized.");
    const candidatesCollection = getSharedCallDocRef(callId).collection('callerCandidates');
    await candidatesCollection.add(candidate);
}

export async function addReceiverCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<void> {
    if (!adminDb) throw new Error("Firestore Admin is not initialized.");
    const candidatesCollection = getSharedCallDocRef(callId).collection('receiverCandidates');
    await candidatesCollection.add(candidate);
}

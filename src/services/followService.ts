
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { getUserProfile } from './userService';
import { sendWebPushNotification } from '@/ai/flows/send-notification-flow';
import { createNotification } from './notificationService';


// Helper to get collection references
const getFollowersCollection = (userId: string) => collection(db, 'users', userId, 'followers');
const getFollowingCollection = (userId: string) => collection(db, 'users', userId, 'following');

// Follow a user
export async function followUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) return;
  if (!db) throw new Error("Firestore is not initialized.");

  const batch = writeBatch(db);

  // Add target to current user's following list
  const followingRef = doc(getFollowingCollection(currentUserId), targetUserId);
  batch.set(followingRef, { timestamp: Timestamp.now() });

  // Add current user to target's followers list
  const followerRef = doc(getFollowersCollection(targetUserId), currentUserId);
  batch.set(followerRef, { timestamp: Timestamp.now() });

  // Increment following count for current user
  const currentUserDocRef = doc(db, 'users', currentUserId);
  batch.update(currentUserDocRef, { followingCount: increment(1) });

  // Increment followers count for target user
  const targetUserDocRef = doc(db, 'users', targetUserId);
  batch.update(targetUserDocRef, { followersCount: increment(1) });
  
  await batch.commit();
  
  const currentUserProfile = await getUserProfile(currentUserId);
  const followerName = currentUserProfile?.displayName || 'A new user';
  
  // Create an in-app notification
  await createNotification({
    type: 'new_follower',
    message: `${followerName} started following you.`,
    link: `/profile/${currentUserProfile?.username || ''}`,
    imageUrl: currentUserProfile?.photoURL,
    userId: targetUserId,
  });

  // Send a push notification
  await sendWebPushNotification({
    userId: targetUserId,
    title: 'New Follower!',
    body: `${followerName} started following you.`,
    url: `/profile/${currentUserProfile?.username || ''}`
  });
};

// Unfollow a user
export async function unfollowUser(currentUserId: string, targetUserId: string) {
  if (!db) throw new Error("Firestore is not initialized.");
  const batch = writeBatch(db);

  // Remove target from current user's following list
  const followingRef = doc(getFollowingCollection(currentUserId), targetUserId);
  batch.delete(followingRef);

  // Remove current user from target's followers list
  const followerRef = doc(getFollowersCollection(targetUserId), currentUserId);
  batch.delete(followerRef);
  
  // Decrement counts
  const currentUserDocRef = doc(db, 'users', currentUserId);
  batch.update(currentUserDocRef, { followingCount: increment(-1) });

  const targetUserDocRef = doc(db, 'users', targetUserId);
  batch.update(targetUserDocRef, { followersCount: increment(-1) });
  
  await batch.commit();
};

// Get a list of followers for a user
export async function getFollowers(userId: string) {
  const followersSnapshot = await getDocs(getFollowersCollection(userId));
  const userPromises = followersSnapshot.docs.map(doc => getUserProfile(doc.id));
  const users = await Promise.all(userPromises);
  return users.filter(u => u).map(u => ({ id: u!.uid, displayName: u!.displayName, photoURL: u!.photoURL, username: u!.username }));
};

// Get a list of users someone is following
export async function getFollowing(userId: string) {
  const followingSnapshot = await getDocs(getFollowingCollection(userId));
  const userPromises = followingSnapshot.docs.map(doc => getUserProfile(doc.id));
  const users = await Promise.all(userPromises);
  return users.filter(u => u).map(u => ({ id: u!.uid, displayName: u!.displayName, photoURL: u!.photoURL, username: u!.username }));
};

    
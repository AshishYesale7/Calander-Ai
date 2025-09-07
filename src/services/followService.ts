
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  getDoc,
  getDocs,
  Timestamp,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { getUserProfile } from './userService';
import { sendNotification } from '@/ai/flows/send-notification-flow';

// Helper to get collection references
const getFollowersCollection = (userId: string) => collection(db, 'users', userId, 'followers');
const getFollowingCollection = (userId: string) => collection(db, 'users', userId, 'following');

// Follow a user
export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) return;

  const batch = writeBatch(db);

  // Add target to current user's following list
  const followingRef = doc(getFollowingCollection(currentUserId), targetUserId);
  batch.set(followingRef, { timestamp: Timestamp.now() });

  // Add current user to target's followers list
  const followerRef = doc(getFollowersCollection(targetUserId), currentUserId);
  batch.set(followerRef, { timestamp: Timestamp.now() });

  // Increment following count for current user
  const currentUserDocRef = doc(db, 'users', currentUserId);
  const currentUserSnap = await getDoc(currentUserDocRef);
  const currentUserFollowingCount = (currentUserSnap.data()?.followingCount || 0) + 1;
  batch.update(currentUserDocRef, { followingCount: currentUserFollowingCount });

  // Increment followers count for target user
  const targetUserDocRef = doc(db, 'users', targetUserId);
  const targetUserSnap = await getDoc(targetUserDocRef);
  const targetUserFollowersCount = (targetUserSnap.data()?.followersCount || 0) + 1;
  batch.update(targetUserDocRef, { followersCount: targetUserFollowersCount });
  
  await batch.commit();
  
  // Send notification to the user who was followed
  const currentUserProfile = await getUserProfile(currentUserId);
  const followerName = currentUserProfile?.displayName || 'A new user';
  
  await sendNotification({
    userId: targetUserId,
    title: 'New Follower!',
    body: `${followerName} started following you.`,
    url: `/profile/${currentUserProfile?.username || ''}`
  });
};

// Unfollow a user
export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  const batch = writeBatch(db);

  const followingRef = doc(getFollowingCollection(currentUserId), targetUserId);
  batch.delete(followingRef);

  const followerRef = doc(getFollowersCollection(targetUserId), currentUserId);
  batch.delete(followerRef);
  
  const currentUserDocRef = doc(db, 'users', currentUserId);
  const currentUserSnap = await getDoc(currentUserDocRef);
  const currentUserFollowingCount = Math.max(0, (currentUserSnap.data()?.followingCount || 1) - 1);
  batch.update(currentUserDocRef, { followingCount: currentUserFollowingCount });

  const targetUserDocRef = doc(db, 'users', targetUserId);
  const targetUserSnap = await getDoc(targetUserDocRef);
  const targetUserFollowersCount = Math.max(0, (targetUserSnap.data()?.followersCount || 1) - 1);
  batch.update(targetUserDocRef, { followersCount: targetUserFollowersCount });
  
  await batch.commit();
};

// Get a list of followers for a user
export const getFollowers = async (userId: string) => {
  const followersSnapshot = await getDocs(getFollowersCollection(userId));
  const userPromises = followersSnapshot.docs.map(doc => getUserProfile(doc.id));
  const users = await Promise.all(userPromises);
  return users.filter(u => u).map(u => ({ id: u!.uid, displayName: u!.displayName, photoURL: u!.photoURL, username: u!.username }));
};

// Get a list of users someone is following
export const getFollowing = async (userId: string) => {
  const followingSnapshot = await getDocs(getFollowingCollection(userId));
  const userPromises = followingSnapshot.docs.map(doc => getUserProfile(doc.id));
  const users = await Promise.all(userPromises);
  return users.filter(u => u).map(u => ({ id: u!.uid, displayName: u!.displayName, photoURL: u!.photoURL, username: u!.username }));
};

// Real-time listener for follow data
export const listenForFollowChanges = (
    profileUserId: string,
    currentUserId: string,
    callback: (data: { followersCount: number; followingCount: number; isCurrentUserFollowing: boolean }) => void
) => {
    const userDocRef = doc(db, 'users', profileUserId);
    
    // Listen for changes on the main user document (for counts)
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        const followersCount = docSnap.data()?.followersCount || 0;
        const followingCount = docSnap.data()?.followingCount || 0;
        
        // Check if the current user is a follower of the profile user
        const followerDocRef = doc(getFollowersCollection(profileUserId), currentUserId);
        getDoc(followerDocRef).then(followerSnap => {
            callback({
                followersCount,
                followingCount,
                isCurrentUserFollowing: followerSnap.exists(),
            });
        });
    });

    // Also listen directly to the follower document for real-time button updates
    const followerDocRef = doc(getFollowersCollection(profileUserId), currentUserId);
    const unsubscribeFollower = onSnapshot(followerDocRef, () => {
        // When this specific doc changes, re-fetch the main counts and status
        getDoc(userDocRef).then(docSnap => {
            const followersCount = docSnap.data()?.followersCount || 0;
            const followingCount = docSnap.data()?.followingCount || 0;
             getDoc(followerDocRef).then(followerSnap => {
                callback({
                    followersCount,
                    followingCount,
                    isCurrentUserFollowing: followerSnap.exists(),
                });
            });
        });
    });

    return () => {
        unsubscribeUser();
        unsubscribeFollower();
    };
};

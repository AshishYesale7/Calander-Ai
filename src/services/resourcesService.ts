
'use server';

import { db } from '@/lib/firebase';
import type { ResourceLink } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const getResourcesCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'resources');
};

const fromFirestore = (doc: any): ResourceLink => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title,
        url: data.url,
        description: data.description,
        category: data.category,
        isAiRecommended: data.isAiRecommended || false, // Should always be false for user-saved
    };
};

export const getBookmarkedResources = async (userId: string): Promise<ResourceLink[]> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const resourcesCollection = getResourcesCollection(userId);
  const snapshot = await getDocs(resourcesCollection);
  // Filter out any accidentally saved AI recommendations from firestore
  return snapshot.docs.map(fromFirestore).filter(r => !r.isAiRecommended);
};

export const saveBookmarkedResource = async (userId: string, resource: ResourceLink): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  // Ensure we don't save AI recommended resources
  if (resource.isAiRecommended) {
      return;
  }
  const resourcesCollection = getResourcesCollection(userId);
  const resourceDocRef = doc(resourcesCollection, resource.id);
  await setDoc(resourceDocRef, resource);
};

export const deleteBookmarkedResource = async (userId: string, resourceId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const resourcesCollection = getResourcesCollection(userId);
  const resourceDocRef = doc(resourcesCollection, resourceId);
  await deleteDoc(resourceDocRef);
};


'use server';

import { db } from '@/lib/firebase';
import type { TrackedKeyword, DeadlineItem } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, addDoc, query, orderBy } from 'firebase/firestore';

const getTrackedKeywordsCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'trackedKeywords');
};

const fromFirestore = (docData: any): TrackedKeyword => {
    const data = docData.data();
    return {
        id: docData.id,
        keyword: data.keyword,
        deadlines: data.deadlines,
        createdAt: (data.createdAt as Timestamp).toDate(),
        summary: data.summary,
    };
};

export const getTrackedKeywords = async (userId: string): Promise<TrackedKeyword[]> => {
  const collectionRef = getTrackedKeywordsCollection(userId);
  const q = query(collectionRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

export const saveTrackedKeyword = async (userId: string, keyword: string, deadlines: DeadlineItem[], summary?: string): Promise<TrackedKeyword> => {
  const collectionRef = getTrackedKeywordsCollection(userId);
  
  const dataToSave: {
    keyword: string;
    deadlines: DeadlineItem[];
    createdAt: Timestamp;
    summary?: string;
  } = {
    keyword,
    deadlines,
    createdAt: Timestamp.now(),
  };

  if (summary) {
    dataToSave.summary = summary;
  }

  const docRef = await addDoc(collectionRef, dataToSave);
  return {
    id: docRef.id,
    ...dataToSave,
    createdAt: dataToSave.createdAt.toDate(),
  };
};

export const deleteTrackedKeyword = async (userId: string, id: string): Promise<void> => {
  const collectionRef = getTrackedKeywordsCollection(userId);
  const docRef = doc(collectionRef, id);
  await deleteDoc(docRef);
};

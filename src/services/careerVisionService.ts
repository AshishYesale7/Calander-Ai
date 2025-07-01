
'use server';

import { db } from '@/lib/firebase';
import type { CareerVisionHistoryItem } from '@/types';
import type { GenerateCareerVisionOutput } from '@/ai/flows/career-vision-flow';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp, addDoc, query, orderBy } from 'firebase/firestore';

const getVisionsCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'careerVisions');
};

const fromFirestore = (docData: any): CareerVisionHistoryItem => {
    const data = docData.data();
    return {
        id: docData.id,
        prompt: data.prompt,
        plan: data.plan,
        createdAt: (data.createdAt as Timestamp).toDate(),
    };
};

export const getCareerVisionHistory = async (userId: string): Promise<CareerVisionHistoryItem[]> => {
  const visionsCollection = getVisionsCollection(userId);
  const q = query(visionsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
};

export const saveCareerVision = async (userId: string, prompt: string, plan: GenerateCareerVisionOutput): Promise<CareerVisionHistoryItem> => {
  const visionsCollection = getVisionsCollection(userId);
  
  const dataToSave = {
    prompt,
    plan,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(visionsCollection, dataToSave);
  return {
    id: docRef.id,
    ...dataToSave,
    createdAt: dataToSave.createdAt.toDate(),
  };
};

export const deleteCareerVision = async (userId: string, visionId: string): Promise<void> => {
  const visionsCollection = getVisionsCollection(userId);
  const visionDocRef = doc(visionsCollection, visionId);
  await deleteDoc(visionDocRef);
};

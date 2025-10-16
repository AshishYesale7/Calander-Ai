
'use server';

import { db } from '@/lib/firebase';
import type { Skill } from '@/types';
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const getSkillsCollection = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return collection(db, 'users', userId, 'skills');
};

const fromFirestore = (doc: any): Skill => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        category: data.category,
        proficiency: data.proficiency,
        lastUpdated: (data.lastUpdated as Timestamp).toDate(),
        learningResources: data.learningResources || [],
    };
};

export const getSkills = async (userId: string): Promise<Skill[]> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const skillsCollection = getSkillsCollection(userId);
  const snapshot = await getDocs(skillsCollection);
  return snapshot.docs.map(fromFirestore);
};

export const saveSkill = async (userId: string, skill: Omit<Skill, 'lastUpdated'> & { lastUpdated: string }): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const skillsCollection = getSkillsCollection(userId);
  const skillDocRef = doc(skillsCollection, skill.id);
  const dataToSave = {
      ...skill,
      lastUpdated: Timestamp.fromDate(new Date(skill.lastUpdated)),
  };
  await setDoc(skillDocRef, dataToSave, { merge: true });
};

export const deleteSkill = async (userId: string, skillId: string): Promise<void> => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const skillsCollection = getSkillsCollection(userId);
  const skillDocRef = doc(skillsCollection, skillId);
  await deleteDoc(skillDocRef);
};

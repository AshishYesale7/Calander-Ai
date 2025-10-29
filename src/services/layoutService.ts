
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { Layouts, Layout } from 'react-grid-layout';

// Define the structure for versioned layouts
interface VersionedLayouts {
    version: number;
    layouts: Layouts;
}

const getLayoutDocRef = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return doc(db, 'userSettings', userId);
};

// This function sanitizes the layout data to remove non-serializable properties
const sanitizeLayouts = (layouts: Layouts): Layouts => {
    const sanitizedLayouts: Layouts = {};
    for (const breakpoint in layouts) {
        sanitizedLayouts[breakpoint] = layouts[breakpoint].map(item => {
            const { i, x, y, w, h, minW, minH, maxW, maxH, isDraggable, isResizable, isBounded, static: isStatic } = item;
            return { i, x, y, w, h, minW, minH, maxW, maxH, isDraggable, isResizable, isBounded, static: isStatic };
        });
    }
    return sanitizedLayouts;
};


/**
 * Saves the dashboard layout to Firestore for a specific user and role.
 */
export const saveLayout = async (userId: string, role: 'student' | 'professional', versionedLayouts: VersionedLayouts): Promise<void> => {
  if (!userId) return;
  const layoutDocRef = getLayoutDocRef(userId);
  
  // Sanitize the layout data before saving
  const sanitizedLayouts = sanitizeLayouts(versionedLayouts.layouts);
  const dataToSave = { version: versionedLayouts.version, layouts: sanitizedLayouts };

  const fieldName = `dashboardLayouts_${role}`;
  try {
    await setDoc(layoutDocRef, { [fieldName]: dataToSave }, { merge: true });
  } catch (error) {
    console.error(`Failed to save ${role} layout to Firestore:`, error);
    throw new Error(`Could not save ${role} layout to cloud.`);
  }
};

/**
 * Retrieves the dashboard layout from Firestore for a specific user and role.
 */
export const getLayout = async (userId: string, role: 'student' | 'professional'): Promise<VersionedLayouts | null> => {
  if (!userId) return null;
  const layoutDocRef = getLayoutDocRef(userId);
  const fieldName = `dashboardLayouts_${role}`;
  try {
    const docSnap = await getDoc(layoutDocRef);
    if (docSnap.exists() && docSnap.data()[fieldName]) {
      return docSnap.data()[fieldName] as VersionedLayouts;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get ${role} layout from Firestore:`, error);
    throw new Error(`Could not retrieve ${role} layout from cloud.`);
  }
};

/**
 * Deletes the saved dashboard layout from Firestore for a specific user and role.
 */
export const deleteLayout = async (userId: string, role: 'student' | 'professional'): Promise<void> => {
    if (!userId) return;
    const layoutDocRef = getLayoutDocRef(userId);
    const fieldName = `dashboardLayouts_${role}`;
    try {
        await updateDoc(layoutDocRef, {
            [fieldName]: deleteField()
        });
    } catch (error) {
        console.error(`Failed to delete ${role} layout from Firestore:`, error);
    }
};

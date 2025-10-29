
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import type { Layouts, Layout } from 'react-grid-layout';

// Define the structure for versioned layouts
export interface VersionedLayouts {
    version: number;
    layouts: Layouts;
    hidden?: string[]; // Add optional hidden array
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
        if (Object.prototype.hasOwnProperty.call(layouts, breakpoint)) {
            sanitizedLayouts[breakpoint] = layouts[breakpoint].map(item => {
                const sanitizedItem: Partial<Layout> = {};
                // Explicitly copy only the valid, serializable properties
                if (item.i !== undefined) sanitizedItem.i = item.i;
                if (item.x !== undefined) sanitizedItem.x = item.x;
                if (item.y !== undefined) sanitizedItem.y = item.y;
                if (item.w !== undefined) sanitizedItem.w = item.w;
                if (item.h !== undefined) sanitizedItem.h = item.h;
                if (item.minW !== undefined) sanitizedItem.minW = item.minW;
                if (item.minH !== undefined) sanitizedItem.minH = item.minH;
                if (item.maxW !== undefined) sanitizedItem.maxW = item.maxW;
                if (item.maxH !== undefined) sanitizedItem.maxH = item.maxH;
                if (item.isDraggable !== undefined) sanitizedItem.isDraggable = item.isDraggable;
                if (item.isResizable !== undefined) sanitizedItem.isResizable = item.isResizable;
                if (item.isBounded !== undefined) sanitizedItem.isBounded = item.isBounded;
                if (item.static !== undefined) sanitizedItem.static = item.static;
                
                return sanitizedItem as Layout;
            });
        }
    }
    return sanitizedLayouts;
};


/**
 * Saves the dashboard layout to Firestore for a specific user and role.
 */
export const saveLayout = async (userId: string, role: 'student' | 'professional', versionedLayouts: VersionedLayouts): Promise<void> => {
  if (!userId) return;
  const layoutDocRef = getLayoutDocRef(userId);
  
  const sanitizedLayouts = sanitizeLayouts(versionedLayouts.layouts);
  // Ensure hidden is an array, even if it's empty
  const dataToSave: VersionedLayouts = { 
      version: versionedLayouts.version, 
      layouts: sanitizedLayouts,
      hidden: versionedLayouts.hidden || [],
  };

  const fieldName = `dashboardLayouts_${role}`;
  try {
    // Using setDoc with merge to ensure the userSettings doc is created if it doesn't exist
    await setDoc(layoutDocRef, { [fieldName]: dataToSave }, { merge: true });
  } catch (error) {
    console.error(`Failed to save ${role} layout to Firestore:`, error);
    // Don't throw here to avoid crashing the app on cleanup, but log the error
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
      // Return the data, which now includes the 'hidden' field if it exists
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
 * If no role is provided, it deletes layouts for both roles.
 */
export const deleteLayout = async (userId: string, role?: 'student' | 'professional'): Promise<void> => {
    if (!userId) return;
    const layoutDocRef = getLayoutDocRef(userId);
    
    const fieldsToDelete: string[] = [];
    if (role) {
        fieldsToDelete.push(`dashboardLayouts_${role}`);
    } else {
        // If no role is specified, clear both for a full reset
        fieldsToDelete.push('dashboardLayouts_student', 'dashboardLayouts_professional');
    }
    
    const updateData: { [key: string]: any } = {};
    fieldsToDelete.forEach(field => {
        updateData[field] = deleteField();
    });

    try {
        await updateDoc(layoutDocRef, updateData);
    } catch (error) {
        // If the document or field doesn't exist, Firestore's updateDoc throws an error.
        // We can safely ignore "not-found" errors during a deletion process.
        if ((error as any).code !== 'not-found') {
          console.error(`Failed to delete layout fields from Firestore:`, error);
        }
    }
};

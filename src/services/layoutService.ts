
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
        if (Object.prototype.hasOwnProperty.call(layouts, breakpoint)) {
            sanitizedLayouts[breakpoint] = layouts[breakpoint].map(item => {
                const sanitizedItem: Partial<Layout> = {
                    i: item.i,
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                };
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
  const dataToSave = { version: versionedLayouts.version, layouts: sanitizedLayouts };

  const fieldName = `dashboardLayouts_${role}`;
  try {
    await setDoc(layoutDocRef, { [fieldName]: dataToSave }, { merge: true });
  } catch (error) {
    console.error(`Failed to save ${role} layout to Firestore:`, error);
    // We don't throw here to avoid unhandled promise rejections on cleanup.
    // Toasting on failure can be handled by the calling component if needed.
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
export const deleteLayout = async (userId: string, role?: 'student' | 'professional'): Promise<void> => {
    if (!userId) return;
    const layoutDocRef = getLayoutDocRef(userId);
    
    const fieldsToDelete: string[] = [];
    if (role) {
        fieldsToDelete.push(`dashboardLayouts_${role}`);
    } else {
        fieldsToDelete.push('dashboardLayouts_student', 'dashboardLayouts_professional');
    }
    
    const updateData: { [key: string]: any } = {};
    fieldsToDelete.forEach(field => {
        updateData[field] = deleteField();
    });

    try {
        await updateDoc(layoutDocRef, updateData);
    } catch (error) {
        if ((error as any).code !== 'not-found') {
          console.error(`Failed to delete layout fields from Firestore:`, error);
        }
    }
};

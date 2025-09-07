
'use server';

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase';
import shortid from 'shortid';

const storage = getStorage(app);

const getProfileImageRef = (userId: string, fileExtension: string) => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  // Store all profile images in a common, user-specific folder to make old ones easy to find and delete.
  return ref(storage, `profileImages/${userId}/${shortid.generate()}.${fileExtension}`);
};

/**
 * Uploads a profile image for a given user.
 * @param userId The user's unique ID.
 * @param file The image file to upload.
 * @param onProgress A callback function to report upload progress.
 * @returns A promise that resolves with the public URL of the uploaded image.
 */
export const uploadProfileImage = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const fileExtension = file.name.split('.').pop() || 'png';
  const storageRef = getProfileImageRef(userId, fileExtension);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Image upload failed:", error);
        reject(new Error("Failed to upload image."));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};

/**
 * Deletes an image from Firebase Storage using its full URL.
 * @param imageUrl The full URL of the image to delete.
 */
export const deleteImageByUrl = async (imageUrl: string): Promise<void> => {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized.");
    }
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error: any) {
        // It's common to try to delete a file that's already gone. We don't need to throw an error for this.
        if (error.code === 'storage/object-not-found') {
            console.warn(`Attempted to delete an image that does not exist: ${imageUrl}`);
            return;
        }
        console.error(`Failed to delete image at ${imageUrl}:`, error);
        throw new Error("Could not delete the old profile image.");
    }
};

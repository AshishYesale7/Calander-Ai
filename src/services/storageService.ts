
'use server';

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/lib/firebase';
import shortid from 'shortid';

const storage = getStorage(app);

const getStorageRef = (userId: string, folder: 'profileImages' | 'coverImages', fileExtension: string) => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  return ref(storage, `${folder}/${userId}/${shortid.generate()}.${fileExtension}`);
};

/**
 * Uploads a profile image for a given user.
 * @param userId The user's unique ID.
 * @param file The image file to upload.
 * @param onProgress A callback function to report upload progress.
 * @returns A promise that resolves with the public URL of the uploaded image.
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
  folder: 'profileImages' | 'coverImages',
  onProgress?: (progress: number) => void
): Promise<string> {
  const fileExtension = file.name.split('.').pop() || 'png';
  const storageRef = getStorageRef(userId, folder, fileExtension);

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
 * It now verifies that the URL belongs to the app's Firebase Storage before attempting deletion.
 * @param imageUrl The full URL of the image to delete.
 */
export async function deleteImageByUrl(imageUrl: string): Promise<void> {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized.");
    }
    
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket || !imageUrl.startsWith(`https://firebasestorage.googleapis.com/v0/b/${storageBucket}`)) {
        console.log(`Skipping deletion of external or non-storage URL: ${imageUrl}`);
        return;
    }

    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn(`Attempted to delete an image that does not exist: ${imageUrl}`);
            return;
        }
        console.error(`Failed to delete image at ${imageUrl}:`, error);
    }
};


'use server';
import * as admin from 'firebase-admin';

// This function ensures that the Firebase Admin SDK is initialized only once.
export function getAdminApp(): admin.app.App {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // If not initialized, create a new instance.
  // This relies on the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or default service account credentials in the runtime environment.
  try {
    return admin.initializeApp();
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization failed:", error.message);
    // This makes it clear that the server is misconfigured.
    throw new Error("Could not initialize Firebase Admin SDK. Ensure your server environment has the correct Firebase service account credentials.");
  }
}

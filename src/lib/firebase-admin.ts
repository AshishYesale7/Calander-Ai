
'use server';
import * as admin from 'firebase-admin';

// This function ensures that the Firebase Admin SDK is initialized only once.
export async function getAdminApp(): Promise<admin.app.App> {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Explicitly create credentials from environment variables.
  // This is more reliable than relying on auto-discovery.
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // The Admin SDK can often infer the rest of the details when running in a Google environment,
    // but we can provide the client email and private key for other environments if needed.
    // For now, projectId is the most critical piece.
  };

  try {
    // Initialize the app with the explicit credentials.
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(), // Use Application Default Credentials
      projectId: serviceAccount.projectId,
    });
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization failed:", error.message);
    // This makes it clear that the server is misconfigured.
    throw new Error("Could not initialize Firebase Admin SDK. Ensure your server environment has the correct Firebase service account credentials.");
  }
}

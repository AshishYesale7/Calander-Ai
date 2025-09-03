
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK if it hasn't been already.
// It's designed to be safely called multiple times without re-initializing.
export function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // When running in a Google Cloud environment (like Firebase App Hosting or Cloud Run),
  // the SDK can automatically detect the service account credentials.
  // For local development, you need to have Application Default Credentials configured.
  // See: https://cloud.google.com/docs/authentication/provide-credentials-adc
  try {
    return admin.initializeApp();
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
    // This will be caught by the API route to prevent crashes.
    throw new Error('Could not initialize Firebase Admin SDK. ' + (error.message || ''));
  }
}

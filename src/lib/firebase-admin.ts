
'use server';

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  // In a deployed Firebase environment (like App Hosting or Cloud Functions),
  // the SDK automatically discovers the project credentials.
  // For local development, you would set the GOOGLE_APPLICATION_CREDENTIALS
  // environment variable to point to your service account key file.
};

let app: App;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseAdminConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db as adminDb };


import { initializeApp, getApps, getApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Check if the required environment variables are set for a Heroku/production environment
const hasProdCredentials = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);

let firebaseAdminConfig;

if (hasProdCredentials) {
  // If production credentials are provided via environment variables, use them.
  // This is the standard way for platforms like Heroku.
  firebaseAdminConfig = {
    credential: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Ensure newlines are correctly parsed
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    } as ServiceAccount,
  };
} else {
  // If not, allow the SDK to use Application Default Credentials (ADC),
  // which is ideal for local development (using GOOGLE_APPLICATION_CREDENTIALS file)
  // and some cloud environments.
  console.warn("Server-side Firebase credentials not found in environment variables. Falling back to Application Default Credentials. For local development, ensure GOOGLE_APPLICATION_CREDENTIALS is set. For Heroku, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.");
  firebaseAdminConfig = {};
}


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

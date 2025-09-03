// This file is intentionally separate to be imported by the service worker.
// It's not a module, so it uses CommonJS-style exports.
// Note: It's crucial that these values are strings. Do not use process.env here for the service worker.

self.firebaseConfig = {
  apiKey: "YOUR_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "YOUR_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_NEXT_PUBLIC_FIREBASE_APP_ID",
};

// A helper note for the developer.
// In a real application, you would replace the placeholder strings above with your actual
// Firebase config values, or use a build script to substitute them. For this environment,
// a developer needs to manually update this file.
console.info("Firebase config loaded for Service Worker. Remember to replace placeholder values in public/firebase-config.js with your actual project config.");

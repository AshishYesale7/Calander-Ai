
// This file must be in the public folder.

// Import and initialize the Firebase SDK
// These scripts are loaded from the Firebase CDN.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// IMPORTANT: This configuration is public and safe to expose.
// It's the same configuration you use to initialize Firebase on the client-side.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize the Firebase app in the service worker with the Firebase config
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (!payload.notification) {
    console.warn("No notification payload received.");
    return;
  }
  
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: payload.notification.icon || '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// public/firebase-messaging-sw.js

// Make sure this file is present in your public directory
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// This script runs in the background, so it can't use process.env
// The config is passed via URL query parameters from layout.tsx
const urlParams = new URLSearchParams(location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

// Ensure all config values are present before initializing
if (Object.values(firebaseConfig).every(value => value)) {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // This is the handler for messages received when the app is in the background or closed.
    onBackgroundMessage(messaging, (payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);

        // Customize the notification Title and Body
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
            body: payload.notification?.body || 'You have a new message.',
            icon: '/icons/icon-192x192.png' // Optional: path to an icon
        };

        // The crucial step: explicitly show the notification.
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} else {
    console.error('Firebase config not found in service worker. Push notifications will not work.');
}

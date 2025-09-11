
// This is a basic service worker for handling Firebase Cloud Messaging.
// It will run in the background, even when the app is closed.

// IMPORTANT: Do not import any other files here. This file must be self-contained.

// Firebase SDK scripts
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
// This must be replaced with your actual Firebase config values
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_NEXT_PUBLIC_FIREBASE_APP_ID",
};

// Initialize Firebase
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png' // Optional: path to an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

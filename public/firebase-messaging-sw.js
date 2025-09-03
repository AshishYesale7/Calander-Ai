
// The service worker runs in a separate context from the web page,
// so we need to initialize the Firebase app in here as well.

// Use importScripts to load the Firebase SDK from the CDN.
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_FIREBASE_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // You can add a logo in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

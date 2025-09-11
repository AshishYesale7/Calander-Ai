
// This file must be in the public directory.

// Check if Firebase has already been initialized
if (typeof self.firebase === 'undefined' || !self.firebase.apps.length) {
  // Scripts for Firebase
  self.importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
  self.importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

  // The service worker needs to be initialized with the same config as the app
  // We will get these values from the query parameters in the URL
  const urlParams = new URLSearchParams(location.search);
  const firebaseConfig = {
    apiKey: urlParams.get('apiKey'),
    authDomain: urlParams.get('authDomain'),
    projectId: urlParams.get('projectId'),
    storageBucket: urlParams.get('storageBucket'),
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId'),
  };

  // Initialize Firebase
  self.firebase.initializeApp(firebaseConfig);
}

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = self.firebase.messaging();

// If you want to handle notifications in the background (when your app is
// closed or not in focus), you can listen for the 'backgroundMessage' event.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // The Firebase SDK will automatically handle displaying the notification
  // if the payload contains a `notification` object.
  // My update to `send-notification-flow.ts` ensures this object is present.
  // No need to call self.registration.showNotification() manually.
});

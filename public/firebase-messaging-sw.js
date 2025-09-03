// Import the Firebase app and messaging libraries
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Import the configuration from the new file
self.importScripts('/firebase-config.js');

// Check if the config was loaded correctly
if (self.firebaseConfig) {
  // Initialize the Firebase app in the service worker
  const app = initializeApp(self.firebaseConfig);
  const messaging = getMessaging(app);

  onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new message.',
      icon: '/logo.png' // Make sure you have a logo.png in your public folder
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

} else {
  console.error("Firebase config not found. Service worker cannot be initialized.");
}

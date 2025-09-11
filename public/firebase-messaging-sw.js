// public/firebase-messaging-sw.js

// This file must be in the public directory.

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase services
// are not available in the service worker.
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// The service worker needs to be initialized with the same config as the app.
// We read the configuration from the URL query parameters.
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

// Initialize the Firebase app in the service worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// This is the crucial part for handling background notifications.
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize the notification here
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message.',
    icon: '/logo.png', // Make sure you have a logo.png in your public folder
    data: {
        url: payload.fcmOptions?.link || '/',
    }
  };

  // The next line is the most important part: It tells the browser to actually show the notification.
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then((clientList) => {
            // If a window for the app is already open, focus it.
            if (clientList.length > 0) {
                 // Check if there's a client for the specific URL first.
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no specific client is found, focus the first available one.
                if (clientList.length > 0 && 'focus' in clientList[0]) {
                    clientList[0].focus();
                    return clientList[0].navigate(urlToOpen);
                }
            }
            // If no window is open, open a new one.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

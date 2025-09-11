
// This service worker is essential for receiving and displaying push notifications.

// Check if Firebase has already been initialized
if (typeof firebase === 'undefined') {
  // These scripts are required for Firebase to work in a service worker.
  importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");
}

// Extract Firebase config from the URL query parameters.
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

// Initialize Firebase app if it hasn't been initialized yet
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get an instance of Firebase Messaging
const messaging = firebase.messaging();

// Set up a handler for when a push message is received while the app is in the background.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (!payload.notification) {
    console.log("No notification payload found, skipping display.");
    return;
  }
  
  // Customize the notification title and body.
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new update.',
    icon: payload.notification.icon || '/icons/icon-192x192.png',
    // The data object can be used to handle notification clicks
    data: {
      url: payload.fcmOptions?.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Add a listener for when the user clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  
  // Close the notification pop-up
  event.notification.close();

  // Get the URL to open from the notification's data
  const urlToOpen = event.notification.data.url;

  // This is a bit of a trick to focus an existing tab if it's already open
  // or open a new one if it's not.
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a tab open with the same URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

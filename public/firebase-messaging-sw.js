
// This file needs to be in the public directory
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// The URL search parameters will be appended by the registration script in layout.tsx
const urlParams = new URLSearchParams(location.search);

const firebaseConfig = {
  apiKey: urlParams.get('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: urlParams.get('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: urlParams.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: urlParams.get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: urlParams.get('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: urlParams.get('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

if (firebaseConfig.apiKey) {
    const app = firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // This listener handles messages received when the app is in the background or closed.
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.image || '/logo192.png', // Default icon
            data: {
                url: payload.fcmOptions.link // The URL to open on click
            }
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        const urlToOpen = event.notification.data.url || '/';

        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then((windowClients) => {
                // Check if a window for this app is already open.
                for (var i = 0; i < windowClients.length; i++) {
                    var client = windowClients[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not, open a new window.
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    });

} else {
    console.error("Firebase config not found in service worker. Push notifications will not work.");
}

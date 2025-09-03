
// This service worker file must be located in the public directory.
// It is used to handle background push notifications.

// Import and initialize the Firebase SDK
// This is a special import syntax for service workers
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
// This needs to be populated with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// A simple check to see if the config keys have been replaced.
// You should replace the placeholder values above with your actual
// Firebase project's configuration.
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.error("Firebase config not set up in firebase-messaging-sw.js");
} else {
    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging so that it can handle background
    // messages.
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log(
            "[firebase-messaging-sw.js] Received background message ",
            payload
        );
        
        // Customize notification here
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.icon || "/logo.png",
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

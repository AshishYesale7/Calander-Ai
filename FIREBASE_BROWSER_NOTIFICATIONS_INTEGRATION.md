# 🔔 Firebase → Browser Notifications Integration

## Overview

This integration automatically converts your Firebase database notification updates into browser notifications. When someone follows you, calendar reminders trigger, calls come in, or any other notification is added to your Firebase database, it will automatically show as a browser notification.

## 🚀 Quick Setup (2 minutes)

### 1. **Wrap Your App with the Provider**

Add this to your main app layout or root component:

```tsx
// src/app/layout.tsx or your main app component
import { FirebaseNotificationProvider } from '@/components/notifications/FirebaseNotificationProvider';
import { useAuth } from '@/context/AuthContext'; // Your auth context

export default function RootLayout({ children }) {
  const { user } = useAuth(); // Get current user
  
  return (
    <html>
      <body>
        <FirebaseNotificationProvider
          userId={user?.uid || null}
          autoStart={true}
          enableBrowserNotifications={true}
          enableAIEnhancement={true}
          showOnlyWhenTabInactive={true}
          showInAppToast={true}
        >
          {children}
        </FirebaseNotificationProvider>
      </body>
    </html>
  );
}
```

### 2. **That's it!** 🎉

Your app now automatically:
- ✅ Listens to Firebase notification changes
- ✅ Shows browser notifications when tab is inactive
- ✅ Enhances messages with Chrome AI (if available)
- ✅ Shows in-app toasts when tab is active
- ✅ Plays notification sounds

---

## 🎯 How It Works

### **The Flow:**

1. **Someone follows you** → Firebase adds notification to `/users/{userId}/notifications`
2. **Firebase listener detects** the new notification in real-time
3. **Browser notification triggers** automatically (if tab is inactive)
4. **Chrome AI enhances** the message (if available)
5. **User sees notification** outside the browser window

### **Example Scenarios:**

```typescript
// When someone follows you:
// Firebase adds: { type: 'new_follower', message: 'John Doe started following you!' }
// Browser shows: 👥 "John Doe started following you!" (enhanced by AI)

// Calendar reminder:
// Firebase adds: { type: 'reminder', message: 'Meeting with team in 15 minutes' }
// Browser shows: ⏰ "Your team meeting starts in 15 minutes!" (AI enhanced)

// Incoming call:
// Firebase adds: { type: 'call', message: 'Incoming call from Sarah' }
// Browser shows: 📞 "Sarah is calling you" + plays ringtone
```

---

## 🛠️ Advanced Usage

### **Custom Notification Handling**

```tsx
import { FirebaseNotificationProvider } from '@/components/notifications/FirebaseNotificationProvider';

function MyApp() {
  const handleNotificationReceived = (notification) => {
    console.log('New notification:', notification);
    
    // Custom logic for specific notification types
    if (notification.type === 'call') {
      // Show call interface
      showCallInterface(notification);
    } else if (notification.type === 'new_follower') {
      // Update follower count
      updateFollowerCount();
    }
  };

  return (
    <FirebaseNotificationProvider
      userId={user?.uid}
      onNotificationReceived={handleNotificationReceived}
      enableBrowserNotifications={true}
      showInAppToast={true}
    >
      <YourApp />
    </FirebaseNotificationProvider>
  );
}
```

### **Using the Hook Directly**

```tsx
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';

function NotificationComponent() {
  const {
    isListening,
    latestNotification,
    notificationCount,
    browserNotificationStatus,
    requestBrowserPermission
  } = useFirebaseNotifications(user?.uid, {
    autoStart: true,
    enableBrowserNotifications: true,
    onNotificationReceived: (notification) => {
      console.log('Received:', notification);
    }
  });

  return (
    <div>
      <p>Listening: {isListening ? 'Yes' : 'No'}</p>
      <p>Notifications received: {notificationCount}</p>
      <p>Browser permission: {browserNotificationStatus.permission}</p>
      
      {!browserNotificationStatus.isGranted && (
        <button onClick={requestBrowserPermission}>
          Enable Browser Notifications
        </button>
      )}
      
      {latestNotification && (
        <div>
          <h4>Latest: {latestNotification.message}</h4>
          <p>Type: {latestNotification.type}</p>
        </div>
      )}
    </div>
  );
}
```

### **Manual Notification Triggering**

```tsx
import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';

// Trigger a browser notification manually
async function sendTestNotification() {
  await clientNotificationTrigger.triggerCustomNotification(
    'reminder',
    'This is a test notification!',
    '/dashboard'
  );
}

// Trigger from existing notification data
async function triggerFromFirebaseData(firebaseNotification) {
  await clientNotificationTrigger.triggerFromAppNotification(firebaseNotification);
}
```

---

## 🎨 Customization

### **Notification Types & Icons**

The system automatically maps your Firebase notification types to appropriate icons and behaviors:

| Firebase Type | Icon | Browser Title | Sound |
|---------------|------|---------------|-------|
| `new_follower` | 👥 | "New Follower!" | Default |
| `reminder` | ⏰ | "Reminder" | Default |
| `event` | 📅 | "Upcoming Event" | Default |
| `call` | 📞 | "Incoming Call" | Ringtone |
| `achievement` | 🏆 | "Achievement Unlocked" | Success |
| `deadline` | 🚨 | "Deadline Alert" | Urgent |

### **Chrome AI Enhancement**

When Chrome AI is available, notification messages are automatically improved:

```typescript
// Original: "You have an important deadline approaching soon"
// Enhanced: "Your deadline is coming up soon! ⏰"

// Original: "John Doe started following you on the platform"
// Enhanced: "John Doe is now following you! 👥"
```

### **Smart Display Logic**

- **Tab Active**: Shows in-app toast only
- **Tab Inactive**: Shows browser notification + in-app toast
- **Permission Denied**: Shows in-app toast only
- **No Support**: Shows in-app toast only

---

## 🧪 Testing

### **Test Your Integration**

1. **Open your app** in Chrome/Chrome Canary
2. **Allow notifications** when prompted
3. **Open another tab** (to make your app tab inactive)
4. **Trigger a notification** in Firebase (follow someone, create reminder, etc.)
5. **See browser notification** appear outside the browser

### **Test Page Available**

Visit: `http://localhost:9002/test-browser-notifications.html`

This page lets you:
- ✅ Test browser notification permissions
- ✅ Test different notification types
- ✅ Test Chrome AI enhancement
- ✅ See detailed logs and debugging info

### **Manual Testing**

```typescript
// Add this to any component for testing
import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';

const testNotifications = async () => {
  // Test follow notification
  await clientNotificationTrigger.triggerCustomNotification(
    'new_follower',
    'John Doe started following you!',
    '/profile/john-doe'
  );
  
  // Test reminder
  await clientNotificationTrigger.triggerCustomNotification(
    'reminder',
    'Your meeting starts in 5 minutes',
    '/calendar'
  );
  
  // Test call
  await clientNotificationTrigger.triggerCustomNotification(
    'call',
    'Incoming call from Sarah',
    '/call/sarah'
  );
};
```

---

## 🔧 Configuration Options

### **FirebaseNotificationProvider Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | `string \| null` | - | Current user ID for Firebase listener |
| `autoStart` | `boolean` | `true` | Start listening automatically |
| `enableBrowserNotifications` | `boolean` | `true` | Enable browser notifications |
| `enableAIEnhancement` | `boolean` | `true` | Use Chrome AI to enhance messages |
| `showOnlyWhenTabInactive` | `boolean` | `true` | Only show browser notifications when tab inactive |
| `showInAppToast` | `boolean` | `true` | Show in-app notification toasts |
| `onNotificationReceived` | `function` | - | Callback for new notifications |

---

## 🚨 Troubleshooting

### **Common Issues**

1. **No browser notifications showing**
   ```typescript
   // Check permission status
   console.log('Permission:', Notification.permission);
   
   // Check if tab is active (notifications only show when inactive by default)
   console.log('Tab active:', !document.hidden);
   
   // Check if Firebase listener is running
   console.log('Listening:', isListening);
   ```

2. **Notifications not triggering from Firebase**
   ```typescript
   // Verify Firebase connection
   console.log('Firebase DB:', db);
   
   // Check user ID
   console.log('User ID:', userId);
   
   // Check Firebase rules (user must have read access to their notifications)
   ```

3. **Chrome AI not working**
   ```typescript
   // Check Chrome AI availability
   console.log('Chrome AI:', window.ai);
   
   // Use Chrome Canary with flags:
   // --enable-features=Experimental,AILanguageModelAPI,AILanguageModelAPIForTesting
   ```

### **Debug Mode**

Set `NODE_ENV=development` to see detailed logs:

```typescript
// Console will show:
// - Firebase listener status
// - Notification received events
// - Browser notification triggers
// - Chrome AI enhancement attempts
// - Permission status changes
```

---

## 🎉 You're All Set!

Your Calendar.ai app now has comprehensive browser notification support that automatically triggers from Firebase database changes. Users will never miss important updates like:

- 👥 New followers
- ⏰ Calendar reminders  
- 📞 Incoming calls
- 🏆 Achievements
- 📅 Events
- 🚨 Deadlines

The system is smart, respects user preferences, and enhances messages with AI when available. Enjoy your enhanced notification experience! 🚀
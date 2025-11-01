# 🔔 Browser Notifications Integration Guide

## Overview

Your Calendar.ai Orb now supports **browser-level notifications** that appear outside the browser window, even when the tab is not active. This system works alongside your existing Firebase Cloud Messaging (FCM) push notifications to provide comprehensive notification coverage.

## 🚀 Features

### ✅ **Dual Notification System**
- **FCM Push Notifications**: Server-side notifications via Firebase
- **Browser Notifications**: Client-side notifications via Web Notifications API

### ✅ **Chrome AI Enhancement**
- Automatically improves notification messages using Chrome AI Rewriter
- Falls back to standard notifications if Chrome AI is unavailable

### ✅ **Smart Triggering**
- Only shows browser notifications when tab is inactive (configurable)
- Prevents notification spam when user is actively using the app

### ✅ **Permission Management**
- Automatic permission request handling
- User-friendly permission status UI
- Graceful fallback when permissions are denied

---

## 🛠️ Implementation

### 1. **Add Browser Notification Manager to Your Dashboard**

```tsx
import { BrowserNotificationManager } from '@/components/notifications/BrowserNotificationManager';

function YourDashboard() {
  return (
    <div className="dashboard">
      {/* Add this component anywhere in your dashboard */}
      <BrowserNotificationManager
        autoRequestPermission={false}
        showOnlyWhenTabInactive={true}
        enableAIEnhancement={true}
        showPermissionUI={true}
      />
      
      {/* Your existing dashboard content */}
    </div>
  );
}
```

### 2. **Integrate with Your Notification Card**

```tsx
import { NotificationCard } from '@/components/notifications/NotificationCard';

function YourApp() {
  const { user } = useAuth(); // Your auth context
  
  return (
    <div className="app">
      {user && (
        <NotificationCard 
          userId={user.uid}
          className="fixed top-4 right-4 w-80"
        />
      )}
    </div>
  );
}
```

### 3. **Manual Notification Triggering**

```tsx
import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';

// Trigger a custom browser notification
async function sendCustomNotification() {
  await clientNotificationTrigger.triggerCustomNotification(
    'reminder',
    'Your meeting starts in 5 minutes!',
    '/calendar',
    '/icons/meeting.png'
  );
}

// Trigger from existing AppNotification
async function triggerFromExisting(notification: AppNotification) {
  await clientNotificationTrigger.triggerFromAppNotification(notification);
}
```

### 4. **Using the React Hook**

```tsx
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';

function NotificationComponent() {
  const {
    isSupported,
    permission,
    isGranted,
    requestPermission,
    showCalendarNotification
  } = useBrowserNotifications();

  const handleShowNotification = async () => {
    if (isGranted) {
      await showCalendarNotification(
        'event',
        'Your meeting is starting now!',
        '/calendar'
      );
    } else {
      await requestPermission();
    }
  };

  return (
    <div>
      <p>Notifications: {isGranted ? 'Enabled' : 'Disabled'}</p>
      <button onClick={handleShowNotification}>
        Show Notification
      </button>
    </div>
  );
}
```

---

## 🔧 Configuration Options

### **BrowserNotificationManager Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoRequestPermission` | `boolean` | `false` | Automatically request permission on mount |
| `showOnlyWhenTabInactive` | `boolean` | `true` | Only show notifications when tab is not active |
| `enableAIEnhancement` | `boolean` | `true` | Use Chrome AI to enhance notification messages |
| `showPermissionUI` | `boolean` | `true` | Show permission status and request UI |
| `onNotificationReceived` | `function` | - | Callback when notification is received |

### **Notification Types**

The system supports these notification categories:

- `reminder` - ⏰ General reminders
- `event` - 📅 Calendar events
- `task` - ✅ Task updates
- `deadline` - 🚨 Urgent deadlines
- `follow` - 👥 Social interactions
- `achievement` - 🏆 Accomplishments

---

## 🎯 How It Works

### **Notification Flow**

1. **Server-side**: Your existing `createNotification()` function creates notifications in Firebase
2. **FCM Push**: Firebase sends push notifications to registered devices
3. **Browser Notification**: Client-side service triggers browser notifications
4. **Chrome AI Enhancement**: If available, improves notification text
5. **Smart Display**: Shows only when tab is inactive (if configured)

### **Permission Handling**

```typescript
// Check if notifications are supported
if (browserNotificationService.isNotificationSupported()) {
  // Request permission
  const result = await browserNotificationService.requestPermission();
  
  if (result.granted) {
    // Show notifications
    await showCalendarNotification('event', 'Meeting in 5 minutes!');
  }
}
```

### **Chrome AI Integration**

```typescript
// Automatically enhances messages if Chrome AI is available
if (window.ai?.rewriter) {
  const rewriter = await window.ai.rewriter.create({
    tone: 'more-casual',
    length: 'shorter'
  });
  enhancedMessage = await rewriter.rewrite(originalMessage);
}
```

---

## 🧪 Testing

### **Test Browser Notifications**

1. **Development Mode**: Use the test button in the notification card
2. **Manual Testing**: 
   ```tsx
   import { NotificationTestButton } from '@/components/notifications/BrowserNotificationManager';
   
   <NotificationTestButton className="my-test-button" />
   ```

3. **Programmatic Testing**:
   ```typescript
   import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';
   
   await clientNotificationTrigger.triggerCustomNotification(
     'test',
     'Test notification! 🚀',
     '/'
   );
   ```

### **Test Chrome AI Enhancement**

1. Open Chrome Canary with Chrome AI flags enabled
2. Ensure Gemini Nano is downloaded
3. Trigger a notification - it should be automatically enhanced

---

## 🔍 Debugging

### **Debug Information**

In development mode, the `BrowserNotificationManager` shows debug info:

- Permission status
- Browser support
- Tab activity status
- Chrome AI availability
- Last notification timestamp

### **Console Logs**

The system provides detailed console logs:

```javascript
// Permission changes
console.log('Notification permission:', permission);

// Notification triggers
console.log('Triggering browser notification:', notification);

// Chrome AI enhancement
console.log('Chrome AI enhancement:', enhancedMessage);

// Tab visibility
console.log('Tab visibility changed:', isActive);
```

---

## 🚨 Troubleshooting

### **Common Issues**

1. **Notifications not showing**
   - Check browser support: `browserNotificationService.isNotificationSupported()`
   - Verify permission: `Notification.permission === 'granted'`
   - Ensure tab is inactive (if configured)

2. **Permission denied**
   - User must manually enable in browser settings
   - Show instructions to user via UI

3. **Chrome AI not working**
   - Requires Chrome Canary with flags enabled
   - Falls back to standard notifications automatically

### **Browser Compatibility**

- ✅ Chrome/Chromium (all versions)
- ✅ Firefox (22+)
- ✅ Safari (7+)
- ✅ Edge (14+)
- ❌ Internet Explorer

---

## 📱 Mobile Support

Browser notifications work on mobile browsers but behavior varies:

- **Android Chrome**: Full support
- **iOS Safari**: Limited support (requires user interaction)
- **Mobile Apps**: Use FCM push notifications instead

---

## 🔐 Privacy & Security

- **No data collection**: Notifications are processed locally
- **Permission-based**: Requires explicit user consent
- **Secure origins only**: HTTPS required for production
- **Chrome AI**: Processing happens locally in browser

---

## 🎉 Ready to Use!

Your Calendar.ai Orb now has comprehensive browser notification support! Users will receive notifications even when the app is not active, with optional Chrome AI enhancement for better messaging.

### **Quick Start Checklist**

- [ ] Add `BrowserNotificationManager` to your dashboard
- [ ] Test notification permissions
- [ ] Verify Chrome AI enhancement (in Chrome Canary)
- [ ] Test with tab inactive
- [ ] Deploy and enjoy! 🚀

---

**Need help?** Check the debug information in development mode or review the console logs for detailed troubleshooting information.
'use client';

import React, { useState } from 'react';
import { createNotification } from '@/services/notificationService';
import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseNotificationContext } from './FirebaseNotificationProvider';

/**
 * Notification Tester Component
 * Add this to any page to test browser notifications
 * This simulates the notifications you'd get from follows, reminders, calls, etc.
 */
export function NotificationTester() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {
    isListening,
    notificationCount,
    browserNotificationStatus,
    requestBrowserPermission
  } = useFirebaseNotificationContext();

  // Test notifications that simulate real scenarios
  const testNotifications = [
    {
      type: 'new_follower',
      message: 'John Doe started following you!',
      link: '/profile/john-doe',
      title: '👥 New Follower Test'
    },
    {
      type: 'reminder',
      message: 'Your team meeting starts in 15 minutes',
      link: '/calendar',
      title: '⏰ Calendar Reminder Test'
    },
    {
      type: 'call',
      message: 'Incoming call from Sarah Johnson',
      link: '/call/sarah',
      title: '📞 Call Notification Test'
    },
    {
      type: 'achievement',
      message: 'Congratulations! You completed 7 days in a row!',
      link: '/achievements',
      title: '🏆 Achievement Test'
    },
    {
      type: 'event',
      message: 'Your "Project Review" meeting is starting now',
      link: '/calendar/event/123',
      title: '📅 Event Notification Test'
    },
    {
      type: 'deadline',
      message: 'Project proposal deadline is tomorrow!',
      link: '/tasks/proposal',
      title: '🚨 Deadline Alert Test'
    }
  ];

  // Test Firebase notification (this will trigger browser notification automatically)
  const testFirebaseNotification = async (notification: typeof testNotifications[0]) => {
    if (!user?.uid) {
      alert('Please log in to test notifications');
      return;
    }

    setIsLoading(true);
    try {
      // This creates a notification in Firebase, which will automatically trigger browser notification
      await createNotification({
        userId: user.uid,
        type: notification.type,
        message: notification.message,
        link: notification.link
      });
      
      console.log('✅ Firebase notification created:', notification.title);
    } catch (error) {
      console.error('❌ Failed to create Firebase notification:', error);
      alert('Failed to create notification. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Test direct browser notification (bypasses Firebase)
  const testDirectBrowserNotification = async (notification: typeof testNotifications[0]) => {
    try {
      await clientNotificationTrigger.triggerCustomNotification(
        notification.type,
        notification.message,
        notification.link
      );
      console.log('✅ Direct browser notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Failed to send direct browser notification:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to test notifications</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200 max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Notification Tester
      </h3>
      
      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">System Status</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Firebase Listener:</span>
            <span className={isListening ? 'text-green-600' : 'text-red-600'}>
              {isListening ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Browser Support:</span>
            <span className={browserNotificationStatus.isSupported ? 'text-green-600' : 'text-red-600'}>
              {browserNotificationStatus.isSupported ? '✅ Supported' : '❌ Not Supported'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Permission:</span>
            <span className={browserNotificationStatus.isGranted ? 'text-green-600' : 'text-yellow-600'}>
              {browserNotificationStatus.permission}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Notifications Received:</span>
            <span className="text-blue-600">{notificationCount}</span>
          </div>
        </div>
        
        {!browserNotificationStatus.isGranted && browserNotificationStatus.isSupported && (
          <button
            onClick={requestBrowserPermission}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Enable Browser Notifications
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📖 How to Test</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Enable browser notifications if not already enabled</li>
          <li>Switch to another tab to make this tab inactive</li>
          <li>Click any "Firebase Test" button below</li>
          <li>You should see a browser notification appear outside the browser</li>
          <li>Click the notification to return to this tab</li>
        </ol>
      </div>

      {/* Test Buttons */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Test Scenarios</h4>
        
        {testNotifications.map((notification, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <h5 className="font-medium text-gray-900">{notification.title}</h5>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => testFirebaseNotification(notification)}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Firebase Test
              </button>
              <button
                onClick={() => testDirectBrowserNotification(notification)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Direct Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Test */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={async () => {
            setIsLoading(true);
            for (let i = 0; i < 3; i++) {
              await testFirebaseNotification(testNotifications[i]);
              if (i < 2) await new Promise(resolve => setTimeout(resolve, 2000));
            }
            setIsLoading(false);
          }}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : '🚀 Send 3 Test Notifications (2s apart)'}
        </button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Debug Info:</strong><br />
          User ID: {user.uid}<br />
          Chrome AI: {window.ai ? 'Available' : 'Not Available'}<br />
          Tab Active: {document.hidden ? 'No' : 'Yes'}
        </div>
      )}
    </div>
  );
}

export default NotificationTester;
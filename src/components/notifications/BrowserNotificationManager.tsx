'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { clientNotificationTrigger, setupNotificationListener } from '@/services/clientNotificationTrigger';
import type { AppNotification } from '@/types';

interface BrowserNotificationManagerProps {
  /** Whether to automatically request permission on mount */
  autoRequestPermission?: boolean;
  /** Whether to show notifications only when tab is inactive */
  showOnlyWhenTabInactive?: boolean;
  /** Whether to enable Chrome AI enhancement for notifications */
  enableAIEnhancement?: boolean;
  /** Callback when a new notification is received */
  onNotificationReceived?: (notification: AppNotification) => void;
  /** Whether to show the permission UI */
  showPermissionUI?: boolean;
  /** Custom className for styling */
  className?: string;
}

/**
 * Browser Notification Manager Component
 * Add this to your notification card or dashboard to enable browser notifications
 */
export function BrowserNotificationManager({
  autoRequestPermission = false,
  showOnlyWhenTabInactive = true,
  enableAIEnhancement = true,
  onNotificationReceived,
  showPermissionUI = true,
  className = ''
}: BrowserNotificationManagerProps) {
  const {
    isSupported,
    permission,
    isGranted,
    requestPermission,
    checkAndRequestPermission
  } = useBrowserNotifications();

  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  // Initialize the notification trigger service
  useEffect(() => {
    if (!isInitialized) {
      clientNotificationTrigger.updateOptions({
        enableAIEnhancement,
        autoRequestPermission,
        showOnlyWhenTabInactive
      });

      // Set up listener for incoming notifications
      const cleanup = setupNotificationListener((notification) => {
        setLastNotificationTime(Date.now());
        onNotificationReceived?.(notification);
      });

      setIsInitialized(true);

      return cleanup;
    }
  }, [isInitialized, enableAIEnhancement, autoRequestPermission, showOnlyWhenTabInactive, onNotificationReceived]);

  // Auto-request permission if enabled
  useEffect(() => {
    if (autoRequestPermission && isSupported && permission === 'default') {
      checkAndRequestPermission();
    }
  }, [autoRequestPermission, isSupported, permission, checkAndRequestPermission]);

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    const result = await requestPermission();
    if (result.granted) {
      console.log('Browser notifications enabled!');
    } else {
      console.warn('Browser notifications denied:', result.message);
    }
  }, [requestPermission]);

  // Test notification function
  const handleTestNotification = useCallback(async () => {
    const canShow = await checkAndRequestPermission();
    if (canShow) {
      await clientNotificationTrigger.triggerCustomNotification(
        'test',
        'This is a test notification from Calendar.ai! 🎉',
        '/',
        '/logos/calendar-ai-logo-192.png'
      );
    }
  }, [checkAndRequestPermission]);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Don't show UI if permission UI is disabled and already granted
  if (!showPermissionUI && isGranted) {
    return null;
  }

  return (
    <div className={`browser-notification-manager ${className}`}>
      {/* Permission Status */}
      {showPermissionUI && (
        <div className="notification-permission-status">
          {permission === 'default' && (
            <div className="permission-prompt">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Enable Browser Notifications
                  </p>
                  <p className="text-xs text-blue-700">
                    Get notified even when Calendar.ai is not active
                  </p>
                </div>
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          )}

          {permission === 'granted' && (
            <div className="permission-granted">
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs text-green-800">
                  Browser notifications enabled
                </span>
                <button
                  onClick={handleTestNotification}
                  className="ml-auto px-2 py-1 text-xs text-green-700 hover:text-green-900 transition-colors"
                  title="Test notification"
                >
                  Test
                </button>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="permission-denied">
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-red-800">
                    Browser notifications blocked
                  </span>
                  <p className="text-xs text-red-600 mt-1">
                    Enable in browser settings to receive notifications
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chrome AI Enhancement Status */}
      {isGranted && enableAIEnhancement && (
        <div className="ai-enhancement-status mt-2">
          <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-purple-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-purple-800">
              {window.ai?.rewriter ? 'Chrome AI enhancement active' : 'Standard notifications active'}
            </span>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>Permission: {permission}</div>
          <div>Supported: {isSupported ? 'Yes' : 'No'}</div>
          <div>Tab Active: {clientNotificationTrigger.isTabCurrentlyActive() ? 'Yes' : 'No'}</div>
          <div>Chrome AI: {window.ai ? 'Available' : 'Not Available'}</div>
          {lastNotificationTime > 0 && (
            <div>Last Notification: {new Date(lastNotificationTime).toLocaleTimeString()}</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple notification trigger button for testing
 */
export function NotificationTestButton({ className = '' }: { className?: string }) {
  const { checkAndRequestPermission } = useBrowserNotifications();

  const handleTest = useCallback(async () => {
    const canShow = await checkAndRequestPermission();
    if (canShow) {
      await clientNotificationTrigger.triggerCustomNotification(
        'test',
        'Test notification from Calendar.ai! 🚀',
        '/'
      );
    }
  }, [checkAndRequestPermission]);

  return (
    <button
      onClick={handleTest}
      className={`px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${className}`}
    >
      Test Browser Notification
    </button>
  );
}

export default BrowserNotificationManager;
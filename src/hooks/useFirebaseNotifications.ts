'use client';

import { useEffect, useState, useCallback } from 'react';
import { startGlobalNotificationListener, stopGlobalNotificationListener, getGlobalNotificationListener } from '@/services/firebaseNotificationListener';
import { useBrowserNotifications } from './useBrowserNotifications';
import type { AppNotification } from '@/types';

interface UseFirebaseNotificationsOptions {
  /** Whether to automatically start listening when hook mounts */
  autoStart?: boolean;
  /** Whether to enable browser notifications */
  enableBrowserNotifications?: boolean;
  /** Whether to enable Chrome AI enhancement */
  enableAIEnhancement?: boolean;
  /** Whether to show notifications only when tab is inactive */
  showOnlyWhenTabInactive?: boolean;
  /** Callback when new notification is received */
  onNotificationReceived?: (notification: AppNotification) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

interface UseFirebaseNotificationsReturn {
  /** Whether the listener is currently active */
  isListening: boolean;
  /** Start listening to Firebase notifications */
  startListening: () => void;
  /** Stop listening to Firebase notifications */
  stopListening: () => void;
  /** Latest notification received */
  latestNotification: AppNotification | null;
  /** Count of notifications received in this session */
  notificationCount: number;
  /** Browser notification status */
  browserNotificationStatus: {
    isSupported: boolean;
    permission: NotificationPermission;
    isGranted: boolean;
  };
  /** Request browser notification permission */
  requestBrowserPermission: () => Promise<boolean>;
}

/**
 * React hook for Firebase real-time notifications with browser notification integration
 * 
 * Usage:
 * ```tsx
 * const { startListening, isListening, latestNotification } = useFirebaseNotifications(userId, {
 *   autoStart: true,
 *   enableBrowserNotifications: true,
 *   onNotificationReceived: (notification) => {
 *     console.log('New notification:', notification);
 *   }
 * });
 * ```
 */
export function useFirebaseNotifications(
  userId: string | null,
  options: UseFirebaseNotificationsOptions = {}
): UseFirebaseNotificationsReturn {
  const {
    autoStart = true,
    enableBrowserNotifications = true,
    enableAIEnhancement = true,
    showOnlyWhenTabInactive = true,
    onNotificationReceived,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const {
    isSupported,
    permission,
    isGranted,
    checkAndRequestPermission
  } = useBrowserNotifications();

  // Handle new notification
  const handleNotificationReceived = useCallback((notification: AppNotification) => {
    console.log('Firebase notification received:', notification);
    setLatestNotification(notification);
    setNotificationCount(prev => prev + 1);
    onNotificationReceived?.(notification);
  }, [onNotificationReceived]);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.error('Firebase notification listener error:', error);
    setIsListening(false);
    onError?.(error);
  }, [onError]);

  // Start listening function
  const startListening = useCallback(() => {
    if (!userId) {
      console.warn('Cannot start Firebase notification listener: no userId provided');
      return;
    }

    if (isListening) {
      console.warn('Firebase notification listener already running');
      return;
    }

    console.log('Starting Firebase notification listener for user:', userId);

    try {
      startGlobalNotificationListener(userId, {
        enableBrowserNotifications,
        enableAIEnhancement,
        showOnlyWhenTabInactive,
        onNotificationReceived: handleNotificationReceived,
        onError: handleError
      });

      setIsListening(true);
    } catch (error) {
      console.error('Failed to start Firebase notification listener:', error);
      handleError(error as Error);
    }
  }, [
    userId,
    isListening,
    enableBrowserNotifications,
    enableAIEnhancement,
    showOnlyWhenTabInactive,
    handleNotificationReceived,
    handleError
  ]);

  // Stop listening function
  const stopListening = useCallback(() => {
    console.log('Stopping Firebase notification listener');
    stopGlobalNotificationListener();
    setIsListening(false);
  }, []);

  // Request browser permission
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    const granted = await checkAndRequestPermission();
    if (granted) {
      console.log('Browser notification permission granted');
    } else {
      console.warn('Browser notification permission denied');
    }
    return granted;
  }, [checkAndRequestPermission]);

  // Auto-start listener when userId is available
  useEffect(() => {
    if (autoStart && userId && !isListening) {
      startListening();
    }

    // Cleanup on unmount or userId change
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [userId, autoStart]); // Only depend on userId and autoStart

  // Update listener options when they change
  useEffect(() => {
    const listener = getGlobalNotificationListener();
    if (listener && isListening) {
      listener.updateOptions({
        enableBrowserNotifications,
        enableAIEnhancement,
        showOnlyWhenTabInactive,
        onNotificationReceived: handleNotificationReceived,
        onError: handleError
      });
    }
  }, [
    enableBrowserNotifications,
    enableAIEnhancement,
    showOnlyWhenTabInactive,
    handleNotificationReceived,
    handleError,
    isListening
  ]);

  return {
    isListening,
    startListening,
    stopListening,
    latestNotification,
    notificationCount,
    browserNotificationStatus: {
      isSupported,
      permission,
      isGranted
    },
    requestBrowserPermission
  };
}

/**
 * Simplified hook for just enabling Firebase notifications
 * Automatically handles everything with sensible defaults
 */
export function useAutoFirebaseNotifications(userId: string | null) {
  return useFirebaseNotifications(userId, {
    autoStart: true,
    enableBrowserNotifications: true,
    enableAIEnhancement: true,
    showOnlyWhenTabInactive: true
  });
}
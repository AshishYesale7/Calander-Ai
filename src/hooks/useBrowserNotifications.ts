'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  browserNotificationService, 
  requestNotificationPermission,
  showCalendarNotification,
  showAIEnhancedNotification,
  type BrowserNotificationOptions,
  type NotificationPermissionResult
} from '@/services/browserNotificationService';

export interface UseBrowserNotificationsReturn {
  // Permission state
  isSupported: boolean;
  permission: NotificationPermission;
  isGranted: boolean;
  
  // Actions
  requestPermission: () => Promise<NotificationPermissionResult>;
  showNotification: (options: BrowserNotificationOptions) => Promise<Notification | null>;
  showCalendarNotification: (
    type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
    message: string,
    url?: string,
    imageUrl?: string
  ) => Promise<Notification | null>;
  showAIEnhancedNotification: (
    message: string,
    type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
    url?: string
  ) => Promise<Notification | null>;
  
  // Utility
  checkAndRequestPermission: () => Promise<boolean>;
}

/**
 * React hook for managing browser notifications
 * Provides easy access to notification functionality with permission management
 */
export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Initialize on mount
  useEffect(() => {
    const supported = browserNotificationService.isNotificationSupported();
    const currentPermission = browserNotificationService.getPermissionStatus();
    
    setIsSupported(supported);
    setPermission(currentPermission);

    // Listen for permission changes (if supported by browser)
    if (supported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permissionStatus => {
          setPermission(permissionStatus.state as NotificationPermission);
          
          permissionStatus.onchange = () => {
            setPermission(permissionStatus.state as NotificationPermission);
          };
        })
        .catch(error => {
          console.log('Permission query not supported:', error);
        });
    }
  }, []);

  // Request permission wrapper
  const handleRequestPermission = useCallback(async (): Promise<NotificationPermissionResult> => {
    const result = await requestNotificationPermission();
    setPermission(result.permission);
    return result;
  }, []);

  // Show notification wrapper
  const handleShowNotification = useCallback(async (options: BrowserNotificationOptions): Promise<Notification | null> => {
    return browserNotificationService.showNotification(options);
  }, []);

  // Show calendar notification wrapper
  const handleShowCalendarNotification = useCallback(async (
    type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
    message: string,
    url?: string,
    imageUrl?: string
  ): Promise<Notification | null> => {
    return showCalendarNotification(type, message, url, imageUrl);
  }, []);

  // Show AI-enhanced notification wrapper
  const handleShowAIEnhancedNotification = useCallback(async (
    message: string,
    type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
    url?: string
  ): Promise<Notification | null> => {
    return showAIEnhancedNotification(message, type, url);
  }, []);

  // Check and request permission if needed
  const checkAndRequestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    if (permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    // Request permission
    const result = await handleRequestPermission();
    return result.granted;
  }, [isSupported, permission, handleRequestPermission]);

  return {
    // State
    isSupported,
    permission,
    isGranted: permission === 'granted',
    
    // Actions
    requestPermission: handleRequestPermission,
    showNotification: handleShowNotification,
    showCalendarNotification: handleShowCalendarNotification,
    showAIEnhancedNotification: handleShowAIEnhancedNotification,
    
    // Utility
    checkAndRequestPermission
  };
}

/**
 * Hook for automatically handling notifications from your notification card
 * This can be used to trigger browser notifications when new notifications arrive
 */
export function useNotificationCardIntegration() {
  const browserNotifications = useBrowserNotifications();

  // Function to trigger browser notification from webapp notification
  const triggerBrowserNotification = useCallback(async (
    type: string,
    message: string,
    link?: string,
    imageUrl?: string
  ) => {
    // Check if we can show notifications
    const canShow = await browserNotifications.checkAndRequestPermission();
    if (!canShow) {
      console.log('Cannot show browser notification - permission not granted');
      return null;
    }

    // Map notification type
    const notificationType = mapNotificationTypeToCategory(type);
    
    // Show AI-enhanced notification if Chrome AI is available
    if (window.ai?.rewriter) {
      return browserNotifications.showAIEnhancedNotification(
        message,
        notificationType,
        link
      );
    } else {
      return browserNotifications.showCalendarNotification(
        notificationType,
        message,
        link,
        imageUrl
      );
    }
  }, [browserNotifications]);

  return {
    ...browserNotifications,
    triggerBrowserNotification
  };
}

// Helper function (duplicated from notificationService for client-side use)
function mapNotificationTypeToCategory(type: string): 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement' {
  const typeMap: Record<string, 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement'> = {
    'reminder': 'reminder',
    'event': 'event',
    'task': 'task',
    'deadline': 'deadline',
    'new_follower': 'follow',
    'follower': 'follow',
    'achievement': 'achievement',
    'goal_completed': 'achievement',
    'streak': 'achievement',
    'calendar_event': 'event',
    'task_due': 'task',
    'task_reminder': 'reminder',
    'meeting': 'event',
    'appointment': 'event'
  };
  
  return typeMap[type] || 'reminder';
}
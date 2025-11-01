
'use client';

/**
 * Browser Notification Service
 * Handles native browser notifications using the Web Notifications API
 * Works alongside FCM push notifications for comprehensive notification coverage
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationPermissionResult {
  granted: boolean;
  permission: NotificationPermission;
  message: string;
}

class BrowserNotificationService {
  private static instance: BrowserNotificationService;
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';

  constructor() {
    // Defer check to client-side only
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): BrowserNotificationService {
    if (!BrowserNotificationService.instance) {
      BrowserNotificationService.instance = new BrowserNotificationService();
    }
    return BrowserNotificationService.instance;
  }

  /**
   * Check if browser notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.isSupported ? Notification.permission : 'denied';
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermissionResult> {
    if (!this.isSupported) {
      return {
        granted: false,
        permission: 'denied',
        message: 'Browser notifications are not supported in this browser'
      };
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      const result: NotificationPermissionResult = {
        granted: permission === 'granted',
        permission,
        message: this.getPermissionMessage(permission)
      };

      // Log permission change
      console.log('Notification permission:', permission);
      
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return {
        granted: false,
        permission: 'denied',
        message: 'Failed to request notification permission'
      };
    }
  }

  /**
   * Show a browser notification
   */
  async showNotification(options: BrowserNotificationOptions): Promise<Notification | null> {
    // Check support
    if (!this.isSupported) {
      console.warn('Browser notifications not supported');
      return null;
    }

    // Check permission
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logos/calendar-ai-logo-192.png',
        badge: options.badge || '/logos/calendar-ai-logo-72.png',
        image: options.image,
        tag: options.tag || `calendar-ai-${Date.now()}`,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        vibrate: options.vibrate || [200, 100, 200],
        actions: options.actions || [],
        data: {
          url: options.url || '/',
          timestamp: Date.now(),
          ...options.data
        }
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        
        // Focus the window
        if (window.parent) {
          window.parent.focus();
        } else {
          window.focus();
        }

        // Navigate to URL if provided
        if (options.url) {
          window.open(options.url, '_blank');
        }

        // Close the notification
        notification.close();
      };

      // Handle notification close
      notification.onclose = () => {
        console.log('Notification closed');
      };

      // Handle notification error
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      // Auto-close after 10 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show notification for Calendar.ai events
   */
  async showCalendarNotification(
    type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
    message: string,
    url?: string,
    imageUrl?: string
  ): Promise<Notification | null> {
    const notificationConfig = this.getNotificationConfig(type);
    
    return this.showNotification({
      title: notificationConfig.title,
      body: message,
      icon: notificationConfig.icon,
      badge: notificationConfig.badge,
      image: imageUrl,
      tag: `calendar-ai-${type}`,
      url: url || '/',
      requireInteraction: notificationConfig.requireInteraction,
      vibrate: notificationConfig.vibrate,
      actions: notificationConfig.actions
    });
  }

  /**
   * Show notification with Chrome AI enhancement
   */
  async showAIEnhancedNotification(
    originalMessage: string,
    type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
    url?: string
  ): Promise<Notification | null> {
    try {
      // Try to enhance the message with Chrome AI if available
      let enhancedMessage = originalMessage;
      
      if (window.ai?.rewriter) {
        try {
          const rewriter = await window.ai.rewriter.create({
            tone: 'more-casual',
            length: 'shorter'
          });
          enhancedMessage = await rewriter.rewrite(originalMessage);
          rewriter.destroy();
        } catch (error) {
          console.log('Chrome AI enhancement failed, using original message');
        }
      }

      return this.showCalendarNotification(type, enhancedMessage, url);
    } catch (error) {
      console.error('Error showing AI-enhanced notification:', error);
      return this.showCalendarNotification(type, originalMessage, url);
    }
  }

  /**
   * Clear all notifications with a specific tag
   */
  clearNotificationsByTag(tag: string): void {
    // Note: There's no direct way to clear notifications by tag in the Web API
    // This is more of a placeholder for future enhancement
    console.log(`Clearing notifications with tag: ${tag}`);
  }

  /**
   * Get notification configuration based on type
   */
  private getNotificationConfig(type: string) {
    const configs = {
      reminder: {
        title: '⏰ Calendar.ai Reminder',
        icon: '/logos/calendar-ai-logo-192.png',
        badge: '/logos/calendar-ai-logo-72.png',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      },
      event: {
        title: '📅 Upcoming Event',
        icon: '/logos/calendar-ai-logo-192.png',
        badge: '/logos/calendar-ai-logo-72.png',
        requireInteraction: true,
        vibrate: [300, 100, 300],
        actions: [
          { action: 'view', title: 'View Event' },
          { action: 'snooze', title: 'Snooze 5min' }
        ]
      },
      task: {
        title: '✅ Task Update',
        icon: '/logos/calendar-ai-logo-192.png',
        badge: '/logos/calendar-ai-logo-72.png',
        requireInteraction: false,
        vibrate: [100, 50, 100],
        actions: [
          { action: 'view', title: 'View Task' },
          { action: 'complete', title: 'Mark Done' }
        ]
      },
      deadline: {
        title: '🚨 Deadline Alert',
        icon: '/logos/calendar-ai-logo-192.png',
        badge: '/logos/calendar-ai-logo-72.png',
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        actions: [
          { action: 'view', title: 'View Details' },
          { action: 'extend', title: 'Request Extension' }
        ]
      },
      follow: {
        title: '👥 New Follower',
        icon: '/logos/calendar-ai-logo-192.png',
        badge: '/logos/calendar-ai-logo-72.png',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        actions: [
          { action: 'view', title: 'View Profile' },
          { action: 'follow-back', title: 'Follow Back' }
        ]
      },
      achievement: {
        title: '🏆 Achievement Unlocked',
        icon: '/logos/calendar-ai-logo-192.png',
        badge: '/logos/calendar-ai-logo-72.png',
        requireInteraction: false,
        vibrate: [100, 50, 100, 50, 100, 50, 200],
        actions: [
          { action: 'view', title: 'View Achievement' },
          { action: 'share', title: 'Share' }
        ]
      }
    };

    return configs[type as keyof typeof configs] || configs.reminder;
  }

  /**
   * Get user-friendly permission message
   */
  private getPermissionMessage(permission: NotificationPermission): string {
    switch (permission) {
      case 'granted':
        return 'Notifications enabled! You\'ll receive browser notifications for important updates.';
      case 'denied':
        return 'Notifications blocked. Please enable them in your browser settings to receive important updates.';
      case 'default':
        return 'Notification permission not yet requested.';
      default:
        return 'Unknown notification permission status.';
    }
  }
}

// Export singleton instance
export const browserNotificationService = BrowserNotificationService.getInstance();

// Export types
export type { BrowserNotificationOptions, NotificationPermissionResult };

// Utility functions for easy access
export const requestNotificationPermission = () => browserNotificationService.requestPermission();
export const showBrowserNotification = (options: BrowserNotificationOptions) => 
  browserNotificationService.showNotification(options);
export const showCalendarNotification = (
  type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
  message: string,
  url?: string,
  imageUrl?: string
) => browserNotificationService.showCalendarNotification(type, message, url, imageUrl);
export const showAIEnhancedNotification = (
  message: string,
  type: 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement',
  url?: string
) => browserNotificationService.showAIEnhancedNotification(message, type, url);

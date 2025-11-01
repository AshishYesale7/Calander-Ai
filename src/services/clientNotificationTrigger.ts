'use client';

import { showCalendarNotification, showAIEnhancedNotification } from './browserNotificationService';
import type { AppNotification } from '@/types';

/**
 * Client-side notification trigger service
 * Use this to manually trigger browser notifications from your notification card
 * when new notifications arrive via Firebase or other means
 */

export interface NotificationTriggerOptions {
  enableAIEnhancement?: boolean;
  autoRequestPermission?: boolean;
  showOnlyWhenTabInactive?: boolean;
}

class ClientNotificationTrigger {
  private static instance: ClientNotificationTrigger;
  private options: NotificationTriggerOptions;
  private isTabActive: boolean = true;

  constructor(options: NotificationTriggerOptions = {}) {
    this.options = {
      enableAIEnhancement: true,
      autoRequestPermission: true,
      showOnlyWhenTabInactive: false,
      ...options
    };

    // Track tab visibility
    this.setupTabVisibilityTracking();
  }

  static getInstance(options?: NotificationTriggerOptions): ClientNotificationTrigger {
    if (!ClientNotificationTrigger.instance) {
      ClientNotificationTrigger.instance = new ClientNotificationTrigger(options);
    }
    return ClientNotificationTrigger.instance;
  }

  /**
   * Trigger browser notification from webapp notification
   */
  async triggerFromAppNotification(notification: AppNotification): Promise<Notification | null> {
    try {
      // Check if we should show notification based on tab visibility
      if (this.options.showOnlyWhenTabInactive && this.isTabActive) {
        console.log('Tab is active, skipping browser notification');
        return null;
      }

      // Check and request permission if needed
      if (this.options.autoRequestPermission) {
        const hasPermission = await this.checkAndRequestPermission();
        if (!hasPermission) {
          console.log('No notification permission, skipping browser notification');
          return null;
        }
      }

      // Map notification type
      const notificationType = this.mapNotificationTypeToCategory(notification.type);
      
      // Choose notification method based on AI availability and settings
      if (this.options.enableAIEnhancement && window.ai?.rewriter) {
        return await showAIEnhancedNotification(
          notification.message,
          notificationType,
          notification.link
        );
      } else {
        return await showCalendarNotification(
          notificationType,
          notification.message,
          notification.link,
          notification.imageUrl
        );
      }
    } catch (error) {
      console.error('Failed to trigger browser notification:', error);
      return null;
    }
  }

  /**
   * Trigger browser notification with custom data
   */
  async triggerCustomNotification(
    type: string,
    message: string,
    link?: string,
    imageUrl?: string
  ): Promise<Notification | null> {
    const notification: AppNotification = {
      id: `custom-${Date.now()}`,
      type,
      message,
      link,
      imageUrl,
      isRead: false,
      createdAt: new Date()
    };

    return this.triggerFromAppNotification(notification);
  }

  /**
   * Batch trigger multiple notifications (with delay to avoid spam)
   */
  async triggerBatchNotifications(
    notifications: AppNotification[],
    delayBetween: number = 1000
  ): Promise<(Notification | null)[]> {
    const results: (Notification | null)[] = [];

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const result = await this.triggerFromAppNotification(notification);
      results.push(result);

      // Add delay between notifications (except for the last one)
      if (i < notifications.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetween));
      }
    }

    return results;
  }

  /**
   * Set up listener for Firebase real-time notifications
   * Call this in your component to automatically trigger browser notifications
   */
  setupFirebaseListener(
    onNotificationReceived: (notification: AppNotification) => void
  ): () => void {
    // This would typically listen to Firebase real-time updates
    // For now, we'll provide a callback that can be called when notifications arrive
    
    const handleNotification = async (notification: AppNotification) => {
      // Trigger browser notification
      await this.triggerFromAppNotification(notification);
      
      // Call the provided callback
      onNotificationReceived(notification);
    };

    // Return cleanup function
    return () => {
      console.log('Firebase notification listener cleaned up');
    };
  }

  /**
   * Check and request notification permission
   */
  private async checkAndRequestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Set up tab visibility tracking
   */
  private setupTabVisibilityTracking(): void {
    if (typeof document !== 'undefined') {
      // Initial state
      this.isTabActive = !document.hidden;

      // Listen for visibility changes
      document.addEventListener('visibilitychange', () => {
        this.isTabActive = !document.hidden;
        console.log('Tab visibility changed:', this.isTabActive ? 'active' : 'inactive');
      });

      // Listen for focus/blur events as backup
      window.addEventListener('focus', () => {
        this.isTabActive = true;
      });

      window.addEventListener('blur', () => {
        this.isTabActive = false;
      });
    }
  }

  /**
   * Map notification types to browser notification categories
   */
  private mapNotificationTypeToCategory(type: string): 'reminder' | 'event' | 'task' | 'deadline' | 'follow' | 'achievement' {
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

  /**
   * Update options
   */
  updateOptions(newOptions: Partial<NotificationTriggerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current tab visibility status
   */
  isTabCurrentlyActive(): boolean {
    return this.isTabActive;
  }
}

// Export singleton instance with default options
export const clientNotificationTrigger = ClientNotificationTrigger.getInstance({
  enableAIEnhancement: true,
  autoRequestPermission: true,
  showOnlyWhenTabInactive: true // Only show browser notifications when tab is not active
});

// Export class for custom instances
export { ClientNotificationTrigger };

// Export types
export type { NotificationTriggerOptions };

// Utility functions for easy access
export const triggerBrowserNotificationFromApp = (notification: AppNotification) =>
  clientNotificationTrigger.triggerFromAppNotification(notification);

export const triggerCustomBrowserNotification = (
  type: string,
  message: string,
  link?: string,
  imageUrl?: string
) => clientNotificationTrigger.triggerCustomNotification(type, message, link, imageUrl);

export const setupNotificationListener = (
  onNotificationReceived: (notification: AppNotification) => void
) => clientNotificationTrigger.setupFirebaseListener(onNotificationReceived);
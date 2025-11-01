'use client';

import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { clientNotificationTrigger } from './clientNotificationTrigger';
import type { AppNotification } from '@/types';

/**
 * Firebase Real-time Notification Listener
 * Listens to Firebase database changes and automatically triggers browser notifications
 * when new notifications are added (follows, calendar reminders, calls, etc.)
 */

interface FirebaseNotificationListenerOptions {
  userId: string;
  enableBrowserNotifications?: boolean;
  enableAIEnhancement?: boolean;
  showOnlyWhenTabInactive?: boolean;
  onNotificationReceived?: (notification: AppNotification) => void;
  onError?: (error: Error) => void;
}

class FirebaseNotificationListener {
  private unsubscribe: (() => void) | null = null;
  private options: FirebaseNotificationListenerOptions;
  private lastNotificationTime: number = 0;
  private isListening: boolean = false;

  constructor(options: FirebaseNotificationListenerOptions) {
    this.options = {
      enableBrowserNotifications: true,
      enableAIEnhancement: true,
      showOnlyWhenTabInactive: true,
      ...options
    };
    
    // Set last notification time to now to avoid showing old notifications
    this.lastNotificationTime = Date.now();
  }

  /**
   * Start listening to Firebase notifications
   */
  startListening(): void {
    if (this.isListening || !this.options.userId) {
      console.warn('Already listening or no userId provided');
      return;
    }

    try {
      const notificationsRef = collection(db, 'users', this.options.userId, 'notifications');
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(10) // Listen to latest 10 notifications
      );

      console.log('Starting Firebase notification listener for user:', this.options.userId);

      this.unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const docData = change.doc.data();
              const notification: AppNotification = {
                id: change.doc.id,
                type: docData.type,
                message: docData.message,
                link: docData.link,
                imageUrl: docData.imageUrl,
                isRead: docData.isRead || false,
                createdAt: (docData.createdAt as Timestamp).toDate(),
              };

              // Only process notifications that are newer than when we started listening
              const notificationTime = notification.createdAt.getTime();
              if (notificationTime > this.lastNotificationTime) {
                console.log('New notification received:', notification);
                this.handleNewNotification(notification);
              }
            }
          });
        },
        (error) => {
          console.error('Firebase notification listener error:', error);
          this.options.onError?.(error);
        }
      );

      this.isListening = true;
    } catch (error) {
      console.error('Failed to start Firebase notification listener:', error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Stop listening to Firebase notifications
   */
  stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isListening = false;
      console.log('Stopped Firebase notification listener');
    }
  }

  /**
   * Handle new notification from Firebase
   */
  private async handleNewNotification(notification: AppNotification): Promise<void> {
    try {
      // Call the callback if provided
      this.options.onNotificationReceived?.(notification);

      // Trigger browser notification if enabled
      if (this.options.enableBrowserNotifications) {
        // Configure the notification trigger
        clientNotificationTrigger.updateOptions({
          enableAIEnhancement: this.options.enableAIEnhancement,
          autoRequestPermission: true,
          showOnlyWhenTabInactive: this.options.showOnlyWhenTabInactive
        });

        // Trigger the browser notification
        await clientNotificationTrigger.triggerFromAppNotification(notification);
      }

      // Play notification sound if it's an important notification
      this.playNotificationSound(notification.type);

    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  }

  /**
   * Play notification sound based on type
   */
  private playNotificationSound(type: string): void {
    try {
      // Different sounds for different notification types
      const soundMap: Record<string, string> = {
        'call': '/assets/ringtone.mp3', // Your existing ringtone
        'new_follower': '/sounds/follow.mp3',
        'reminder': '/sounds/reminder.mp3',
        'event': '/sounds/event.mp3',
        'deadline': '/sounds/urgent.mp3',
        'achievement': '/sounds/success.mp3'
      };

      const soundFile = soundMap[type] || '/assets/ringtone.mp3';
      
      // Create and play audio
      const audio = new Audio(soundFile);
      audio.volume = 0.3; // Moderate volume
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
        // This is normal if user hasn't interacted with page yet
      });
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  }

  /**
   * Update listener options
   */
  updateOptions(newOptions: Partial<FirebaseNotificationListenerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

/**
 * Global notification listener instance
 */
let globalNotificationListener: FirebaseNotificationListener | null = null;

/**
 * Start global notification listener
 */
export function startGlobalNotificationListener(
  userId: string,
  options: Omit<FirebaseNotificationListenerOptions, 'userId'> = {}
): FirebaseNotificationListener {
  // Stop existing listener if any
  if (globalNotificationListener) {
    globalNotificationListener.stopListening();
  }

  // Create new listener
  globalNotificationListener = new FirebaseNotificationListener({
    userId,
    ...options
  });

  // Start listening
  globalNotificationListener.startListening();

  return globalNotificationListener;
}

/**
 * Stop global notification listener
 */
export function stopGlobalNotificationListener(): void {
  if (globalNotificationListener) {
    globalNotificationListener.stopListening();
    globalNotificationListener = null;
  }
}

/**
 * Get current global listener
 */
export function getGlobalNotificationListener(): FirebaseNotificationListener | null {
  return globalNotificationListener;
}

// Export the class for custom instances
export { FirebaseNotificationListener };
export type { FirebaseNotificationListenerOptions };
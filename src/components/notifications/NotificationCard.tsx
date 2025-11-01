'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserNotificationManager } from './BrowserNotificationManager';
import { clientNotificationTrigger } from '@/services/clientNotificationTrigger';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import type { AppNotification } from '@/types';

interface NotificationCardProps {
  userId: string;
  className?: string;
}

/**
 * Enhanced Notification Card with Browser Notification Integration
 * This component shows how to integrate browser notifications with your existing notification system
 */
export function NotificationCard({ userId, className = '' }: NotificationCardProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const fetchedNotifications = await getNotifications(userId, 20);
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Handle new notification received (this would typically come from Firebase real-time listener)
  const handleNotificationReceived = useCallback(async (notification: AppNotification) => {
    console.log('New notification received:', notification);
    
    // Add to local state
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Trigger browser notification
    await clientNotificationTrigger.triggerFromAppNotification(notification);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(userId, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [userId]);

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [userId]);

  // Test notification function
  const handleTestNotification = useCallback(async () => {
    const testNotification: AppNotification = {
      id: `test-${Date.now()}`,
      type: 'reminder',
      message: 'This is a test notification! 🎉',
      link: '/',
      isRead: false,
      createdAt: new Date()
    };

    // Simulate receiving a new notification
    await handleNotificationReceived(testNotification);
  }, [handleNotificationReceived]);

  return (
    <div className={`notification-card bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Mark all read
            </button>
          )}
          
          {/* Test button (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleTestNotification}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Test
            </button>
          )}
        </div>
      </div>

      {/* Browser Notification Manager */}
      <BrowserNotificationManager
        autoRequestPermission={false}
        showOnlyWhenTabInactive={true}
        enableAIEnhancement={true}
        onNotificationReceived={handleNotificationReceived}
        showPermissionUI={true}
        className="mb-4"
      />

      {/* Notifications List */}
      <div className="notifications-list">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual notification item component
 */
interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = useCallback(() => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate to link if provided
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
  }, [notification, onMarkAsRead]);

  const getNotificationIcon = (type: string) => {
    const icons = {
      reminder: '⏰',
      event: '📅',
      task: '✅',
      deadline: '🚨',
      new_follower: '👥',
      achievement: '🏆',
      default: '🔔'
    };
    return icons[type as keyof typeof icons] || icons.default;
  };

  return (
    <div
      onClick={handleClick}
      className={`notification-item p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        notification.isRead 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-blue-50 border-blue-200 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-lg">
          {notification.imageUrl ? (
            <img 
              src={notification.imageUrl} 
              alt="" 
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <span>{getNotificationIcon(notification.type)}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {notification.createdAt.toLocaleString()}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationCard;
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';
import type { AppNotification } from '@/types';

interface FirebaseNotificationContextValue {
  isListening: boolean;
  latestNotification: AppNotification | null;
  notificationCount: number;
  browserNotificationStatus: {
    isSupported: boolean;
    permission: NotificationPermission;
    isGranted: boolean;
  };
  requestBrowserPermission: () => Promise<boolean>;
  startListening: () => void;
  stopListening: () => void;
}

const FirebaseNotificationContext = createContext<FirebaseNotificationContextValue | null>(null);

interface FirebaseNotificationProviderProps {
  children: React.ReactNode;
  userId: string | null;
  /** Whether to automatically start listening when provider mounts */
  autoStart?: boolean;
  /** Whether to enable browser notifications */
  enableBrowserNotifications?: boolean;
  /** Whether to enable Chrome AI enhancement */
  enableAIEnhancement?: boolean;
  /** Whether to show notifications only when tab is inactive */
  showOnlyWhenTabInactive?: boolean;
  /** Whether to show a toast/banner when new notifications arrive */
  showInAppToast?: boolean;
  /** Callback when new notification is received */
  onNotificationReceived?: (notification: AppNotification) => void;
}

/**
 * Firebase Notification Provider
 * Wrap your app with this to enable automatic browser notifications
 * for all Firebase notification updates (follows, reminders, calls, etc.)
 */
export function FirebaseNotificationProvider({
  children,
  userId,
  autoStart = true,
  enableBrowserNotifications = true,
  enableAIEnhancement = true,
  showOnlyWhenTabInactive = true,
  showInAppToast = true,
  onNotificationReceived
}: FirebaseNotificationProviderProps) {
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  const firebaseNotifications = useFirebaseNotifications(userId, {
    autoStart,
    enableBrowserNotifications,
    enableAIEnhancement,
    showOnlyWhenTabInactive,
    onNotificationReceived: (notification) => {
      // Show in-app toast if enabled
      if (showInAppToast) {
        setToastNotification(notification);
        // Auto-hide toast after 5 seconds
        setTimeout(() => setToastNotification(null), 5000);
      }
      
      // Call custom callback
      onNotificationReceived?.(notification);
    },
    onError: (error) => {
      console.error('Firebase notification error:', error);
    }
  });

  // Auto-request browser permission on first notification if not granted
  useEffect(() => {
    if (
      firebaseNotifications.latestNotification &&
      firebaseNotifications.browserNotificationStatus.isSupported &&
      firebaseNotifications.browserNotificationStatus.permission === 'default'
    ) {
      firebaseNotifications.requestBrowserPermission();
    }
  }, [firebaseNotifications.latestNotification, firebaseNotifications.browserNotificationStatus]);

  return (
    <FirebaseNotificationContext.Provider value={firebaseNotifications}>
      {children}
      
      {/* In-app notification toast */}
      {showInAppToast && toastNotification && (
        <NotificationToast
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
        />
      )}
    </FirebaseNotificationContext.Provider>
  );
}

/**
 * Hook to use Firebase notification context
 */
export function useFirebaseNotificationContext(): FirebaseNotificationContextValue {
  const context = useContext(FirebaseNotificationContext);
  if (!context) {
    throw new Error('useFirebaseNotificationContext must be used within FirebaseNotificationProvider');
  }
  return context;
}

/**
 * In-app notification toast component
 */
interface NotificationToastProps {
  notification: AppNotification;
  onClose: () => void;
}

function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const getNotificationIcon = (type: string) => {
    const icons = {
      'new_follower': '👥',
      'follower': '👥',
      'reminder': '⏰',
      'event': '📅',
      'calendar_event': '📅',
      'task': '✅',
      'task_due': '📋',
      'deadline': '🚨',
      'call': '📞',
      'achievement': '🏆',
      'goal_completed': '🎯',
      'streak': '🔥',
      'meeting': '🤝',
      'appointment': '📅'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors = {
      'new_follower': 'bg-blue-500',
      'follower': 'bg-blue-500',
      'reminder': 'bg-yellow-500',
      'event': 'bg-green-500',
      'calendar_event': 'bg-green-500',
      'task': 'bg-purple-500',
      'task_due': 'bg-orange-500',
      'deadline': 'bg-red-500',
      'call': 'bg-indigo-500',
      'achievement': 'bg-yellow-400',
      'goal_completed': 'bg-green-400',
      'streak': 'bg-orange-400',
      'meeting': 'bg-blue-400',
      'appointment': 'bg-teal-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-white text-sm`}>
            {getNotificationIcon(notification.type)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 mb-1">
              New Notification
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {notification.createdAt.toLocaleTimeString()}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Action button if link is provided */}
        {notification.link && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                window.open(notification.link, '_blank');
                onClose();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View Details →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Add CSS for animation (you can add this to your global CSS)
const toastStyles = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('notification-toast-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'notification-toast-styles';
  styleElement.textContent = toastStyles;
  document.head.appendChild(styleElement);
}

export default FirebaseNotificationProvider;
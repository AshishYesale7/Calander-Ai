'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { FirebaseNotificationProvider } from './FirebaseNotificationProvider';

interface NotificationWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that connects AuthContext with FirebaseNotificationProvider
 * This automatically enables browser notifications for the authenticated user
 */
export function NotificationWrapper({ children }: NotificationWrapperProps) {
  const { user } = useAuth();

  return (
    <FirebaseNotificationProvider
      userId={user?.uid || null}
      autoStart={true}
      enableBrowserNotifications={true}
      enableAIEnhancement={true}
      showOnlyWhenTabInactive={true}
      showInAppToast={true}
      onNotificationReceived={(notification) => {
        console.log('🔔 New notification received:', notification);
        
        // You can add custom logic here for specific notification types
        if (notification.type === 'call') {
          console.log('📞 Incoming call notification');
        } else if (notification.type === 'new_follower') {
          console.log('👥 New follower notification');
        } else if (notification.type === 'reminder') {
          console.log('⏰ Reminder notification');
        }
      }}
    >
      {children}
    </FirebaseNotificationProvider>
  );
}

export default NotificationWrapper;

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, UserPlus, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, clearAllNotifications } from '@/services/notificationService';
import type { AppNotification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const getNotificationIcon = (notification: AppNotification) => {
    if (notification.type === 'new_follower' && notification.imageUrl) {
        return (
            <Avatar className="h-8 w-8">
                <AvatarImage src={notification.imageUrl} alt="Follower" />
                <AvatarFallback><UserPlus className="h-5 w-5" /></AvatarFallback>
            </Avatar>
        )
    }
    
    switch (notification.type) {
        case 'new_follower':
            return <UserPlus className="h-5 w-5 text-blue-400" />;
        default:
            return <Bell className="h-5 w-5 text-accent" />;
    }
};

export default function NotificationPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Set up a real-time listener for notifications
  useEffect(() => {
    if (user && db) {
      setIsLoading(true);
      const notificationsCollection = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsCollection, orderBy('createdAt', 'desc'), limit(20));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as any).toDate(),
        } as AppNotification));
        setNotifications(fetchedNotifications);
        setIsLoading(false);
      }, (error) => {
        console.error("Failed to listen for notifications:", error);
        setIsLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    } else {
        setIsLoading(false);
        setNotifications([]);
    }
  }, [user]);
  
  const hasUnread = useMemo(() => notifications.some(n => !n.isRead), [notifications]);

  const handleMarkOneAsRead = async (notificationId: string) => {
    if (!user) return;
    // Optimistically update the UI
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    await markNotificationAsRead(user.uid, notificationId);
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user || !hasUnread) return;
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    await markAllNotificationsAsRead(user.uid);
  };
  
  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    const originalNotifications = [...notifications];
    setNotifications([]); // Optimistic UI update
    
    try {
        await clearAllNotifications(user.uid);
        toast({ title: "All Cleared", description: "Your notifications have been cleared." });
    } catch (error) {
        setNotifications(originalNotifications);
        toast({ title: "Error", description: "Failed to clear notifications.", variant: "destructive" });
    }
  };


  const NotificationItem = ({ notification }: { notification: AppNotification }) => {
    const itemContent = (
      <div
        className={cn(
            "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted",
            !notification.isRead && "bg-blue-500/10"
        )}
        onClick={() => !notification.isRead && handleMarkOneAsRead(notification.id)}
       >
        <div className="flex-shrink-0 bg-background rounded-full flex items-center justify-center mt-0.5">
          {getNotificationIcon(notification)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    );
    
    if (notification.link) {
      return <Link href={notification.link}>{itemContent}</Link>;
    }
    
    return itemContent;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 frosted-glass p-0">
        <div className="p-4 border-b border-border/30 flex justify-between items-center">
            <div>
              <h3 className="font-headline text-lg text-primary">Notifications</h3>
            </div>
            <div className="flex items-center gap-1">
                {hasUnread && (
                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead}>
                    <CheckCheck className="h-4 w-4 mr-1.5"/>
                    Mark all as read
                  </Button>
                )}
                 {notifications.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" aria-label="Clear all notifications">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="frosted-glass">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete all your notifications. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">Clear All</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
        <ScrollArea className="h-[400px]">
            <div className="p-2 space-y-1">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <LoadingSpinner />
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map(notification => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-sm">No new notifications.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

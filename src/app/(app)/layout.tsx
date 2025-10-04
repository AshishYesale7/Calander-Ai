
'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState, useRef } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';
import { Preloader } from '@/components/ui/Preloader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Command, MessageSquare } from 'lucide-react';
import CustomizeThemeModal from '@/components/layout/CustomizeThemeModal';
import SettingsModal from '@/components/layout/SettingsModal';
import LegalModal from '@/components/layout/LegalModal';
import TimezoneModal from '@/components/layout/TimezoneModal';
import {
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import NotificationPermissionModal from '@/components/layout/NotificationPermissionModal';
import { useStreakTracker } from '@/hooks/useStreakTracker';
import { PluginProvider } from '@/context/PluginContext';
import { StreakProvider } from '@/context/StreakContext';
import { ChatSidebar } from '@/components/layout/ChatSidebar';
import { saveUserFCMToken } from '@/services/userService';
import type { PublicUserProfile } from '@/services/userService';
import ChatPanel from '@/components/chat/ChatPanel';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';


function AppContent({ children }: { children: ReactNode }) {
  const { user, loading, isSubscribed } = useAuth();
  useStreakTracker(); // Initialize the streak tracker
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const { chattingWith, setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen } = useChat();

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
        router.push('/subscription');
      }
    }
  }, [user, loading, isSubscribed, router, pathname]);

  const requestNotificationPermission = async () => {
    if (!messaging || !user) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.error("VAPID key is missing.");
          toast({ title: 'Configuration Error', description: 'Cannot enable notifications without a VAPID key.', variant: 'destructive'});
          return;
        }
        const fcmToken = await getToken(messaging, { vapidKey });
        
        if (fcmToken) {
            console.log("FCM Token obtained:", fcmToken);
            await saveUserFCMToken(user.uid, fcmToken);
            toast({ title: 'Success!', description: 'You will now receive notifications for upcoming events.' });
        } else {
            throw new Error("Could not retrieve FCM token.");
        }
      } else {
        toast({ title: 'Notifications Denied', description: 'You can enable notifications from your browser settings later.', variant: 'default' });
      }
    } catch (error) {
      console.error("An error occurred while getting notification permission.", error);
      toast({ title: 'Notification Error', description: 'Could not set up notifications. Please try again.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!loading && user && isSubscribed && pathname === '/dashboard') {
      const alreadyShown = sessionStorage.getItem('planModalShown');
      if (!alreadyShown) {
        setIsPlanModalOpen(true);
        sessionStorage.setItem('planModalShown', 'true');
      }
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          setTimeout(() => setIsNotificationModalOpen(true), 3000);
      }
    }
  }, [user, loading, isSubscribed, pathname, toast]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);
  
  useEffect(() => {
    const mainEl = mainScrollRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      const currentScrollY = mainEl.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsBottomNavVisible(false); // Scrolling down
      } else {
        setIsBottomNavVisible(true); // Scrolling up
      }
      lastScrollY.current = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const { isMobile, state: sidebarState } = useSidebar();

  if (loading || !user || (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile'))) {
    return (
      <div className="flex h-screen w-full items-center justify-center preloader-background">
        <Preloader />
      </div>
    );
  }

  const modalProps = {
    setIsCustomizeModalOpen,
    setIsSettingsModalOpen,
    setIsLegalModalOpen,
    setIsTimezoneModalOpen,
    handleToggleFullScreen,
    isFullScreen,
  };
  
  return (
    <>
      <div className="flex min-h-screen">
        <SidebarNav {...modalProps} />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          !isMobile && sidebarState === 'expanded' ? 'md:pl-64' : 'md:pl-12',
          !isMobile && 'md:pr-20' // Space for the new compact chat rail
        )}>
          <Header {...modalProps} />
          <main ref={mainScrollRef} className="flex-1 overflow-auto p-6 pb-24">
            {children}
          </main>
        </div>
        <ChatSidebar />
      </div>
      {chattingWith && (
        <ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} />
      )}
      <TodaysPlanModal isOpen={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onOpenChange={setIsCommandPaletteOpen}
        {...modalProps}
      />
      
      <AnimatePresence>
        {isBottomNavVisible && isMobile && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
          >
            <div className="flex items-center justify-around rounded-full border border-border/30 bg-background/50 p-2 shadow-lg backdrop-blur-md">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20"
                aria-label="Open command palette"
              >
                <Command className="h-5 w-5" />
                <span className="text-xs">Search</span>
              </button>
              <button
                onClick={() => setIsChatSidebarOpen(true)}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20"
                aria-label="Open chat"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Chats</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
      <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
      <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
      <TimezoneModal isOpen={isTimezoneModalOpen} onOpenChange={setIsTimezoneModalOpen} />
      <NotificationPermissionModal
        isOpen={isNotificationModalOpen}
        onOpenChange={setIsNotificationModalOpen}
        onConfirm={requestNotificationPermission}
      />
    </>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <PluginProvider>
        <StreakProvider>
          <ChatProvider>
            <AppContent>{children}</AppContent>
          </ChatProvider>
        </StreakProvider>
      </PluginProvider>
    </SidebarProvider>
  )
}


'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';
import { Preloader } from '@/components/ui/Preloader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Command, PanelLeft } from 'lucide-react';
import CustomizeThemeModal from '@/components/layout/CustomizeThemeModal';
import ProfileModal from '@/components/layout/ProfileModal';
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
import { saveUserFCMToken } from '@/services/userService';
import { useStreakTracker } from '@/hooks/useStreakTracker';
import { PluginProvider } from '@/context/PluginContext';
import { StreakProvider } from '@/context/StreakContext';


function AppContent({ children }: { children: ReactNode }) {
  const { user, loading, isSubscribed } = useAuth();
  useStreakTracker(); // Initialize the streak tracker
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Lifted state for modals
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (!isSubscribed && pathname !== '/subscription') {
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

  // Logic to show modals once per session, ONLY on the dashboard
  useEffect(() => {
    if (!loading && user && isSubscribed && pathname === '/dashboard') {
      const alreadyShown = sessionStorage.getItem('planModalShown');
      if (!alreadyShown) {
        setIsPlanModalOpen(true);
        sessionStorage.setItem('planModalShown', 'true');
      }
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          // Show our custom modal instead of directly calling the browser prompt
          setTimeout(() => setIsNotificationModalOpen(true), 3000);
      }
    }
  }, [user, loading, isSubscribed, pathname, toast]);

  // Keyboard shortcut for command palette
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

  // Fullscreen effect
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
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

  if (loading || !user || (!isSubscribed && pathname !== '/subscription')) {
    return (
      <div className="flex h-screen w-full items-center justify-center preloader-background">
        <Preloader />
      </div>
    );
  }

  const modalProps = {
    setIsCustomizeModalOpen,
    setIsProfileModalOpen,
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
          "flex flex-1 flex-col transition-[padding-left] duration-300 ease-in-out",
          !isMobile && sidebarState === 'expanded' ? 'md:pl-64' : 'md:pl-12'
        )}>
          <Header {...modalProps} />
          <main className="flex-1 overflow-auto p-6 pb-24">
            {children}
          </main>
        </div>
      </div>
      <TodaysPlanModal isOpen={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onOpenChange={setIsCommandPaletteOpen}
        {...modalProps}
      />
      {/* Mobile Spotlight Trigger (Dynamic Island) */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full border border-border/30 bg-background/50 px-3 py-2 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 md:hidden"
        aria-label="Open command palette"
      >
        <Command className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Render Modals Here */}
      <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
      <ProfileModal isOpen={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
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
  // We wrap the content in the providers so they can be used within AppContent
  return (
    <SidebarProvider>
      <PluginProvider>
        <StreakProvider>
          <AppContent>{children}</AppContent>
        </StreakProvider>
      </PluginProvider>
    </SidebarProvider>
  )
}

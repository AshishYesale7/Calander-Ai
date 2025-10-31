
'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header';
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';
import { Preloader } from '@/components/ui/Preloader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import CustomizeThemeModal from '@/components/layout/CustomizeThemeModal';
import SettingsModal from '@/components/layout/SettingsModal';
import LegalModal from '@/components/layout/LegalModal';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import NotificationPermissionModal from '@/components/layout/NotificationPermissionModal';
import { useStreakTracker } from '@/hooks/useStreakTracker';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChatSidebar from '@/components/layout/MobileChatSidebar';
import OfflineIndicator from '@/components/layout/OfflineIndicator';
import { ChatPanelHeader, ChatPanelBody, ChatPanelFooter } from '@/components/chat/ChatPanel';
import MobileMiniChatSidebar from '@/components/layout/MobileMiniChatSidebar';
import ReclamationModal from '@/components/auth/ReclamationModal';
import DesktopChatSidebar from './DesktopChatSidebar';
import { ChatSidebar } from './ChatSidebar';
import OnboardingModal from '@/components/auth/OnboardingModal';
import DesktopCommandBar from './DesktopCommandBar';
import MobileBottomNav from './MobileBottomNav';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { saveUserFCMToken } from '@/services/userService';
import { GlobalCallUI } from '@/context/ChatProviderWrapper';

function ChatAndCallUI() {
  const { 
      chattingWith, setChattingWith,
      isChatSidebarOpen, setIsChatSidebarOpen, 
      ongoingCall, 
      ongoingAudioCall,
      isPipMode,
  } = useChat();
  const isMobile = useIsMobile();
  const isChatPanelVisible = !!chattingWith;
  
  const isVideoCallActive = !!(ongoingCall);
  const isAudioCallActive = !!(ongoingAudioCall);
  // An active call view is only when a video is fullscreen. Audio and PiP are overlays.
  const isCallViewActive = isVideoCallActive && !isPipMode;

  if (isMobile || isCallViewActive) return null;

  return (
    <AnimatePresence initial={false}>
      {isChatSidebarOpen ? (
        <motion.div
          key="desktop-chat-full"
          initial={{ width: 80 }}
          animate={{ width: 352 }}
          exit={{ width: 80 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full overflow-hidden"
        >
          <DesktopChatSidebar />
        </motion.div>
      ) : (
        <motion.div
          key="desktop-chat-collapsed"
          initial={{ width: 352 }}
          animate={{ width: 80 }}
          exit={{ width: 352 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full overflow-hidden"
        >
          <ChatSidebar onToggleCollapse={() => setIsChatSidebarOpen(true)} />
        </motion.div>
      )}
      {isChatPanelVisible && (
        <motion.div
          key="desktop-chat-panel"
          initial={{ width: 0 }}
          animate={{ width: 352 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full overflow-hidden border-l border-border/30"
        >
          <div className="flex flex-col h-full bg-background">
            {chattingWith && <ChatPanelHeader user={chattingWith} onClose={() => setChattingWith(null)} />}
            {chattingWith && <ChatPanelBody user={chattingWith} />}
            <ChatPanelFooter />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AppContentProps {
  children: ReactNode;
  onFinishOnboarding: () => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  hiddenWidgets: Set<string>;
  handleToggleWidget: (id: string) => void;
}

export default function AppContent({ 
  children, 
  onFinishOnboarding,
  isEditMode,
  setIsEditMode,
  hiddenWidgets,
  handleToggleWidget,
}: AppContentProps) {
  const { user, loading, isSubscribed, onboardingCompleted } = useAuth();
  
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    useStreakTracker();
    
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const bottomNavRef = useRef<HTMLDivElement>(null);
    
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
    const lastScrollY = useRef(0);

    const [search, setSearch] = useState('');
    
    const { setOpen: setSidebarOpen, state: sidebarState } = useSidebar();
    
    const { 
      chattingWith, 
      isChatSidebarOpen, setIsChatSidebarOpen, 
      isChatInputFocused, 
      ongoingCall, 
      ongoingAudioCall,
      isPipMode,
  } = useChat();
    
    const isPendingDeletion = user?.deletionStatus === 'PENDING_DELETION';
    const isChatPanelVisible = !!chattingWith;

  useEffect(() => {
    // If the full chat is open, auto-collapse the main sidebar.
    const fullChatOpen = isChatSidebarOpen && chattingWith;
    if (!isMobile && fullChatOpen && sidebarState === 'expanded') {
      setSidebarOpen(false);
    }
  }, [chattingWith, isChatSidebarOpen, isMobile, sidebarState, setSidebarOpen]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/signin');
    } else if (onboardingCompleted && !isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
      router.push('/subscription');
    }
  }, [user, loading, isSubscribed, router, pathname, onboardingCompleted]);
  
  const requestNotificationPermission = async () => {
    if (!messaging || !user) {
      toast({ title: 'Error', description: 'Push notifications not supported or not signed in.', variant: 'destructive' });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("VAPID key is not set in environment variables.");
            throw new Error("Push notification setup is incomplete.");
        }
        const fcmToken = await getToken(messaging, { vapidKey });
        if (fcmToken) {
            await saveUserFCMToken(user.uid, fcmToken);
            toast({ title: 'Success', description: 'Push notifications enabled! You can now receive reminders.' });
        } else {
            throw new Error("Could not retrieve notification token.");
        }
      } else {
        toast({ title: 'Notifications Denied', description: 'You can enable them later in your browser settings.', variant: 'default' });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({ title: 'Error', description: 'Could not enable push notifications.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!loading && user && isSubscribed && pathname === '/dashboard' && onboardingCompleted) {
      const alreadyShown = sessionStorage.getItem('planModalShown');
      if (!alreadyShown) {
        setIsPlanModalOpen(true);
        sessionStorage.setItem('planModalShown', 'true');
      }
      
      const notificationPromptDismissed = localStorage.getItem('notificationPromptDismissed');
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && !notificationPromptDismissed) {
          setTimeout(() => setIsNotificationModalOpen(true), 3000);
      }
    }
  }, [user, loading, isSubscribed, pathname, toast, onboardingCompleted]);
  
  useEffect(() => {
    let currentIndex = 0;
    const colorPairs = [
        { hue1: 320, hue2: 280 }, { hue1: 280, hue2: 240 },
        { hue1: 240, hue2: 180 }, { hue1: 180, hue2: 140 },
        { hue1: 140, hue2: 60 },  { hue1: 60, hue2: 30 },
        { hue1: 30, hue2: 0},    { hue1: 0, hue2: 320 },
    ];
    const colorInterval = setInterval(() => {
        // Target both the desktop bar and the mobile bar if they exist
        const desktopBar = document.querySelector('.desktop-command-bar-glow') as HTMLElement;
        const mobileBar = bottomNavRef.current;
        const cmdkDialog = document.querySelector('.cmdk-dialog-border-glow') as HTMLElement;

        const nextColor = colorPairs[currentIndex];
        
        if (desktopBar) {
            desktopBar.style.setProperty('--hue1', String(nextColor.hue1));
            desktopBar.style.setProperty('--hue2', String(nextColor.hue2));
        }
        if (mobileBar) {
            mobileBar.style.setProperty('--hue1', String(nextColor.hue1));
            mobileBar.style.setProperty('--hue2', String(nextColor.hue2));
        }
        if (cmdkDialog) {
            cmdkDialog.style.setProperty('--hue1', String(nextColor.hue1));
            cmdkDialog.style.setProperty('--hue2', String(nextColor.hue2));
        }

        currentIndex = (currentIndex + 1) % colorPairs.length;
    }, 3000);
    return () => clearInterval(colorInterval);
  }, []);
  
  useEffect(() => {
    const mainEl = mainScrollRef.current;
    if (!mainEl) return;
  
    const handleScroll = () => {
      const currentScrollY = mainEl.scrollTop;
      
      // For Mobile Nav
      if (isMobile) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsBottomNavVisible(false);
        } else {
          setIsBottomNavVisible(true);
        }
      }
      
      // For Desktop Command Bar
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
  
      lastScrollY.current = currentScrollY;
    };
  
    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Preloader />
      </div>
    );
  }

  if (isPendingDeletion) {
    return (
        <div className="h-screen w-full flex-col">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50"></div>
            <ReclamationModal />
            <div className="flex-1 opacity-20 pointer-events-none">{children}</div>
        </div>
    );
  }
  
  if (!onboardingCompleted) {
    return <OnboardingModal onFinish={onFinishOnboarding} />;
  }
  
  const modalProps = {
    setIsCustomizeModalOpen, setIsSettingsModalOpen, setIsLegalModalOpen,
  };
  
  const isVideoCallActive = !!(ongoingCall);
  const isCallViewActive = isVideoCallActive && !isPipMode;

  return (
    <>
      <OfflineIndicator />
      <GlobalCallUI />
        
      <div className={cn(
          'relative z-0 flex h-screen w-full overflow-hidden',
          isPendingDeletion && 'pointer-events-none blur-sm'
      )}>
        
        <div className={cn('contents', isCallViewActive && 'hidden md:contents')}>
          <SidebarNav {...modalProps} handleToggleFullScreen={() => {}} isFullScreen={false} />
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <Header 
            {...modalProps} 
            handleToggleFullScreen={() => {}} 
            isFullScreen={false}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            hiddenWidgets={hiddenWidgets}
            handleToggleWidget={handleToggleWidget}
          />
          <div className="flex flex-1 min-h-0 min-w-0">
              <main ref={mainScrollRef} className={cn(
                  "flex-1 overflow-y-auto p-6 pb-24 md:pb-6 transition-[margin-left] duration-300",
                  !isMobile && sidebarState === 'expanded' && !isCallViewActive && "md:ml-64",
                  !isMobile && sidebarState === 'collapsed' && !isCallViewActive && "md:ml-12"
              )}>
                {React.cloneElement(children as React.ReactElement, { 
                    isEditMode, 
                    setIsEditMode,
                    hiddenWidgets,
                    handleToggleWidget
                })}
              </main>
              <ChatAndCallUI />
          </div>
        </div>
        
        {isMobile && isChatSidebarOpen && !isCallViewActive && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {chattingWith ? (
              <div className="flex flex-col h-full">
                <div className="fixed top-0 left-0 right-0 z-20">
                  <ChatPanelHeader user={chattingWith} onClose={() => {}} />
                </div>
                <div className="flex flex-1 min-h-0 pt-14 pb-20">
                    <div className={cn(
                      "h-full transition-all duration-300 overflow-hidden border-r border-border/30",
                      isChatInputFocused ? "w-0" : "w-[25%]"
                    )}>
                        <MobileMiniChatSidebar />
                    </div>
                    <div className="flex-1 flex flex-col relative">
                        <ChatPanelBody user={chattingWith} />
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 z-20">
                    <ChatPanelFooter />
                </div>
              </div>
            ) : (
              <MobileChatSidebar />
            )}
          </div>
        )}

        <TodaysPlanModal isOpen={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
        
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onOpenChange={setIsCommandPaletteOpen} 
          search={search}
          setSearch={setSearch}
          {...modalProps} 
          handleToggleFullScreen={() => {}} 
          isFullScreen={false}
        />
        
        <AnimatePresence>
          {!isMobile && <DesktopCommandBar scrollDirection={scrollDirection} />}

          {isMobile && isBottomNavVisible && !isChatInputFocused && !isCallViewActive && !isChatSidebarOpen && (
                <MobileBottomNav
                    onCommandClick={() => setIsCommandPaletteOpen(true)}
                    onChatClick={() => setIsChatSidebarOpen(true)}
                    bottomNavRef={bottomNavRef}
                />
            )}
        </AnimatePresence>
        
        <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
        <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
        <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
        <NotificationPermissionModal isOpen={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen} onConfirm={requestNotificationPermission} />
      </div>
    </>
  );
}

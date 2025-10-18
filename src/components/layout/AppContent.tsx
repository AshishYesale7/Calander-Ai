'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';
import { Preloader } from '@/components/ui/Preloader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import CustomizeThemeModal from '@/components/layout/CustomizeThemeModal';
import SettingsModal from '@/components/layout/SettingsModal';
import LegalModal from '@/components/layout/LegalModal';
import TimezoneModal from '@/components/layout/TimezoneModal';
import {
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { messaging } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import NotificationPermissionModal from '@/components/layout/NotificationPermissionModal';
import { useStreakTracker } from '@/hooks/useStreakTracker';
import { useChat } from '@/context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, collection, query, where, doc, getDoc, type DocumentData, or, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CallData, CallType } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChatSidebar from '@/components/layout/MobileChatSidebar';
import OnboardingModal from '@/components/auth/OnboardingModal';
import OfflineIndicator from '@/components/layout/OfflineIndicator';
import { ChatPanelHeader, ChatPanelBody, ChatPanelFooter } from '@/components/chat/ChatPanel';
import { Button } from '../ui/button';
import { Command, MessageSquare } from 'lucide-react';
import MobileMiniChatSidebar from '@/components/layout/MobileMiniChatSidebar';
import DesktopBottomNav from '@/components/layout/DesktopBottomNav';
import ReclamationModal from '@/components/auth/ReclamationModal';
import DesktopChatSidebar from './DesktopChatSidebar';
import { ChatSidebar } from './ChatSidebar';


function ChatAndCallUI() {
    const { 
      chattingWith, 
      isChatSidebarOpen, setIsChatSidebarOpen, 
      ongoingCall, 
      ongoingAudioCall,
      isPipMode,
  } = useChat();
  const isMobile = useIsMobile();
  const isChatPanelVisible = !!chattingWith;
  
  const isVideoCallActive = !!(ongoingCall);
  const isAudioCallActive = !!(ongoingAudioCall);
  const isCallViewActive = (isVideoCallActive || isAudioCallActive) && !isPipMode;

  return (
    <>
       {/* Desktop Chat Sidebars */}
       {!isMobile && !isCallViewActive && (
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
                       {chattingWith && <ChatPanelHeader user={chattingWith} onClose={() => {}} />}
                       {chattingWith && <ChatPanelBody user={chattingWith} />}
                       <ChatPanelFooter />
                   </motion.div>
              )}
          </AnimatePresence>
      )}
    </>
  )
}


export default function AppContent({ children, onFinishOnboarding }: { children: ReactNode, onFinishOnboarding: () => void }) {
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
    const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
    const lastScrollY = useRef(0);
    
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
    if (!isMobile && chattingWith && sidebarState === 'expanded') {
        setSidebarOpen(false);
    }
  }, [chattingWith, isMobile, sidebarState, setSidebarOpen]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/signin');
    } else if (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
      router.push('/subscription');
    }
  }, [user, loading, isSubscribed, router, pathname]);
  
   const requestNotificationPermission = async () => {
    if (!messaging || !user) {
      toast({ title: 'Error', description: 'Push notifications not supported or not signed in.', variant: 'destructive' });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) throw new Error("VAPID key is missing.");
        const fcmToken = await getToken(messaging, { vapidKey });
        // await saveUserFCMToken(user.uid, fcmToken);
        toast({ title: 'Success', description: 'Push notifications enabled!' });
      } else {
        toast({ title: 'Notifications Denied', variant: 'default' });
      }
    } catch (error) {
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
    let currentIndex = 0;
    const colorPairs = [
        { hue1: 320, hue2: 280 }, { hue1: 280, hue2: 240 },
        { hue1: 240, hue2: 180 }, { hue1: 180, hue2: 140 },
        { hue1: 140, hue2: 60 },  { hue1: 60, hue2: 30 },
        { hue1: 30, hue2: 0},    { hue1: 0, hue2: 320 },
    ];
    const colorInterval = setInterval(() => {
        const navElement = bottomNavRef.current;
        const cmdkElement = document.querySelector('.cmdk-dialog-border-glow') as HTMLElement;
        const nextColor = colorPairs[currentIndex];
        if (navElement) {
            navElement.style.setProperty('--hue1', String(nextColor.hue1));
            navElement.style.setProperty('--hue2', String(nextColor.hue2));
        }
        if (cmdkElement) {
            cmdkElement.style.setProperty('--hue1', String(nextColor.hue1));
            cmdkElement.style.setProperty('--hue2', String(nextColor.hue2));
        }
        currentIndex = (currentIndex + 1) % colorPairs.length;
    }, 3000);
    return () => clearInterval(colorInterval);
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
        setIsBottomNavVisible(false);
      } else {
        setIsBottomNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

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
    return (
      <div className="h-screen w-full flex-col">
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50"></div>
        <OnboardingModal onFinish={onFinishOnboarding} />
        <div className="flex-1 opacity-20 pointer-events-none">{children}</div>
      </div>
    );
  }

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const modalProps = {
    setIsCustomizeModalOpen, setIsSettingsModalOpen, setIsLegalModalOpen,
    setIsTimezoneModalOpen, handleToggleFullScreen, isFullScreen,
  };
  
  const isVideoCallActive = !!(ongoingCall);
  const isAudioCallActive = !!(ongoingAudioCall);
  
  const isCallViewActive = (isVideoCallActive || isAudioCallActive) && !isPipMode;

  return (
    <>
      <div className={cn(
          'relative z-0 flex h-screen w-full overflow-hidden',
          isPendingDeletion && 'pointer-events-none blur-sm'
      )}>
        <OfflineIndicator />
        <div className={cn('contents', isCallViewActive && 'hidden md:contents')}>
          <SidebarNav {...modalProps} />
        </div>
        
        <div className={cn(
          "flex flex-1 min-w-0"
        )}>
          <div className={cn(
              "flex-1 flex flex-col min-h-0 min-w-0 transition-[margin-left] duration-300",
              !isMobile && sidebarState === 'expanded' && !isCallViewActive && "md:ml-64",
              !isMobile && sidebarState === 'collapsed' && !isCallViewActive && "md:ml-12"
          )}>
             <Header {...modalProps} />
            <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
              {children}
            </main>
          </div>
            <ChatAndCallUI />
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
        <CommandPalette isOpen={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} {...modalProps} />
        
        <AnimatePresence>
            {!isMobile && isFullScreen && <DesktopBottomNav onCommandClick={() => setIsCommandPaletteOpen(true)} />}

            {isMobile && isBottomNavVisible && !isChatInputFocused && !isFullScreen && !isChatSidebarOpen && (
                 <motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
                 >
                    <div ref={bottomNavRef} className="bottom-nav-glow open">
                        <span className="shine shine-top"></span><span className="shine shine-bottom"></span>
                        <span className="glow glow-top"></span><span className="glow glow-bottom"></span>
                        <span className="glow glow-bright glow-top"></span><span className="glow glow-bright glow-bottom"></span>
                        <div className="inner">
                            <div className="flex items-center justify-around w-full">
                            <button onClick={() => setIsCommandPaletteOpen(true)} className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20" aria-label="Open command palette">
                                <Command className="h-5 w-5" /><span className="text-xs">Search</span>
                            </button>
                            <button onClick={() => setIsChatSidebarOpen(true)} className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20" aria-label="Open chat">
                                <MessageSquare className="h-5 w-5" /><span className="text-xs">Chats</span>
                            </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
        <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
        <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
        <TimezoneModal isOpen={isTimezoneModalOpen} onOpenChange={setIsTimezoneModalOpen} />
        <NotificationPermissionModal isOpen={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen} onConfirm={requestNotificationPermission} />
      </div>
    </>
  );
}
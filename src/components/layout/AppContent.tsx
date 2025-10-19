
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
import TimezoneModal from '@/components/layout/TimezoneModal';
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
import { Button } from '../ui/button';
import { Command, MessageSquare, XCircle } from 'lucide-react';
import MobileMiniChatSidebar from '@/components/layout/MobileMiniChatSidebar';
import DesktopBottomNav from '@/components/layout/DesktopBottomNav';
import ReclamationModal from '@/components/auth/ReclamationModal';
import DesktopChatSidebar from './DesktopChatSidebar';
import { ChatSidebar } from './ChatSidebar';
import OnboardingModal from '@/components/auth/OnboardingModal';
import DesktopCommandBar from './DesktopCommandBar';
import AiCommandPalette from './AiCommandPalette';


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
  const isCallViewActive = (isVideoCallActive || isAudioCallActive) && !isPipMode;

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
          <div className="flex flex-col h-full bg-black">
            {chattingWith && <ChatPanelHeader user={chattingWith} onClose={() => setChattingWith(null)} />}
            {chattingWith && <ChatPanelBody user={chattingWith} />}
            <ChatPanelFooter />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export default function AppContent({ children, onFinishOnboarding }: { children: ReactNode, onFinishOnboarding: () => void }) {
  const { user, loading, isSubscribed, onboardingCompleted } = useAuth();
  
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const isMobile = useIsMobile();
    useStreakTracker();
    
    const mainScrollRef = useRef<HTMLDivElement>(null);
    
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMobileBottomNavVisible, setIsMobileBottomNavVisible] = useState(true);
    const lastScrollY = useRef(0);
    
    const [search, setSearch] = useState('');
    const commandBarInputRef = useRef<HTMLInputElement>(null);
    const [isAiPaletteOpen, setIsAiPaletteOpen] = useState(false);
    const [navBarPosition, setNavBarPosition] = useState({ x: 0, y: 0 });
    const GAP_BETWEEN_PALETTES = 4;
    const NAVBAR_HEIGHT = 48; // h-12
    const PALETTE_HEIGHT = 450;
    const CLOSE_BUTTON_SIZE = 28; // h-7 w-7

    const isPaletteAbove = useMemo(() => {
        if (typeof window === 'undefined') return true;
        return navBarPosition.y > window.innerHeight / 2;
    }, [navBarPosition.y]);

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
    } else if (onboardingCompleted && !isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
      router.push('/subscription');
    }
  }, [user, loading, isSubscribed, router, pathname, onboardingCompleted]);
  

  const requestNotificationPermission = async () => {
    // Logic remains the same
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
        setIsAiPaletteOpen(false);
      }
      if (e.key === "Escape") {
        setIsAiPaletteOpen(false);
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
        setIsMobileBottomNavVisible(false);
      } else {
        setIsMobileBottomNavVisible(true);
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
    return <OnboardingModal onFinish={onFinishOnboarding} />;
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
        
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <Header {...modalProps} />
          <div className="flex flex-1 min-h-0 min-w-0">
              <main ref={mainScrollRef} className={cn(
                  "flex-1 overflow-y-auto p-6 pb-24 md:pb-6 transition-[margin-left] duration-300",
                  !isMobile && sidebarState === 'expanded' && !isCallViewActive && "md:ml-64",
                  !isMobile && sidebarState === 'collapsed' && !isCallViewActive && "md:ml-12"
              )}>
                {children}
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
        
        <AnimatePresence>
            {!isMobile && isAiPaletteOpen && (
                <AiCommandPalette
                    onOpenChange={setIsAiPaletteOpen}
                    search={search}
                    setSearch={setSearch}
                    modalProps={modalProps}
                    navBarPosition={navBarPosition}
                    isPaletteAbove={isPaletteAbove}
                    gap={GAP_BETWEEN_PALETTES}
                    paletteHeight={PALETTE_HEIGHT}
                />
            )}
        </AnimatePresence>

        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onOpenChange={setIsCommandPaletteOpen} 
          search={search}
          setSearch={setSearch}
          {...modalProps} 
        />
        
        <AnimatePresence>
            {isMobile && isMobileBottomNavVisible && !isChatInputFocused && !isFullScreen && !isChatSidebarOpen && (
                 <motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
                 >
                    <div className="bottom-nav-glow open">
                        <span className="shine"></span><span className="shine shine-bottom"></span>
                        <span className="glow"></span><span className="glow glow-bottom"></span>
                        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>
                        <div className="inner">
                          <div className="flex items-center justify-around w-full">
                            <button onClick={() => setIsCommandPaletteOpen(true)} className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20 hover:text-foreground transition-colors" aria-label="Open command palette">
                                <Command className="h-5 w-5" /><span className="text-xs">Search</span>
                            </button>
                            <button onClick={() => setIsChatSidebarOpen(true)} className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20 hover:text-foreground transition-colors" aria-label="Open chat">
                                <MessageSquare className="h-5 w-5" /><span className="text-xs">Chats</span>
                            </button>
                          </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {!isMobile && !isFullScreen && !isCallViewActive && (
              <DesktopCommandBar 
                onOpenCommandPalette={() => setIsAiPaletteOpen(true)}
                search={search}
                setSearch={setSearch}
                inputRef={commandBarInputRef}
                onDrag={(e, info) => {
                    const newY = navBarPosition.y + info.delta.y;
                    setNavBarPosition({ x: 0, y: newY });
                }}
              />
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

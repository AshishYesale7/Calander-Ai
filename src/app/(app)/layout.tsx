
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
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { onSnapshot, collection, query, where, doc, getDoc, type DocumentData, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CallData } from '@/types';
import { createCall, updateCallStatus } from '@/services/callService';
import IncomingCallNotification from '@/components/chat/IncomingCallNotification';
import OutgoingCallNotification from '@/components/chat/OutgoingCallNotification';
import VideoCallView from '@/components/chat/VideoCallView';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChatSidebar from '@/components/layout/MobileChatSidebar';


const ACTIVE_CALL_SESSION_KEY = 'activeCallId';

const useCallNotifications = () => {
    const { user } = useAuth();
    const { outgoingCall, setOutgoingCall, ongoingCall, setOngoingCall } = useChat();
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
    const [otherUserInCall, setOtherUserInCall] = useState<PublicUserProfile | null>(null);
    const [isPipMode, setIsPipMode] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const pipControls = useAnimation();
    const [pipSize, setPipSize] = useState({ width: 320, height: 240 });
    const [pipSizeMode, setPipSizeMode] = useState<'small' | 'medium' | 'large'>('medium');

    const [activeCallId, setActiveCallId] = useState<string | null>(null);

    useEffect(() => {
        const sizes = {
            small: { width: 240, height: 180 },
            medium: { width: 320, height: 240 },
            large: { width: 400, height: 300 },
        };
        if (isPipMode) {
            setPipSize(sizes[pipSizeMode]);
        }
    }, [pipSizeMode, isPipMode]);

    const setAndStoreActiveCallId = (callId: string | null) => {
        setActiveCallId(callId);
        if (typeof window !== 'undefined') {
            if (callId) {
                sessionStorage.setItem(ACTIVE_CALL_SESSION_KEY, callId);
            } else {
                sessionStorage.removeItem(ACTIVE_CALL_SESSION_KEY);
                setIsPipMode(false);
            }
        }
    };
    
    const endCall = useCallback((callIdToEnd?: string) => {
        const id = callIdToEnd || activeCallId;
        if (id) {
            updateCallStatus(id, 'ended');
            setOngoingCall(null);
            setOutgoingCall(null);
            setAndStoreActiveCallId(null);
            setOtherUserInCall(null);
        }
    }, [activeCallId, setOngoingCall, setOutgoingCall]);

    // This new effect handles cleanup when the user refreshes or closes the tab.
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (activeCallId) {
                endCall(activeCallId);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeCallId, endCall]);

    useEffect(() => {
        if (!outgoingCall || !user) return;
        
        const callTimeout = setTimeout(() => {
            if (outgoingCall && !ongoingCall) {
                const callIdToCancel = [user.uid, outgoingCall.uid].sort().join('_');
                endCall(callIdToCancel);
            }
        }, 20000);

        return () => clearTimeout(callTimeout);
    }, [outgoingCall, ongoingCall, user, endCall]);
    
    useEffect(() => {
        if (!activeCallId || !db || !user) return;

        const callDocRef = doc(db, 'calls', activeCallId);
        const unsubscribe = onSnapshot(callDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const callData = { id: docSnap.id, ...docSnap.data() } as CallData;
                
                if (callData.status === 'answered' && !ongoingCall) {
                    setOutgoingCall(null);
                    setOngoingCall(callData);
                    setIncomingCall(null);
                    
                    const otherUserId = callData.callerId === user.uid ? callData.receiverId : callData.callerId;
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        setOtherUserInCall({ uid: userDoc.id, ...userDoc.data() } as PublicUserProfile);
                    }
                } else if (callData.status === 'declined' || callData.status === 'ended') {
                    setOngoingCall(null);
                    setOutgoingCall(null);
                    setIncomingCall(null);
                    setOtherUserInCall(null);
                    setAndStoreActiveCallId(null);
                }
            } else {
                setOngoingCall(null);
                setOutgoingCall(null);
                setIncomingCall(null);
                setOtherUserInCall(null);
                setAndStoreActiveCallId(null);
            }
        });

        return () => unsubscribe();
    }, [activeCallId, user, ongoingCall, setOngoingCall, setOutgoingCall]);

    useEffect(() => {
        if (!user || !db) return;
        
        const callsCollectionRef = collection(db, 'calls');
        const q = query(
            callsCollectionRef,
            where("receiverId", "==", user.uid),
            where("status", "==", "ringing")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const callDoc = snapshot.docs[0];
                const callData = { id: callDoc.id, ...callDoc.data() } as CallData;
                if (!activeCallId) { 
                    setIncomingCall(callData);
                }
            } else {
                setIncomingCall(null);
            }
        });

        return () => unsubscribe();
    }, [user, activeCallId]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        setAndStoreActiveCallId(incomingCall.id); 
        await updateCallStatus(incomingCall.id, 'answered');
        setIncomingCall(null);
    }, [incomingCall]);

    const declineCall = useCallback(() => {
        if (!incomingCall) return;
        updateCallStatus(incomingCall.id, 'declined');
        setIncomingCall(null);
    }, [incomingCall]);

    const onTogglePipMode = useCallback(() => {
        if (isPipMode) {
            setIsResetting(true);
            pipControls.start({
                x: 0,
                y: 0,
                transition: { duration: 0.3, ease: 'easeOut' }
            }).then(() => {
                setIsPipMode(false);
                setIsResetting(false);
            });
        } else {
            setIsPipMode(true);
        }
    }, [isPipMode, pipControls]);

    const initiateCall = useCallback(async (receiver: PublicUserProfile) => {
      if (!user) return;
      setOutgoingCall(receiver);
      const callId = await createCall({
        callerId: user.uid,
        callerName: user.displayName || 'Anonymous',
        callerPhotoURL: user.photoURL,
        receiverId: receiver.uid,
        status: 'ringing'
      });
      setAndStoreActiveCallId(callId);
    }, [user, setOutgoingCall]);
    
    return { 
      incomingCall, 
      acceptCall, 
      declineCall, 
      ongoingCall,
      outgoingCall,
      initiateCall,
      otherUserInCall, 
      endCall, 
      setActiveCallId: setAndStoreActiveCallId, 
      isPipMode,
      onTogglePipMode,
      pipControls,
      isResetting,
      pipSize,
      setPipSize,
      pipSizeMode,
      setPipSizeMode,
    };
};


function AppContent({ children }: { children: ReactNode }) {
  const { user, loading, isSubscribed } = useAuth();
  useStreakTracker();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
  
  const { chattingWith, setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen, isChatInputFocused } = useChat();
  const { 
      incomingCall, acceptCall, declineCall, 
      ongoingCall, outgoingCall, initiateCall, 
      otherUserInCall, endCall, 
      isPipMode, onTogglePipMode, pipControls, isResetting,
      pipSize, setPipSize, pipSizeMode, setPipSizeMode
  } = useCallNotifications();

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
  
  const isMobile = useIsMobile();
  const { setOpen: setSidebarOpen, state: sidebarState } = useSidebar();
  const isChatPanelVisible = !!chattingWith;
  
  const [isChatbarCollapsed, setIsChatbarCollapsed] = useState(false);

  useEffect(() => {
    if (!isMobile && chattingWith && sidebarState === 'expanded') {
        setSidebarOpen(false);
    }
  }, [chattingWith, isMobile, sidebarState, setSidebarOpen]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
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
      
      const notificationPromptDismissed = localStorage.getItem('notificationPromptDismissed');
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && !notificationPromptDismissed) {
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
        setIsBottomNavVisible(false);
      } else {
        setIsBottomNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    const colorPairs = [
        { hue1: 320, hue2: 280 }, { hue1: 280, hue2: 240 },
        { hue1: 240, hue2: 180 }, { hue1: 180, hue2: 140 },
        { hue1: 140, hue2: 60 }, { hue1: 60, hue2: 30 },
        { hue1: 30, hue2: 0 }, { hue1: 0, hue2: 320 },
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

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Preloader />
      </div>
    );
  }
  
  if (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
      router.push('/subscription');
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <Preloader />
        </div>
      );
  }

  const modalProps = {
    setIsCustomizeModalOpen, setIsSettingsModalOpen, setIsLegalModalOpen,
    setIsTimezoneModalOpen, handleToggleFullScreen, isFullScreen,
  };
  
  const isMobileChatFocus = isMobile && isChatInputFocused;

  return (
    <div className={cn('relative z-0 flex h-screen w-full overflow-hidden')}>
      <div className={cn(!isMobileChatFocus && 'contents')}>
        <SidebarNav {...modalProps} />
      </div>
      
      <div className={cn( "flex flex-1 min-w-0",
        !isMobile && sidebarState === 'expanded' && "md:ml-64",
        !isMobile && sidebarState === 'collapsed' && "md:ml-12",
        isMobileChatFocus && "hidden"
      )}>
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <Header {...modalProps} />
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-6 pb-24">
            {children}
          </main>
        </div>
        
        <aside className={cn("h-full flex-shrink-0 flex-row-reverse transition-all duration-300 ease-in-out z-40",
            "hidden md:flex",
            ongoingCall && !isPipMode && "hidden",
            isChatSidebarOpen && !isChatPanelVisible && "w-20 chat:w-[18rem]",
            isChatSidebarOpen && isChatPanelVisible && "w-[calc(22rem+5rem)] chat:w-[calc(18rem+22rem)]"
        )}>
           <div className={cn("transition-all duration-300 ease-in-out h-full", isChatPanelVisible ? 'w-[22rem]' : 'w-0')}>
              {chattingWith && (<ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} onInitiateCall={initiateCall} />)}
           </div>
            {isChatSidebarOpen && (
              <div className={cn("transition-all duration-300 ease-in-out h-full", "w-20 chat:w-[18rem]")}>
                <ChatSidebar onToggleCollapse={() => setIsChatbarCollapsed(prev => !prev)} isCollapsed={isChatbarCollapsed}/>
              </div>
            )}
        </aside>
      </div>

      {isMobile && isChatSidebarOpen && !(ongoingCall && !isPipMode) && (
          <div className={cn(
            "fixed inset-0 top-0 z-50 flex h-full",
            isMobileChatFocus && "fixed inset-0"
          )}>
              <div className={cn("h-full transition-all duration-300", chattingWith ? "w-[25%]" : "w-[99%]", isMobileChatFocus && chattingWith ? "hidden" : "block")}>
                  {chattingWith ? (
                    <ChatSidebar onToggleCollapse={() => {}} isCollapsed={true} />
                  ) : (
                    <MobileChatSidebar />
                  )}
              </div>
              <div className={cn("h-full transition-all duration-300 flex flex-col", chattingWith ? (isMobileChatFocus ? "w-full" : "w-[75%]") : "w-[1%]")}>
                  {chattingWith && (
                     <ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} onInitiateCall={initiateCall} />
                  )}
              </div>
          </div>
      )}


      <TodaysPlanModal isOpen={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <CommandPalette isOpen={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} {...modalProps} />
      
      <AnimatePresence>
        {isBottomNavVisible && isMobile && !isChatInputFocused && (
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
      
      {incomingCall && (<IncomingCallNotification call={incomingCall} onAccept={acceptCall} onDecline={declineCall} />)}
      {outgoingCall && !ongoingCall && (<OutgoingCallNotification user={outgoingCall} onCancel={() => endCall()} />)}
      
      {ongoingCall && otherUserInCall && (
        <motion.div
            drag={isPipMode && !isResetting}
            dragMomentum={false}
            animate={pipControls}
            resize={isPipMode ? "both" : undefined}
            onResize={(event) => {
                if (isPipMode) {
                    const target = event.target as HTMLElement;
                    if (target) {
                        setPipSize({ width: target.offsetWidth, height: target.offsetHeight });
                    }
                }
            }}
            className={cn(
                "fixed bg-black z-[100] border border-white/20",
                isPipMode 
                    ? "rounded-xl shadow-2xl cursor-grab active:cursor-grabbing top-4 right-4"
                    : "inset-0"
            )}
            style={isPipMode ? { width: pipSize.width, height: pipSize.height } : {}}
        >
            <VideoCallView 
                call={ongoingCall} 
                otherUser={otherUserInCall} 
                onEndCall={endCall}
                isPipMode={isPipMode}
                onTogglePipMode={onTogglePipMode}
                pipSizeMode={pipSizeMode}
                onTogglePipSizeMode={() => {
                  setPipSizeMode(prev => prev === 'medium' ? 'large' : prev === 'large' ? 'small' : 'medium');
                }}
            />
        </motion.div>
      )}

      <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
      <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
      <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
      <TimezoneModal isOpen={isTimezoneModalOpen} onOpenChange={setIsTimezoneModalOpen} />
      <NotificationPermissionModal isOpen={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen} onConfirm={requestNotificationPermission} />
    </div>
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

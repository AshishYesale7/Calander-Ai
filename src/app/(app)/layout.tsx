
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
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, collection, query, where, doc, getDoc, type DocumentData, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CallData } from '@/types';
import { createCall, updateCallStatus } from '@/services/callService';
import IncomingCallNotification from '@/components/chat/IncomingCallNotification';
import OutgoingCallNotification from '@/components/chat/OutgoingCallNotification';
import VideoCallView from '@/components/chat/VideoCallView';

const ACTIVE_CALL_SESSION_KEY = 'activeCallId';

const useCallNotifications = () => {
    const { user } = useAuth();
    const { outgoingCall, setOutgoingCall, ongoingCall, setOngoingCall } = useChat();
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
    const [otherUserInCall, setOtherUserInCall] = useState<PublicUserProfile | null>(null);
    const [isPipMode, setIsPipMode] = useState(false);
    const [activeCallId, setActiveCallId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(ACTIVE_CALL_SESSION_KEY);
        }
        return null;
    });

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
            // Clean up UI states related to any call
            setOngoingCall(null);
            setOutgoingCall(null);
            setAndStoreActiveCallId(null);
            setOtherUserInCall(null);
        }
    }, [activeCallId, setOngoingCall, setOutgoingCall]);

    // Effect for handling outgoing call timeout
    useEffect(() => {
        if (!outgoingCall || !user) return;
        
        const callTimeout = setTimeout(() => {
            if (outgoingCall && !ongoingCall) { // Check if still in outgoing state and not answered
                const callIdToCancel = [user.uid, outgoingCall.uid].sort().join('_');
                endCall(callIdToCancel);
            }
        }, 20000); // 20 seconds timeout

        return () => clearTimeout(callTimeout);
    }, [outgoingCall, ongoingCall, user, endCall]);
    

    // Effect to listen for changes on a single active call (either incoming or outgoing)
    useEffect(() => {
        if (!activeCallId || !db || !user) return;

        const callDocRef = doc(db, 'calls', activeCallId);
        const unsubscribe = onSnapshot(callDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const callData = { id: docSnap.id, ...docSnap.data() } as CallData;
                
                // Transition from ringing to answered
                if (callData.status === 'answered' && !ongoingCall) {
                    setOutgoingCall(null); // Clear outgoing call UI
                    setOngoingCall(callData);
                    setIncomingCall(null);
                    
                    const otherUserId = callData.callerId === user.uid ? callData.receiverId : callData.callerId;
                    const userDoc = await getDoc(doc(db, 'users', otherUserId));
                    if (userDoc.exists()) {
                        setOtherUserInCall({ uid: userDoc.id, ...userDoc.data() } as PublicUserProfile);
                    }
                } else if (callData.status === 'declined' || callData.status === 'ended') {
                    // This is the key change: when the call document indicates the call is over,
                    // immediately nullify the state to unmount the VideoCallView.
                    setOngoingCall(null);
                    setOutgoingCall(null);
                    setIncomingCall(null);
                    setOtherUserInCall(null);
                    setAndStoreActiveCallId(null);
                }
            } else { // Document was deleted or does not exist anymore
                setOngoingCall(null);
                setOutgoingCall(null);
                setIncomingCall(null);
                setOtherUserInCall(null);
                setAndStoreActiveCallId(null);
            }
        });

        return () => unsubscribe();
    }, [activeCallId, user, ongoingCall, setOngoingCall, setOutgoingCall]);

    // Effect to listen for NEW incoming calls for the current user
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
        setIncomingCall(null); // Clear the incoming call notification
    }, [incomingCall]);

    const declineCall = useCallback(() => {
        if (!incomingCall) return;
        updateCallStatus(incomingCall.id, 'declined');
        setIncomingCall(null);
    }, [incomingCall]);

    const onTogglePipMode = useCallback(() => {
      setIsPipMode(prev => !prev);
    }, []);

    const initiateCall = useCallback(async (receiver: PublicUserProfile) => {
      if (!user) return;
      
      setOutgoingCall(receiver); // Show outgoing call UI
      
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
    };
};


function AppContent({ children }: { children: ReactNode }) {
  const { user, loading, isSubscribed } = useAuth();
  useStreakTracker(); // Initialize the streak tracker
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
  
  const { chattingWith, setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen } = useChat();
  const { incomingCall, acceptCall, declineCall, ongoingCall, outgoingCall, initiateCall, otherUserInCall, endCall, setActiveCallId, isPipMode, onTogglePipMode } = useCallNotifications();


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
  
  const { isMobile, state: sidebarState, setOpen: setSidebarOpen } = useSidebar();
  const isChatPanelVisible = !!chattingWith;
  const isChatVisible = isChatSidebarOpen || isChatPanelVisible;

  // Auto-collapses the main sidebar when chat is opened on desktop
  useEffect(() => {
    if (!isMobile && isChatVisible) {
        setSidebarOpen(false);
    }
  }, [isChatVisible, isMobile, setSidebarOpen]);

  // When call goes into PiP mode, close the chat panel
  useEffect(() => {
    if (isPipMode && chattingWith) {
        setChattingWith(null);
    }
  }, [isPipMode, chattingWith, setChattingWith]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
        // Allow access to leaderboard and profile pages even if not subscribed
        // But redirect from other pages if not subscribed.
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

  useEffect(() => {
    let currentIndex = 0;
    const colorPairs = [
        { hue1: 320, hue2: 280 }, // Pink / Purple
        { hue1: 280, hue2: 240 }, // Purple / Blue
        { hue1: 240, hue2: 180 }, // Blue / Teal
        { hue1: 180, hue2: 140 }, // Teal / Green
        { hue1: 140, hue2: 60 },  // Green / Yellow
        { hue1: 60, hue2: 30 },   // Yellow / Orange
        { hue1: 30, hue2: 0 },    // Orange / Red
        { hue1: 0, hue2: 320 },   // Red / Pink
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Preloader />
      </div>
    );
  }
  
  if (!isSubscribed && pathname !== '/subscription' && pathname !== '/leaderboard' && !pathname.startsWith('/profile')) {
      router.push('/subscription');
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
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
    <div className='relative z-0'>
      <div className="flex min-h-screen w-full">
        <SidebarNav {...modalProps} />
        
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          !isMobile && sidebarState === 'expanded' && "ml-64",
          !isMobile && sidebarState === 'collapsed' && "ml-12"
        )}>
            <Header {...modalProps} />
            <main ref={mainScrollRef} className="flex-1 overflow-auto p-6 pb-24">
              {children}
            </main>
        </div>
        
        <aside className={cn(
          "h-full flex-shrink-0 flex flex-row-reverse transition-all duration-300 ease-in-out",
          isChatVisible ? "w-[45rem]" : "w-0",
          "hidden md:flex"
        )}>
           <div className={cn(
             "transition-all duration-300 ease-in-out h-full",
             isChatPanelVisible ? 'w-[25rem]' : 'w-0'
           )}>
              {chattingWith && (
                <ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} onInitiateCall={initiateCall} />
              )}
           </div>
           <div className={cn(
             "transition-all duration-300 ease-in-out h-full",
             isChatSidebarOpen ? "w-[20rem]" : "w-0"
           )}>
             <ChatSidebar />
           </div>
        </aside>

        {/* Mobile-only full-screen chat view */}
        {isMobile && chattingWith && !ongoingCall && (
            <div className="fixed inset-0 top-16 z-40 bg-background">
                <ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} onInitiateCall={initiateCall} />
            </div>
        )}
      </div>

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
            <div ref={bottomNavRef} className="bottom-nav-glow open">
                <span className="shine shine-top"></span>
                <span className="shine shine-bottom"></span>
                <span className="glow glow-top"></span>
                <span className="glow glow-bottom"></span>
                <span className="glow glow-bright glow-top"></span>
                <span className="glow glow-bright glow-bottom"></span>
                <div className="inner">
                  <div className="flex items-center justify-around w-full">
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
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {incomingCall && (
        <IncomingCallNotification
          call={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {outgoingCall && !ongoingCall && (
        <OutgoingCallNotification
            user={outgoingCall}
            onCancel={() => endCall()}
        />
      )}
      
      {ongoingCall && otherUserInCall && !isPipMode && (
        <div className="fixed inset-0 z-[100] bg-black">
          <VideoCallView 
            call={ongoingCall} 
            otherUser={otherUserInCall} 
            onEndCall={endCall} 
            isPipMode={false}
            onTogglePipMode={onTogglePipMode}
          />
        </div>
      )}

      {ongoingCall && otherUserInCall && isPipMode && (
          <motion.div 
            drag
            dragMomentum={false}
            className="fixed top-4 right-4 z-[100] w-80 h-[22rem] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20 cursor-grab active:cursor-grabbing"
           >
             <VideoCallView 
                call={ongoingCall} 
                otherUser={otherUserInCall} 
                onEndCall={endCall}
                isPipMode={true}
                onTogglePipMode={onTogglePipMode}
             />
          </motion.div>
      )}


      <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
      <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
      <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
      <TimezoneModal isOpen={isTimezoneModalOpen} onOpenChange={setIsTimezoneModalOpen} />
      <NotificationPermissionModal
        isOpen={isNotificationModalOpen}
        onOpenChange={setIsNotificationModalOpen}
        onConfirm={requestNotificationPermission}
      />
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


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
import { onSnapshot, collection, query, where, doc, getDoc, type DocumentData, or, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CallData, CallType } from '@/types';
import { createCall, updateCallStatus, saveOffer, saveAnswer, addCallerCandidate, addReceiverCandidate } from '@/services/callService';
import IncomingCallNotification from '@/components/chat/IncomingCallNotification';
import OutgoingCallNotification from '@/components/chat/OutgoingCallNotification';
import VideoCallView from '@/components/chat/VideoCallView';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileChatSidebar from '@/components/layout/MobileChatSidebar';
import DesktopChatSidebar from '@/components/layout/DesktopChatSidebar';
import OnboardingModal from '@/components/auth/OnboardingModal';
import IncomingAudioCall from '@/components/chat/IncomingAudioCall';
import OutgoingAudioCall from '@/components/chat/OutgoingAudioCall';
import AudioCallView from '@/components/chat/AudioCallView';
import OfflineIndicator from '@/components/layout/OfflineIndicator';


const ACTIVE_CALL_SESSION_KEY = 'activeCallId';

// Client-side listener functions
const listenForReceiverCandidates = (callId: string, callback: (candidate: RTCIceCandidate) => void): Unsubscribe => {
    if (!db) throw new Error("Firestore is not initialized.");
    const candidatesCollection = collection(db, 'calls', callId, 'receiverCandidates');
    return onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                callback(new RTCIceCandidate(change.doc.data()));
            }
        });
    });
};

const listenForCallerCandidates = (callId: string, callback: (candidate: RTCIceCandidate) => void): Unsubscribe => {
    if (!db) throw new Error("Firestore is not initialized.");
    const candidatesCollection = collection(db, 'calls', callId, 'callerCandidates');
    return onSnapshot(candidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                callback(new RTCIceCandidate(change.doc.data()));
            }
        });
    });
};

function AppContentWrapper({ children, onFinishOnboarding }: { children: ReactNode, onFinishOnboarding: () => void }) {
    const { user } = useAuth();
    
    // State for video calls
    const [outgoingCall, setOutgoingCall] = useState<PublicUserProfile | null>(null);
    const [ongoingCall, setOngoingCall] = useState<CallData | null>(null);
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

    // State for audio calls
    const [outgoingAudioCall, setOutgoingAudioCall] = useState<PublicUserProfile | null>(null);
    const [ongoingAudioCall, setOngoingAudioCall] = useState<CallData | null>(null);
    const [incomingAudioCall, setIncomingAudioCall] = useState<CallData | null>(null);

    const [otherUserInCall, setOtherUserInCall] = useState<PublicUserProfile | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<RTCPeerConnectionState>('new');
    
    // WebRTC State
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const [isPipMode, setIsPipMode] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const pipControls = useAnimation();
    const [pipSizeMode, setPipSizeMode] = useState<'medium' | 'large'>('medium');
    
    const [isMuted, setIsMuted] = useState(false);

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

    const cleanupWebRTC = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
    }, [localStream, remoteStream]);
    
    const endCall = useCallback((callIdToUpdate?: string) => {
        const id = callIdToUpdate || activeCallId;
        if (id && typeof id === 'string') {
            updateCallStatus(id, 'ended');
        } else {
            console.warn("endCall invoked without a valid callId. Cleaning up local state only.");
        }
        setOngoingCall(null);
        setOutgoingCall(null);
        setOngoingAudioCall(null);
        setOutgoingAudioCall(null);
        setAndStoreActiveCallId(null);
        setOtherUserInCall(null);
        cleanupWebRTC();
    }, [activeCallId, cleanupWebRTC]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (activeCallId) {
                endCall(activeCallId);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeCallId, endCall]);
    
    // This effect initializes and cleans up the WebRTC connection for an ongoing call
    useEffect(() => {
        if (!user || !db || (!ongoingCall && !ongoingAudioCall)) {
            return;
        }
        
        let unsubCall: Unsubscribe | undefined;
        let unsubCallerCandidates: Unsubscribe | undefined;
        let unsubReceiverCandidates: Unsubscribe | undefined;

        const call = ongoingCall || ongoingAudioCall;
        if (!call) return;

        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnectionRef.current = pc;
        
        const isCaller = call.callerId === user.uid;

        pc.onconnectionstatechange = () => setConnectionStatus(pc.connectionState);

        const setupStreamsAndSignaling = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: call.callType === 'video',
                audio: true
            });

            setLocalStream(stream);

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });
            
            const newRemoteStream = new MediaStream();
            setRemoteStream(newRemoteStream);
            
            pc.ontrack = (event) => {
                event.streams[0].getTracks().forEach(track => {
                    newRemoteStream.addTrack(track);
                });
            };

            // Setup ICE candidate listeners
            pc.onicecandidate = event => {
                if (event.candidate) {
                    if (isCaller) addCallerCandidate(call.id, event.candidate.toJSON());
                    else addReceiverCandidate(call.id, event.candidate.toJSON());
                }
            };

            if (isCaller) {
                unsubReceiverCandidates = listenForReceiverCandidates(call.id, candidate => {
                    if (pc.remoteDescription) {
                        pc.addIceCandidate(candidate);
                    }
                });
            } else {
                unsubCallerCandidates = listenForCallerCandidates(call.id, candidate => {
                     if (pc.remoteDescription) {
                        pc.addIceCandidate(candidate);
                    }
                });
            }
            
            if (isCaller) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await saveOffer(call.id, offer);
            }
        };

        unsubCall = onSnapshot(doc(db, 'calls', call.id), async (snapshot) => {
            const data = snapshot.data();
            if (!data || pc.signalingState === 'closed') return;

            if (isCaller && !pc.currentRemoteDescription && data.answer) {
               const answerDescription = new RTCSessionDescription(data.answer);
               await pc.setRemoteDescription(answerDescription);
            } else if (!isCaller && !pc.currentLocalDescription && data.offer) {
                const offerDescription = new RTCSessionDescription(data.offer);
                await pc.setRemoteDescription(offerDescription);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await saveAnswer(call.id, answer);
            }
        });
        
        setupStreamsAndSignaling();

        return () => {
            if (unsubCall) unsubCall();
            if (unsubCallerCandidates) unsubCallerCandidates();
            if (unsubReceiverCandidates) unsubReceiverCandidates();
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        };
    }, [ongoingCall, ongoingAudioCall, user]);


    useEffect(() => {
        if (!user || !db) return;
        const q = query(collection(db, 'calls'), where("receiverId", "==", user.uid), where("status", "==", "ringing"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const callDoc = snapshot.docs[0];
                const callData = { id: callDoc.id, ...callDoc.data() } as CallData;
                if (!activeCallId) { 
                    if (callData.callType === 'video') setIncomingCall(callData);
                    else setIncomingAudioCall(callData);
                }
            } else {
                setIncomingCall(null);
                setIncomingAudioCall(null);
            }
        });
        return () => unsubscribe();
    }, [user, activeCallId]);
    
     useEffect(() => {
        if (!activeCallId || !db || !user) return;
        
        const callDocRef = doc(db, 'calls', activeCallId);
        const unsubscribe = onSnapshot(callDocRef, async (docSnap) => {
            if (!docSnap.exists() || ['declined', 'ended'].includes(docSnap.data()?.status)) {
                endCall(activeCallId);
                return;
            }

            const callData = { id: docSnap.id, ...docSnap.data() } as CallData;
            
            if (callData.status === 'answered' && !ongoingCall && !ongoingAudioCall) {
                const otherUserId = callData.callerId === user.uid ? callData.receiverId : callData.callerId;
                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                
                if (userDoc.exists()) {
                    setOtherUserInCall({ uid: userDoc.id, ...userDoc.data() } as PublicUserProfile);
                }
                
                if (callData.callType === 'video') {
                    setOutgoingCall(null); 
                    setOngoingCall(callData); 
                    setIncomingCall(null);
                } else {
                    setOutgoingAudioCall(null); 
                    setOngoingAudioCall(callData); 
                    setIncomingAudioCall(null);
                }
            }
        });

        return () => unsubscribe();
    }, [activeCallId, user?.uid, ongoingCall, ongoingAudioCall, endCall]);


    const acceptCall = useCallback(async () => {
        const callToAccept = incomingCall || incomingAudioCall;
        if (callToAccept) {
            setAndStoreActiveCallId(callToAccept.id); 
            await updateCallStatus(callToAccept.id, 'answered');
            setIncomingCall(null);
            setIncomingAudioCall(null);
        }
    }, [incomingCall, incomingAudioCall]);

    const declineCall = useCallback(() => {
        const callToDecline = incomingCall || incomingAudioCall;
        if (callToDecline) {
            updateCallStatus(callToDecline.id, 'declined');
            setIncomingCall(null);
            setIncomingAudioCall(null);
        }
    }, [incomingCall, incomingAudioCall]);
    
    const onInitiateCall = useCallback(async (receiver: PublicUserProfile, callType: CallType) => {
        if (!user) return;
        
        if (callType === 'video') {
            setOutgoingCall(receiver);
        } else {
            setOutgoingAudioCall(receiver);
        }

        const callId = await createCall({
            callerId: user.uid,
            callerName: user.displayName || 'Anonymous',
            callerPhotoURL: user.photoURL,
            receiverId: receiver.uid,
            status: 'ringing',
            callType,
        });
        
        setAndStoreActiveCallId(callId);
        
    }, [user]);
    
    const onTogglePipMode = useCallback(() => {
        if (isPipMode) {
            setIsResetting(true);
            pipControls.start({ x: 0, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }).then(() => {
                setIsPipMode(false);
                setIsResetting(false);
            });
        } else {
            setIsPipMode(true);
        }
    }, [isPipMode, pipControls]);

    const onToggleMute = useCallback(() => {
        if(localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            });
        }
    }, [localStream]);

    const pipSize = useMemo(() => {
        return pipSizeMode === 'large' ? { width: 320, height: 240 } : { width: 256, height: 192 };
    }, [pipSizeMode]);

    const contextValue = {
        onInitiateCall,
        outgoingCall, setOutgoingCall,
        ongoingCall, setOngoingCall,
        incomingCall, setIncomingCall,
        outgoingAudioCall, setOutgoingAudioCall,
        ongoingAudioCall, setOngoingAudioCall,
        incomingAudioCall, setIncomingAudioCall,
        acceptCall, declineCall,
        otherUserInCall, endCall,
        localStream, remoteStream,
        isPipMode, onTogglePipMode, pipControls, isResetting,
        pipSize,
        setPipSize: () => {}, 
        pipSizeMode, setPipSizeMode,
        isMuted, onToggleMute,
        connectionStatus,
        peerConnectionRef,
    };
    
    return (
        <ChatProvider value={contextValue}>
            <AppContent onFinishOnboarding={onFinishOnboarding}>
                {children}
            </AppContent>
        </ChatProvider>
    );
}

function AppContent({ children, onFinishOnboarding }: { children: ReactNode, onFinishOnboarding: () => void }) {
  const { user, loading, isSubscribed, onboardingCompleted } = useAuth();
  const { 
      chattingWith, setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen, isChatInputFocused, setIsChatInputFocused,
      outgoingCall, ongoingCall, outgoingAudioCall, ongoingAudioCall,
      incomingCall, incomingAudioCall, acceptCall, declineCall, 
      otherUserInCall, endCall, 
      isPipMode, onTogglePipMode, pipControls, isResetting,
      pipSize, pipSizeMode, setPipSizeMode, isMuted,
      connectionStatus, remoteStream,
  } = useChat();

  const activeCallId = useMemo(() => {
    if (ongoingCall) return ongoingCall.id;
    if (ongoingAudioCall) return ongoingAudioCall.id;
    // During the outgoing phase, we get the ID from the `useChat` hook's state.
    // This requires a bit of a workaround to get the session-stored ID.
    if (outgoingCall || outgoingAudioCall) {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(ACTIVE_CALL_SESSION_KEY);
        }
    }
    return null;
  }, [ongoingCall, ongoingAudioCall, outgoingCall, outgoingAudioCall]);
  
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  useStreakTracker();
  
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const isChatPanelVisible = !!chattingWith;

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        toast({ title: 'Call Failed', description: 'Connection lost. The call has been ended.', variant: 'destructive' });
        endCall();
      }, 15000); // 15-second timeout
    } else if (connectionStatus === 'connected') {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    }
    return () => { if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current) };
  }, [connectionStatus, endCall, toast]);
  
  // This is the timeout for unanswered calls.
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const isOutgoing = outgoingCall || outgoingAudioCall;
    const currentActiveCallId = activeCallId;

    if (isOutgoing && currentActiveCallId) {
        timeoutId = setTimeout(() => {
            if (db && currentActiveCallId) {
                getDoc(doc(db, 'calls', currentActiveCallId)).then(docSnap => {
                    const callIsOngoing = ongoingCall || ongoingAudioCall;
                    if (!callIsOngoing && docSnap.exists() && docSnap.data()?.status === 'ringing') {
                        toast({
                            title: "Call Not Answered",
                            description: "The other user did not pick up.",
                            variant: "default"
                        });
                        updateCallStatus(currentActiveCallId, 'declined');
                    }
                });
            }
        }, 15000); // 15 seconds
    }

    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };
  }, [outgoingCall, outgoingAudioCall, activeCallId, toast, ongoingCall, ongoingAudioCall]);


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
  
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Preloader />
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
  const isVideoCallActive = !!(ongoingCall && otherUserInCall);
  const isAudioCallActive = !!(ongoingAudioCall && otherUserInCall);

  return (
    <div className={cn('relative z-0 flex h-screen w-full overflow-hidden')}>
      <OfflineIndicator />
      <div className={cn(isMobileChatFocus ? 'hidden' : 'contents')}>
        <SidebarNav {...modalProps} />
      </div>
      
      <div className={cn(
        "flex flex-1 min-w-0",
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
        
        <aside className={cn(
            "h-full flex-shrink-0 flex-row-reverse transition-all duration-300 ease-in-out z-40",
            "hidden md:flex",
            (ongoingCall || ongoingAudioCall) && !isPipMode && "hidden",
            isChatSidebarOpen && !isChatPanelVisible && "w-[18rem]",
            isChatSidebarOpen && isChatPanelVisible && "w-[calc(18rem+22rem)]",
            !isChatSidebarOpen && isChatPanelVisible && "w-[calc(5rem+22rem)]",
            !isChatSidebarOpen && !isChatPanelVisible && "w-20"
        )}>
           <div className={cn("transition-all duration-300 ease-in-out h-full w-[22rem]", isChatPanelVisible ? 'block' : 'hidden')}>
              {chattingWith && (<ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} />)}
           </div>
            {isChatSidebarOpen ? (
                <div className="w-[18rem] h-full">
                  <DesktopChatSidebar />
                </div>
              ) : (
                <div className="w-20 h-full">
                    <ChatSidebar onToggleCollapse={() => setIsChatSidebarOpen(true)} />
                </div>
              )
            }
        </aside>
      </div>

      {/* Mobile Chat View */}
      {isMobile && isChatSidebarOpen && !isVideoCallActive && !isAudioCallActive && (
          <div className="fixed inset-0 z-50 flex h-full w-full">
              {/* Sidebar part */}
              <div className={cn(
                "h-full transition-all duration-300",
                chattingWith ? "w-[25%]" : "w-full",
                isMobileChatFocus && chattingWith && "hidden" // Hide sidebar when typing in chat
              )}>
                  {chattingWith ? (
                    <ChatSidebar onToggleCollapse={() => {}} />
                  ) : (
                    <MobileChatSidebar />
                  )}
              </div>
              {/* Chat panel part */}
              {chattingWith && (
                  <div className="h-full w-[75%] flex-1 flex flex-col">
                      <ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} />
                  </div>
              )}
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
      {outgoingCall && !ongoingCall && (<OutgoingCallNotification user={outgoingCall} onCancel={() => updateCallStatus(activeCallId, 'declined')} />)}
      {incomingAudioCall && <IncomingAudioCall call={incomingAudioCall} onAccept={acceptCall} onDecline={declineCall} />}
      {outgoingAudioCall && !ongoingAudioCall && <OutgoingAudioCall user={outgoingAudioCall} onCancel={() => updateCallStatus(activeCallId, 'declined')} />}
      
      {isVideoCallActive && (
        <motion.div
            drag={isPipMode && !isResetting}
            dragMomentum={false}
            animate={pipControls}
            className={cn(
                "fixed bg-black z-[100] border border-white/20",
                isPipMode 
                    ? "rounded-xl shadow-2xl cursor-grab active:cursor-grabbing top-4 right-4" 
                    : "inset-0"
            )}
            style={isPipMode ? { width: pipSize.width, height: pipSize.height } : {}}
        >
            <VideoCallView 
                call={ongoingCall!} 
                otherUser={otherUserInCall!} 
                onEndCall={() => endCall(ongoingCall?.id)}
                isPipMode={isPipMode}
                onTogglePipMode={onTogglePipMode}
                pipSizeMode={pipSizeMode}
                onTogglePipSizeMode={() => setPipSizeMode(prev => prev === 'medium' ? 'large' : 'medium')}
            />
        </motion.div>
      )}

      {isAudioCallActive && (
          <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-5 right-5 z-[200] cursor-grab active:cursor-grabbing"
          >
            <AudioCallView
                call={ongoingAudioCall!}
                otherUser={otherUserInCall!}
                onEndCall={() => endCall(ongoingAudioCall?.id)}
                connectionStatus={connectionStatus}
            />
          </motion.div>
      )}

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
      <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
      <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
      <TimezoneModal isOpen={isTimezoneModalOpen} onOpenChange={setIsTimezoneModalOpen} />
      <NotificationPermissionModal isOpen={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen} onConfirm={requestNotificationPermission} />
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { setOnboardingCompleted } = useAuth();
  return (
    <SidebarProvider>
      <PluginProvider>
        <StreakProvider>
            <AppContentWrapper onFinishOnboarding={() => setOnboardingCompleted(true)}>
              {children}
            </AppContentWrapper>
        </StreakProvider>
      </PluginProvider>
    </SidebarProvider>
  )
}
    


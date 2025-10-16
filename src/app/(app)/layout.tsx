

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
import PermissionRequestModal from '@/components/chat/PermissionRequestModal';


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
    const { toast } = useToast();
    
    // State for video calls
    const [outgoingCall, setOutgoingCall] = useState<PublicUserProfile | null>(null);
    const [ongoingCall, setOngoingCall] = useState<CallData | null>(null);
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

    // State for audio calls
    const [outgoingAudioCall, setOutgoingAudioCall] = useState<PublicUserProfile | null>(null);
    const [ongoingAudioCall, setOngoingAudioCall] = useState<CallData | null>(null);
    const [incomingAudioCall, setIncomingAudioCall] = useState<CallData | null>(null);
    
    const [permissionRequest, setPermissionRequest] = useState<{
      callType: CallType;
      onGrant: () => void;
      onDeny: () => void;
    } | null>(null);


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
    const messageSentSoundRef = useRef<HTMLAudioElement>(null);
    const outgoingRingtoneRef = useRef<HTMLAudioElement>(null);
    const incomingRingtoneRef = useRef<HTMLAudioElement>(null);

    const [activeCallId, setActiveCallId] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(ACTIVE_CALL_SESSION_KEY);
      }
      return null;
    });
    
    const checkAndRequestPermissions = async (callType: CallType): Promise<{ granted: boolean; error?: string }> => {
        if (typeof window === 'undefined' || !navigator.mediaDevices) {
            return { granted: false, error: 'Media devices not supported.' };
        }
        const constraints = callType === 'video' ? { video: true, audio: true } : { audio: true };
        try {
            // Attempt to get the stream. This will trigger the browser permission prompt if necessary.
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // Immediately stop the tracks to release the camera/mic, as we will request it again when the call connects.
            stream.getTracks().forEach(track => track.stop());
            return { granted: true };
        } catch (error: any) {
            console.error("Permission error:", error.name, error.message);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                return { granted: false, error: 'denied' };
            }
            return { granted: false, error: error.message || 'An unknown error occurred.' };
        }
    };
    
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
    
    const declineCall = useCallback(() => {
        const callToDecline = incomingCall || incomingAudioCall;
        if (callToDecline) {
            updateCallStatus(callToDecline.id, 'declined');
            setIncomingCall(null);
            setIncomingAudioCall(null);
        }
    }, [incomingCall, incomingAudioCall]);
    
    const endCall = useCallback((callIdToUpdate?: string, status: 'ended' | 'declined' = 'ended') => {
        const id = callIdToUpdate || activeCallId;
        if (id && typeof id === 'string') {
            updateCallStatus(id, status);
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
            if (incomingCall || incomingAudioCall) {
                declineCall();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeCallId, endCall, incomingCall, incomingAudioCall, declineCall]);


    // This is the timeout for unanswered calls.
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;
        const isOutgoing = outgoingCall || outgoingAudioCall;

        if (isOutgoing && activeCallId) {
            const callIdForTimeout = activeCallId; // Capture the call ID when the effect runs
            timeoutId = setTimeout(() => {
                if (db) {
                    getDoc(doc(db, 'calls', callIdForTimeout)).then(docSnap => {
                        if (docSnap.exists() && docSnap.data()?.status === 'ringing') {
                            toast({
                                title: "Call Not Answered",
                                description: "The other user did not pick up.",
                                variant: "default"
                            });
                            updateCallStatus(callIdForTimeout, 'declined');
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
    }, [outgoingCall, outgoingAudioCall, activeCallId, toast]);
    
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
            if (snapshot.empty) {
                setIncomingCall(null);
                setIncomingAudioCall(null);
                return;
            }
    
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const callData = { id: change.doc.id, ...change.doc.data() } as CallData;
    
                    if (!activeCallId) { 
                        if (callData.callType === 'video') setIncomingCall(callData);
                        else setIncomingAudioCall(callData);
    
                        // Set a timeout to automatically decline the call if not answered
                        const timeoutId = setTimeout(() => {
                            // Before declining, double-check the call status in Firestore
                            const callDocRef = doc(db, 'calls', callData.id);
                            getDoc(callDocRef).then(docSnap => {
                                if (docSnap.exists() && docSnap.data().status === 'ringing') {
                                    updateCallStatus(callData.id, 'declined');
                                }
                            });
                        }, 15000); // 15-second timeout for ghost calls
    
                        // You might want to store this timeoutId to clear it if the user accepts/declines manually
                    }
                } else if (change.type === 'removed') {
                    // Handle if the call document is removed (e.g., call is declined)
                    const callId = change.doc.id;
                    setIncomingCall(prev => (prev && prev.id === callId ? null : prev));
                    setIncomingAudioCall(prev => (prev && prev.id === callId ? null : prev));
                }
            });
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
        if (!callToAccept) return;
    
        const acceptAction = async () => {
            setAndStoreActiveCallId(callToAccept.id);
            await updateCallStatus(callToAccept.id, 'answered');
            setIncomingCall(null);
            setIncomingAudioCall(null);
        };
    
        const { granted, error } = await checkAndRequestPermissions(callToAccept.callType);
        if (granted) {
            await acceptAction();
        } else {
            setPermissionRequest({
                callType: callToAccept.callType,
                onGrant: async () => {
                    const { granted: newGranted, error: newError } = await checkAndRequestPermissions(callToAccept.callType);
                    if (newGranted) {
                        await acceptAction();
                    } else if (newError === 'denied') {
                        setPermissionRequest({ callType: callToAccept.callType, onGrant: () => {}, onDeny: declineCall });
                    } else {
                        declineCall();
                        toast({ title: "Permission Required", description: "Camera and microphone access is needed.", variant: "destructive" });
                    }
                },
                onDeny: declineCall
            });
        }
    }, [incomingCall, incomingAudioCall, toast, declineCall]);
    
    
    const onInitiateCall = useCallback(async (receiver: PublicUserProfile, callType: CallType) => {
        if (!user) return;
    
        const proceedWithCall = async () => {
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
        };
    
        const { granted, error } = await checkAndRequestPermissions(callType);
        if (granted) {
            await proceedWithCall();
        } else {
            setPermissionRequest({
                callType: callType,
                onGrant: async () => {
                    const { granted: grantedAfterPrompt, error: errorAfterPrompt } = await checkAndRequestPermissions(callType);
                    if (grantedAfterPrompt) {
                        await proceedWithCall();
                    } else {
                        toast({
                            title: "Permission Required",
                            description: `You need to grant permission to make a ${callType} call.`,
                            variant: "destructive"
                        });
                    }
                },
                onDeny: () => {}
            });
        }
    }, [user, toast]);
    
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

    const playSendMessageSound = useCallback(() => {
        messageSentSoundRef.current?.play().catch(e => console.warn("Could not play message sound:", e));
    }, []);
    
    // Effect for playing ringtones
    useEffect(() => {
        const isIncoming = !!(incomingCall || incomingAudioCall);
        const isOutgoing = !!(outgoingCall || outgoingAudioCall);
        
        const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
        audioRef.current?.play().catch(e => console.warn("Ringtone playback failed:", e));
        };

        const stopSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };

        if (isIncoming) {
            playSound(incomingRingtoneRef);
            stopSound(outgoingRingtoneRef);
        } else if (isOutgoing) {
            playSound(outgoingRingtoneRef);
            stopSound(incomingRingtoneRef);
        } else {
            stopSound(incomingRingtoneRef);
            stopSound(outgoingRingtoneRef);
        }

        return () => {
            stopSound(incomingRingtoneRef);
            stopSound(outgoingRingtoneRef);
        }
    }, [incomingCall, incomingAudioCall, outgoingCall, outgoingAudioCall]);

    const pipSize = useMemo(() => {
        const baseWidth = pipSizeMode === 'large' ? 320 : 256;
        const baseHeight = pipSizeMode === 'large' ? 240 : 192;
        if (remoteStream && remoteStream.getVideoTracks().length > 0) {
            const settings = remoteStream.getVideoTracks()[0].getSettings();
            if (settings.width && settings.height) {
                const aspectRatio = settings.width / settings.height;
                if (aspectRatio > 1) { // Landscape
                    return { width: baseWidth, height: baseWidth / aspectRatio };
                } else { // Portrait
                    return { width: baseHeight * aspectRatio, height: baseHeight };
                }
            }
        }
        return { width: baseWidth, height: baseHeight }; // Fallback
    }, [pipSizeMode, remoteStream]);

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
        playSendMessageSound,
    };
    
    return (
        <ChatProvider value={contextValue}>
            <AppContent onFinishOnboarding={onFinishOnboarding}>
                {children}
            </AppContent>
            {permissionRequest && (
                <PermissionRequestModal
                    callType={permissionRequest.callType}
                    onGrant={permissionRequest.onGrant}
                    onDeny={permissionRequest.onDeny}
                    onOpenChange={(isOpen) => !isOpen && setPermissionRequest(null)}
                />
            )}
            {/* The audio elements are placed here */}
            <audio ref={messageSentSoundRef} src="https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3" preload="auto" className="hidden"></audio>
            <audio ref={incomingRingtoneRef} src="/assets/ringtone.mp3" preload="auto" loop className="hidden" />
            <audio ref={outgoingRingtoneRef} src="https://cdn.pixabay.com/audio/2022/08/22/audio_1079450c39.mp3" preload="auto" loop className="hidden" />
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

  const activeCallId = useMemo(() => {
    if (ongoingCall) return ongoingCall.id;
    if (ongoingAudioCall) return ongoingAudioCall.id;
    if (outgoingCall || outgoingAudioCall) {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(ACTIVE_CALL_SESSION_KEY);
        }
    }
    return null;
  }, [ongoingCall, ongoingAudioCall, outgoingCall, outgoingAudioCall]);

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

  if (loading) {
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
          <div className={cn(
            "fixed inset-0 z-50 flex h-full w-full flex-col",
            isChatInputFocused ? "h-[calc(100%-env(safe-area-inset-bottom))]" : "h-full"
          )}>
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
                  <div className="h-full w-[75%] flex-1 flex flex-col absolute top-0 right-0">
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
      {outgoingCall && !ongoingCall && (<OutgoingCallNotification user={outgoingCall} onCancel={() => endCall(activeCallId, 'declined')} />)}
      {incomingAudioCall && <IncomingAudioCall call={incomingAudioCall} onAccept={acceptCall} onDecline={declineCall} />}
      {outgoingAudioCall && !ongoingAudioCall && <OutgoingAudioCall user={outgoingAudioCall} onCancel={() => endCall(activeCallId, 'declined')} />}
      
      {isVideoCallActive && (
        <motion.div
            drag={isPipMode && !isResetting}
            dragMomentum={false}
            animate={pipControls}
            className={cn(
                "fixed bg-black/50 backdrop-blur-md z-[100] border border-white/20",
                isPipMode 
                    ? "rounded-xl shadow-2xl cursor-grab active:cursor-grabbing top-4 right-4" 
                    : "inset-0"
            )}
            style={isPipMode ? { maxWidth: pipSize.width, maxHeight: pipSize.height } : {}}
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
      
      {/* Centralized audio elements */}
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

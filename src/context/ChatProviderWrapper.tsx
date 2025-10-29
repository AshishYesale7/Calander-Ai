

'use client';

import React, { type ReactNode, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, where, doc, getDoc, type DocumentData, or, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CallData, CallType, PublicUserProfile } from '@/types';
import { createCall, updateCallStatus, saveOffer, saveAnswer, addCallerCandidate, addReceiverCandidate } from '@/services/callService';
import IncomingCallNotification from '@/components/chat/IncomingCallNotification';
import OutgoingCallNotification from '@/components/chat/OutgoingCallNotification';
import VideoCallView from '@/components/chat/VideoCallView';
import IncomingAudioCall from '@/components/chat/IncomingAudioCall';
import OutgoingAudioCall from '@/components/chat/OutgoingAudioCall';
import AudioCallView from '@/components/chat/AudioCallView';
import PermissionRequestModal from '@/components/chat/PermissionRequestModal';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatContext } from './ChatContext';
import { useIsMobile } from '@/hooks/use-mobile';

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


export default function ChatProviderWrapper({ children }: { children: ReactNode }) {
    const [chattingWith, setChattingWith] = useState<PublicUserProfile | null>(null);
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
    const [isChatInputFocused, setIsChatInputFocused] = useState(false);
    const [outgoingCall, setOutgoingCall] = useState<PublicUserProfile | null>(null);
    const [ongoingCall, setOngoingCall] = useState<CallData | null>(null);
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
    const [outgoingAudioCall, setOutgoingAudioCall] = useState<PublicUserProfile | null>(null);
    const [ongoingAudioCall, setOngoingAudioCall] = useState<CallData | null>(null);
    const [incomingAudioCall, setIncomingAudioCall] = useState<CallData | null>(null);
    const [permissionRequest, setPermissionRequest] = useState<{ callType: CallType; onGrant: () => void; onDeny: () => void; } | null>(null);
    const [otherUserInCall, setOtherUserInCall] = useState<PublicUserProfile | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<RTCPeerConnectionState>('new');
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
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [activeCallId, setActiveCallId] = useState<string | null>(() => {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(ACTIVE_CALL_SESSION_KEY);
      }
      return null;
    });

    const [pipSize, setPipSize] = useState({ width: 256, height: 192 });

    const handleTogglePipSizeMode = useCallback(() => {
        setPipSizeMode(currentMode => {
            const newMode = currentMode === 'medium' ? 'large' : 'medium';
            if (newMode === 'large') {
                setPipSize({ width: 320, height: 240 });
            } else {
                setPipSize({ width: 256, height: 192 });
            }
            return newMode;
        });
    }, []);
    
    const { user } = useAuth();
    const { toast } = useToast();

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

        if (id) {
            updateCallStatus(id, status).catch(err => {
                console.warn(`Failed to send final call status update for call ${id}:`, err);
            });
        }
    
        // Immediately clean up all local state to end the call for the current user.
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


    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;
        const isOutgoing = outgoingCall || outgoingAudioCall;

        if (isOutgoing && activeCallId) {
            const callIdForTimeout = activeCallId;
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
            }, 15000);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [outgoingCall, outgoingAudioCall, activeCallId, toast]);
    
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
    
                        const timeoutId = setTimeout(() => {
                            const callDocRef = doc(db, 'calls', callData.id);
                            getDoc(callDocRef).then(docSnap => {
                                if (docSnap.exists() && docSnap.data().status === 'ringing') {
                                    updateCallStatus(callData.id, 'declined');
                                }
                            });
                        }, 15000);
                    }
                } else if (change.type === 'removed') {
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

    const checkAndRequestPermissions = async (callType: CallType): Promise<{ granted: boolean; error?: string }> => {
        if (typeof window === 'undefined' || !navigator.mediaDevices) {
            return { granted: false, error: 'Media devices not supported.' };
        }
        const constraints = callType === 'video' ? { video: true, audio: true } : { audio: true };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
  
    const isMobile = useIsMobile();

    const chatSidebarWidth = useMemo(() => {
      const isCallViewActive = (ongoingCall || ongoingAudioCall) && !isPipMode;
      if (isMobile) return 0;
      if (isCallViewActive) return 0; // No sidebar during call
      
      const isChatPanelVisible = !!chattingWith;
      if (isChatSidebarOpen) {
        return isChatPanelVisible ? 288 + 352 : 288; // 18rem + 22rem or 18rem
      }
      return isChatPanelVisible ? 80 + 352 : 80; // 5rem + 22rem or 5rem
    }, [isMobile, isChatSidebarOpen, chattingWith, ongoingCall, ongoingAudioCall, isPipMode]);


    const contextValue = {
        chattingWith, setChattingWith, 
        isChatSidebarOpen, setIsChatSidebarOpen,
        isChatInputFocused, setIsChatInputFocused,
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
        setPipSize,
        pipSizeMode, setPipSizeMode,
        isMuted, onToggleMute,
        connectionStatus,
        peerConnectionRef,
        playSendMessageSound,
        chatSidebarWidth,
    };
    
    return (
        <ChatContext.Provider value={contextValue}>
            {children}
            
            {/* Call UI */}
            {ongoingCall && otherUserInCall && !isPipMode && (
                <div className="fixed inset-0 z-50 bg-black">
                    <VideoCallView call={ongoingCall} otherUser={otherUserInCall} onEndCall={() => endCall(ongoingCall.id)} isPipMode={false} onTogglePipMode={onTogglePipMode} pipSizeMode={pipSizeMode} onTogglePipSizeMode={handleTogglePipSizeMode} />
                </div>
            )}
            {ongoingAudioCall && otherUserInCall && !isPipMode && (
                <motion.div
                    drag
                    dragMomentum={false}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 cursor-grab active:cursor-grabbing"
                >
                    <AudioCallView call={ongoingAudioCall} otherUser={otherUserInCall} onEndCall={() => endCall(ongoingAudioCall.id)} connectionStatus={connectionStatus} />
                </motion.div>
            )}

            {/* PiP Call UI */}
            {isPipMode && (ongoingCall || ongoingAudioCall) && otherUserInCall && (
                 <motion.div
                    drag
                    dragMomentum={false}
                    animate={pipControls}
                    className={cn(
                        "fixed top-4 right-4 z-[100] rounded-lg overflow-hidden shadow-2xl border-2 border-accent cursor-grab active:cursor-grabbing flex flex-col bg-black/50 backdrop-blur-md",
                        isResetting && "transition-transform duration-300"
                    )}
                    style={{
                        width: pipSize.width,
                        height: pipSize.height,
                    }}
                >
                    {ongoingCall && <VideoCallView call={ongoingCall} otherUser={otherUserInCall} onEndCall={() => endCall(ongoingCall.id)} isPipMode={true} onTogglePipMode={onTogglePipMode} pipSizeMode={pipSizeMode} onTogglePipSizeMode={handleTogglePipSizeMode} />}
                    {ongoingAudioCall && <div className="h-full w-full flex items-center justify-center"><AudioCallView call={ongoingAudioCall} otherUser={otherUserInCall} onEndCall={() => endCall(ongoingAudioCall.id)} connectionStatus={connectionStatus} /></div>}
                </motion.div>
            )}

            {/* Call Notifications */}
            {permissionRequest && (
                <PermissionRequestModal
                    callType={permissionRequest.callType}
                    onGrant={permissionRequest.onGrant}
                    onDeny={permissionRequest.onDeny}
                    onOpenChange={(isOpen) => !isOpen && setPermissionRequest(null)}
                />
            )}
            {incomingCall && (<IncomingCallNotification call={incomingCall} onAccept={acceptCall} onDecline={declineCall} />)}
            {outgoingCall && !ongoingCall && (<OutgoingCallNotification user={outgoingCall} onCancel={() => endCall(activeCallId, 'declined')} />)}
            {incomingAudioCall && <IncomingAudioCall call={incomingAudioCall} onAccept={acceptCall} onDecline={declineCall} />}
            {outgoingAudioCall && !ongoingAudioCall && <OutgoingAudioCall user={outgoingAudioCall} onCancel={() => endCall(activeCallId, 'declined')} />}
            
            <audio ref={remoteStream && remoteStream.getAudioTracks().length > 0 ? (el => { if (el) el.srcObject = remoteStream; }) : null} autoPlay playsInline className="hidden" />

            <audio ref={messageSentSoundRef} src="https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3" preload="auto" className="hidden"></audio>
            <audio ref={incomingRingtoneRef} src="/assets/ringtone.mp3" preload="auto" loop className="hidden" />
            <audio ref={outgoingRingtoneRef} src="https://cdn.pixabay.com/audio/2022/08/22/audio_1079450c39.mp3" preload="auto" loop className="hidden" />
        </ChatContext.Provider>
    );
}

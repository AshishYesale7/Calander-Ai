
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, PictureInPicture2, Maximize, Minimize, CameraReverse, FlipHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { CallData } from '@/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, type Unsubscribe } from 'firebase/firestore';
import { saveAnswer, saveOffer, addCallerCandidate, addReceiverCandidate } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';


interface VideoCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
  isPipMode: boolean;
  onTogglePipMode: () => void;
  pipSizeMode: 'small' | 'medium' | 'large';
  onTogglePipSizeMode: () => void;
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

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


export default function VideoCallView({ call, otherUser, onEndCall, isPipMode, onTogglePipMode, pipSizeMode, onTogglePipSizeMode }: VideoCallViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const isMobile = useIsMobile();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const callerCandidatesQueue = useRef<RTCIceCandidate[]>([]);
  const receiverCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  // A ref to track if the component is still mounted.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const flipCamera = async () => {
    if (!localStreamRef.current || !navigator.mediaDevices?.enumerateDevices) {
        toast({ title: "Camera Error", description: "Could not detect multiple cameras.", variant: 'destructive'});
        return;
    }
    
    // Stop all current tracks to release the camera
    localStreamRef.current.getTracks().forEach(track => track.stop());

    const newFacingMode = isFrontCamera ? 'environment' : 'user';
    setIsFrontCamera(!isFrontCamera);

    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { exact: newFacingMode } },
            audio: true // We need to request audio again as well
        });
        if (!isMountedRef.current) return;
        
        localStreamRef.current = newStream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
        }
        
        // Replace the video track in the peer connection
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
            await sender.replaceTrack(videoTrack);
        } else {
            console.warn("Could not find video sender to replace track.");
        }
    } catch (error) {
        console.error("Error flipping camera:", error);
        toast({ title: "Camera Switch Failed", description: "Could not switch to the other camera.", variant: 'destructive' });
        // Try to revert back to the original state
        setIsFrontCamera(isFrontCamera);
        // And re-acquire the initial stream
        setupStreamsAndPC();
    }
  };


  // Combined effect for WebRTC setup, signaling, and cleanup
  const setupStreamsAndPC = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!isMountedRef.current) { stream.getTracks().forEach(track => track.stop()); return false; }
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasPermission(true);

      const pc = peerConnectionRef.current;
      if (!pc || pc.signalingState === 'closed') return false;
      
      stream.getTracks().forEach((track) => {
        if (pc.signalingState !== 'closed') {
          pc.addTrack(track, stream);
        }
      });

      remoteStreamRef.current = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current?.addTrack(track);
        });
      };
    } catch (error) {
      console.error('Error setting up streams or peer connection.', error);
      toast({
        variant: 'destructive',
        title: 'Media Access Denied',
        description: 'Please enable camera and microphone permissions to use video calling.',
        duration: 7000,
      });
      setHasPermission(false);
      onEndCall();
      return false;
    }
    return true;
  }, [toast, onEndCall]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(ACTIVE_CALL_SESSION_KEY) !== call.id) {
        return;
    }
    
    if (!user || !call) return;
    
    let unsubCall: Unsubscribe | undefined;
    let unsubCandidates: Unsubscribe | undefined;
    
    const pc = new RTCPeerConnection(servers);
    peerConnectionRef.current = pc;
    
    const setupSignaling = () => {
        pc.onicecandidate = event => {
          if (event.candidate) {
            if (call.callerId === user.uid) {
              addCallerCandidate(call.id, event.candidate.toJSON());
            } else {
              addReceiverCandidate(call.id, event.candidate.toJSON());
            }
          }
        };

        if (call.callerId === user.uid) { // We are the CALLER
          unsubCandidates = listenForReceiverCandidates(call.id, candidate => {
            if (!isMountedRef.current || pc.signalingState === 'closed') return;
            if (pc.currentRemoteDescription) {
              pc.addIceCandidate(candidate).catch(e => console.error("Error adding received ICE candidate:", e));
            } else {
              receiverCandidatesQueue.current.push(candidate);
            }
          });

          unsubCall = onSnapshot(doc(db, 'calls', call.id), async (snapshot) => {
            if (!isMountedRef.current || pc.signalingState === 'closed') return;
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              if(pc.signalingState !== 'closed') await pc.setRemoteDescription(answerDescription);
              
              receiverCandidatesQueue.current.forEach(candidate => {
                  if (pc.signalingState !== 'closed') {
                     pc.addIceCandidate(candidate).catch(e => console.error("Error adding queued ICE candidate:", e))
                  }
              });
              receiverCandidatesQueue.current = [];
            }
          });
          
          if (pc.signalingState !== 'closed') {
            pc.createOffer().then(offerDescription => {
               if (pc.signalingState !== 'closed') {
                 pc.setLocalDescription(offerDescription);
                 saveOffer(call.id, { type: offerDescription.type, sdp: offerDescription.sdp });
               }
            });
          }
        
        } else { // We are the RECEIVER
          unsubCandidates = listenForCallerCandidates(call.id, candidate => {
            if (!isMountedRef.current || pc.signalingState === 'closed') return;
            if (pc.currentRemoteDescription) {
              pc.addIceCandidate(candidate).catch(e => console.error("Error adding received ICE candidate:", e));
            } else {
              callerCandidatesQueue.current.push(candidate);
            }
          });
          
          unsubCall = onSnapshot(doc(db, 'calls', call.id), async (snapshot) => {
              if (!isMountedRef.current || pc.signalingState === 'closed') return; 
              const data = snapshot.data();
              if (data?.offer && !pc.currentRemoteDescription) {
                  const offerDescription = new RTCSessionDescription(data.offer);
                  if (pc.signalingState !== 'closed') await pc.setRemoteDescription(offerDescription);
                  
                  callerCandidatesQueue.current.forEach(candidate => {
                      if (pc.signalingState !== 'closed') {
                        pc.addIceCandidate(candidate).catch(e => console.error("Error adding queued ICE candidate:", e))
                      }
                  });
                  callerCandidatesQueue.current = [];
  
                  if (pc.signalingState !== 'closed') {
                    const answerDescription = await pc.createAnswer();
                    await pc.setLocalDescription(answerDescription);
                    await saveAnswer(call.id, { type: answerDescription.type, sdp: answerDescription.sdp });
                  }
              }
          });
        }
    };
    
    setupStreamsAndPC().then(success => {
        if (success && isMountedRef.current) {
            setupSignaling();
        }
    });
    
    // Main cleanup function is now in its own effect
    return () => {
        if (unsubCall) unsubCall();
        if (unsubCandidates) unsubCandidates();
    }

  }, [user, call, toast, setupStreamsAndPC]);

  useEffect(() => {
    return () => {
        isMountedRef.current = false;
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach(track => track.stop());
            remoteStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            if (peerConnectionRef.current.signalingState !== 'closed') {
                peerConnectionRef.current.close();
            }
            peerConnectionRef.current = null;
        }
    }
  }, [])


  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  };

  const handleEndCall = () => {
    onEndCall();
  };

  return (
    <div className={cn("flex flex-col h-full bg-black text-white relative", isPipMode && "w-full h-full")}>
      {/* Remote Video */}
      <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
        <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
        {!isPipMode && (
           <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-lg">
             <p className="font-semibold">{otherUser.displayName}</p>
           </div>
        )}

        {/* Local Video Preview */}
        <motion.div 
            className={cn(
                "absolute bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700",
                isPipMode && pipSizeMode === 'small' && 'hidden', // Hide local video in smallest PiP mode
                isPipMode 
                    ? "w-24 h-32 top-2 right-2 cursor-grab active:cursor-grabbing" 
                    : "h-48 w-36 top-4 right-4"
            )}
            drag={isPipMode}
            dragConstraints={{ top: 8, left: 8, right: 8, bottom: 8 }}
            dragMomentum={false}
        >
            <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)' }} />
            {isCameraOff && hasPermission && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 text-center text-xs">
                Camera is off
              </div>
            )}
        </motion.div>
      </div>
      
       {hasPermission === false && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10/12 max-w-md">
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera and microphone access to use this feature.
              </AlertDescription>
            </Alert>
          </div>
        )}

      {/* Call Controls */}
      <div className={cn(
          "flex-shrink-0 bg-black/50 p-4 flex justify-center items-center gap-4 transition-opacity duration-300", 
          isPipMode && "p-2 gap-2"
        )}>
        <Button onClick={toggleMute} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
          {isMuted ? <MicOff className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <Mic className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
        <Button onClick={toggleCamera} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
          {isCameraOff ? <VideoOff className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <Video className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
        <Button variant="destructive" size="icon" className={cn("rounded-full", isPipMode ? "h-12 w-12" : "h-16 w-16")} onClick={handleEndCall}>
          <PhoneOff className={cn(isPipMode ? "h-6 w-6" : "h-7 w-7")} />
        </Button>
        {isMobile && (
            <Button onClick={flipCamera} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
               <CameraReverse className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />
            </Button>
        )}
        <Button variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")} onClick={onTogglePipMode}>
            {isPipMode ? <Maximize className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <PictureInPicture2 className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
         {isPipMode && (
            <Button variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")} onClick={onTogglePipSizeMode}>
                <FlipHorizontal className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />
            </Button>
         )}
         {!isPipMode && (
            <Button variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
                <Users className="h-6 w-6" />
            </Button>
         )}
      </div>
    </div>
  );
}

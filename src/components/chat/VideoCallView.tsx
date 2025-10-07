

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { CallData } from '@/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { saveAnswer, saveOffer, listenForReceiverCandidates, listenForCallerCandidates, addCallerCandidate, addReceiverCandidate } from '@/services/callService';
import { useAuth } from '@/context/AuthContext';


interface VideoCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
}

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoCallView({ call, otherUser, onEndCall }: VideoCallViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const setupStreams = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      remoteStreamRef.current = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices.', error);
      toast({
        variant: 'destructive',
        title: 'Media Access Denied',
        description: 'Please enable camera and microphone permissions to use video calling.',
        duration: 7000,
      });
      setHasPermission(false);
      return null;
    }
  }, [toast]);
  
  const createPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection(servers);

    const localStream = await setupStreams();
    if (!localStream) {
      onEndCall();
      return;
    }

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [setupStreams, onEndCall]);

  // Caller logic
  useEffect(() => {
    if (!user || !call || user.uid !== call.callerId) return;

    const startCall = async () => {
        const pc = await createPeerConnection();
        if (!pc) return;

        listenForReceiverCandidates(call.id, (candidate) => {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
        
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        await saveOffer(call.id, { type: offerDescription.type, sdp: offerDescription.sdp });

        pc.onicecandidate = (event) => {
            event.candidate && addCallerCandidate(call.id, event.candidate.toJSON());
        };

        const callDocRef = doc(db, 'calls', call.id);
        const unsubscribe = onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });
        return unsubscribe;
    };

    const unsubscribePromise = startCall();
    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };

  }, [user, call, createPeerConnection]);


  // Receiver logic
  useEffect(() => {
    if (!user || !call || user.uid !== call.receiverId) return;

    const answerCall = async () => {
        const pc = await createPeerConnection();
        if (!pc) return;

        listenForCallerCandidates(call.id, (candidate) => {
            pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        const callDocRef = doc(db, 'calls', call.id);
        const unsubscribe = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (data?.offer && !pc.currentRemoteDescription) {
                const offerDescription = new RTCSessionDescription(data.offer);
                await pc.setRemoteDescription(offerDescription);

                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);

                await saveAnswer(call.id, { type: answerDescription.type, sdp: answerDescription.sdp });
                
                pc.onicecandidate = (event) => {
                    event.candidate && addReceiverCandidate(call.id, event.candidate.toJSON());
                };
            }
        });
        return unsubscribe;
    };
    
    const unsubscribePromise = answerCall();
    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [user, call, createPeerConnection]);
  
  const cleanup = () => {
     if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

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
    cleanup();
    onEndCall();
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Remote Video */}
      <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
        <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
        <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-lg">
          <p className="font-semibold">{otherUser.displayName}</p>
        </div>
      </div>

      {/* Local Video Preview */}
      <div className="absolute top-4 right-4 h-48 w-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
        <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        {isCameraOff && hasPermission && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 text-center text-xs">
            Camera is off
          </div>
        )}
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
      <div className="flex-shrink-0 bg-black/50 p-4 flex justify-center items-center gap-4">
        <Button onClick={toggleMute} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button onClick={toggleCamera} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
          {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full h-16 w-16" onClick={handleEndCall}>
          <PhoneOff className="h-7 w-7" />
        </Button>
         <Button variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
            <Users className="h-6 w-6" />
        </Button>
         <Button variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
            <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

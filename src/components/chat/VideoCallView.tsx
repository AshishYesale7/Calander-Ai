
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, PictureInPicture2, Maximize, Minimize, SwitchCamera, FlipHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { CallData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useChat } from '@/context/ChatContext';


interface VideoCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
  isPipMode: boolean;
  onTogglePipMode: () => void;
  pipSizeMode: 'medium' | 'large';
  onTogglePipSizeMode: () => void;
}

export default function VideoCallView({ call, otherUser, onEndCall, isPipMode, onTogglePipMode, pipSizeMode, onTogglePipSizeMode }: VideoCallViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { localStream, remoteStream, isMuted, onToggleMute, connectionStatus } = useChat();

  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // Check for multiple cameras
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (err) {
        console.error("Could not enumerate devices:", err);
      }
    };
    checkCameras();
  }, []);


  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  };

  const flipCamera = async () => {
    if (!localStream || !hasMultipleCameras) {
        toast({
          title: "Camera Switch Failed",
          description: "Could not find a second camera to switch to.",
          variant: 'destructive'
        });
        return;
    }

    const newFacingMode = isFrontCamera ? 'environment' : 'user';
    
    try {
        const tracks = localStream.getVideoTracks();
        for (const track of tracks) {
            track.stop();
        }

        const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { exact: newFacingMode } },
        });
        
        const videoTrack = newStream.getVideoTracks()[0];
        const pc = peerConnectionRef.current;
        const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
            await sender.replaceTrack(videoTrack);

            if (localVideoRef.current) {
                const newLocalStream = new MediaStream([videoTrack, ...localStream.getAudioTracks()]);
                localVideoRef.current.srcObject = newLocalStream;
                localStream.getTracks().forEach(t => t.stop());
            }
            setIsFrontCamera(!isFrontCamera);
        } else {
            console.warn("Could not find video sender to replace track.");
        }
    } catch (error) {
        console.error("Error flipping camera:", error);
        toast({ 
            title: "Camera Switch Failed", 
            description: "Could not access the other camera.", 
            variant: 'destructive' 
        });
    }
  };


  return (
    <div className={cn("flex flex-col h-full bg-black text-white relative", isPipMode && "w-full h-full")}>
      {/* Remote Video */}
      <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
        <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
        
        {isPipMode && (
          <Button variant="ghost" size="icon" className="absolute top-1 left-1 h-7 w-7 text-white/70 hover:text-white" onClick={onTogglePipSizeMode}>
            {pipSizeMode === 'medium' ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>
        )}

        {connectionStatus === 'disconnected' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                <LoadingSpinner className="text-white" />
                Reconnecting...
            </div>
        )}
        {!isPipMode && (
           <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-lg">
             <p className="font-semibold">{otherUser.displayName}</p>
           </div>
        )}

        {/* Local Video Preview */}
        {localStream && (
          <motion.div
            drag
            dragMomentum={false}
            className={cn(
              "absolute bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 cursor-grab active:cursor-grabbing",
              isPipMode ? "w-24 h-32 top-2 right-2" : "h-48 w-36 top-4 right-4"
            )}
          >
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              style={{ transform: 'scaleX(-1)' }}
            />
            {isCameraOff && hasPermission && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 text-center text-xs">
                Camera is off
              </div>
            )}
          </motion.div>
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
      <div className={cn(
          "flex-shrink-0 bg-black/50 p-4 flex justify-center items-center gap-4 transition-opacity duration-300", 
          isPipMode && "p-2 gap-2"
        )}>
        <Button onClick={onToggleMute} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
          {isMuted ? <MicOff className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <Mic className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
        <Button onClick={toggleCamera} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
          {isCameraOff ? <VideoOff className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <Video className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
        <Button variant="destructive" size="icon" className={cn("rounded-full", isPipMode ? "h-12 w-12" : "h-16 w-16")} onClick={onEndCall}>
          <PhoneOff className={cn(isPipMode ? "h-6 w-6" : "h-7 w-7")} />
        </Button>
        {hasMultipleCameras && (
            <Button onClick={flipCamera} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
               <SwitchCamera className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />
            </Button>
        )}
        <Button variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")} onClick={onTogglePipMode}>
            {isPipMode ? <Maximize className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <PictureInPicture2 className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
         {!isPipMode && (
            <Button variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
                <Users className="h-6 w-6" />
            </Button>
         )}
      </div>
    </div>
  );
}

    
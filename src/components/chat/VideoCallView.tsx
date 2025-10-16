

'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublicUserProfile, CallData } from '@/types';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, PictureInPicture2, Maximize, Minimize, SwitchCamera } from 'lucide-react';
import type { CallData as CallDataType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useChat } from '@/context/ChatContext';
import { updateCallParticipantStatus } from '@/services/callService';

interface VideoCallViewProps {
  call: CallDataType;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
  isPipMode: boolean;
  onTogglePipMode: () => void;
  pipSizeMode: 'medium' | 'large';
  onTogglePipSizeMode: () => void;
}

export default function VideoCallView({ call, otherUser, onEndCall, isPipMode, onTogglePipMode, pipSizeMode, onTogglePipSizeMode }: VideoCallViewProps) {
  const { user } = useAuth();
  const { localStream, remoteStream, isMuted, onToggleMute, connectionStatus, peerConnectionRef } = useChat();

  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [callData, setCallData] = useState<CallDataType>(call);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    setCallData(call);
  }, [call]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [connectionStatus]);

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

  const handleToggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const isOff = !videoTrack.enabled;
        setIsCameraOff(isOff);
        if (user) {
          updateCallParticipantStatus(call.id, user.uid, { videoMuted: isOff });
        }
      }
    }
  };
  
  const handleToggleMute = () => {
    onToggleMute(); // This function is from useChat and already handles local stream
    if (user) {
        // We read the NEW mute state, which is the opposite of the current one.
        updateCallParticipantStatus(call.id, user.uid, { audioMuted: !isMuted });
    }
  };


  const flipCamera = async () => {
    if (!localStream || !hasMultipleCameras) return;
    
    try {
        const newFacingMode = isFrontCamera ? 'environment' : 'user';

        // Stop the current video track before getting a new one
        localStream.getVideoTracks().forEach(track => track.stop());

        // Get new stream with the flipped camera
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: newFacingMode }
        });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Find the video sender in the peer connection
        const pc = peerConnectionRef.current;
        const sender = pc?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
            await sender.replaceTrack(newVideoTrack);

            // Update the local video element with a new stream containing the new video and old audio tracks
            const newLocalStreamForPreview = new MediaStream([newVideoTrack, ...localStream.getAudioTracks()]);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = newLocalStreamForPreview;
            }

            setIsFrontCamera(!isFrontCamera);
        } else {
            console.warn("Could not find video sender to replace track.");
        }
    } catch (error) {
        console.error("Error flipping camera:", error);
    }
};

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const isCurrentUserCaller = user?.uid === call.callerId;
  const otherUserMutedAudio = isCurrentUserCaller ? callData.receiverMutedAudio : callData.callerMutedAudio;
  const otherUserMutedVideo = isCurrentUserCaller ? callData.receiverMutedVideo : callData.callerMutedVideo;

  return (
    <div className={cn("flex flex-col h-full text-white relative", isPipMode && "w-full h-full")}>
      <div className="flex-1 bg-black/50 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
        <video ref={remoteVideoRef} className="w-full h-full object-contain" autoPlay playsInline />
        
        {/* Remote User Mute Indicators */}
        <AnimatePresence>
        {(otherUserMutedAudio || otherUserMutedVideo) && (
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-lg flex items-center gap-2"
             >
                {otherUserMutedAudio && <MicOff className="h-5 w-5 text-red-500"/>}
                {otherUserMutedVideo && <VideoOff className="h-5 w-5 text-red-500"/>}
             </motion.div>
        )}
        </AnimatePresence>
        
        {isPipMode && (
          <Button variant="ghost" size="icon" className="absolute top-1 left-1 h-7 w-7 text-white/70 hover:text-white" onClick={onTogglePipSizeMode}>
            {pipSizeMode === 'medium' ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>
        )}
        
        {connectionStatus === 'connected' && callDuration > 0 && (
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm font-mono animate-in fade-in duration-300">
            {formatDuration(callDuration)}
          </div>
        )}

        {connectionStatus === 'disconnected' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                <LoadingSpinner className="text-white" />
                Reconnecting...
            </div>
        )}
       
        {localStream && (
          <motion.div
            drag
            dragMomentum={false}
            className={cn(
              "absolute overflow-hidden border-2 border-gray-700 cursor-grab active:cursor-grabbing",
              isPipMode
                ? "rounded-md max-h-[7rem] max-w-[5.25rem] top-2 right-2"
                : "rounded-lg max-h-[14rem] max-w-[10.5rem] top-4 right-4"
            )}
          >
            <video
              ref={localVideoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* Local User Mute Indicators */}
            {(isMuted || isCameraOff) && (
              <div className="absolute bottom-1 right-1 bg-black/50 p-1 rounded-full flex items-center gap-1">
                  {isMuted && <MicOff className="h-3 w-3 text-white"/>}
                  {isCameraOff && <VideoOff className="h-3 w-3 text-white"/>}
              </div>
            )}
            {isCameraOff && hasPermission && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 text-center text-xs">
                Camera is off
              </div>
            )}
          </motion.div>
        )}
      </div>

      <div className={cn("flex-shrink-0 bg-black/50 p-4 flex justify-center items-center gap-4 transition-opacity duration-300", isPipMode && "p-2 gap-2")}>
        <Button onClick={handleToggleMute} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
          {isMuted ? <MicOff className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} /> : <Mic className={cn(isPipMode ? "h-5 w-5" : "h-6 w-6")} />}
        </Button>
        <Button onClick={handleToggleCamera} variant="outline" size="icon" className={cn("bg-white/10 hover:bg-white/20 border-white/20 rounded-full", isPipMode ? "h-10 w-10" : "h-14 w-14")}>
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
      </div>
    </div>
  );
}

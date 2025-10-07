
'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface VideoCallViewProps {
  otherUser: PublicUserProfile;
  onEndCall: () => void;
}

export default function VideoCallView({ otherUser, onEndCall }: VideoCallViewProps) {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to use video calling.',
          duration: 7000,
        });
      }
    };

    getCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const toggleMute = () => {
    if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            setIsMuted(!audioTracks[0].enabled);
        }
    }
  };

  const toggleCamera = () => {
     if (streamRef.current) {
        const videoTracks = streamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            setIsCameraOff(!videoTracks[0].enabled);
        }
    }
  };

  const handleEndCall = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Remote Video (Placeholder) */}
      <div className="flex-1 bg-gray-900 flex items-center justify-center relative">
        <Avatar className="h-32 w-32 border-4 border-gray-700">
          <AvatarImage src={otherUser.photoURL || ''} alt={otherUser.displayName} />
          <AvatarFallback className="text-5xl">{otherUser.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-lg">
          <p className="font-semibold">{otherUser.displayName}</p>
        </div>
      </div>

      {/* Local Video Preview */}
      <div className="absolute top-4 right-4 h-48 w-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
        <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-2 text-center text-xs">
            Camera access denied. Please check your browser permissions.
          </div>
        )}
      </div>
      
       {hasCameraPermission === false && (
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

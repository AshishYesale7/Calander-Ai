
'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublicUserProfile, CallData } from '@/types';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useChat } from '@/context/ChatContext';

interface AudioCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
  connectionStatus: RTCPeerConnectionState;
}

export default function AudioCallView({ call, otherUser, onEndCall, connectionStatus }: AudioCallViewProps) {
  const { onToggleMute, remoteStream, isMuted } = useChat();
  const [callDuration, setCallDuration] = useState(0);

  // Effect for the call duration timer
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [connectionStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div
      className="p-6 rounded-2xl shadow-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-700 text-white w-64 cursor-grab active:cursor-grabbing"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 border-4 border-green-500 shadow-lg">
          <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
          <AvatarFallback className="text-3xl">{otherUser.displayName.charAt(0)}</AvatarFallback>
        </Avatar>

        <p className="font-bold text-xl mt-4">{otherUser.displayName}</p>
        
        <div className="h-5 mt-1">
            {connectionStatus === 'disconnected' ? (
                <div className="text-xs text-yellow-400 flex items-center gap-1.5 animate-pulse">
                    <LoadingSpinner size="sm" className="text-yellow-400"/>
                    Reconnecting...
                </div>
            ) : (
                <p className={cn(
                  "text-sm text-green-400 transition-opacity duration-500 font-mono",
                  callDuration > 0 ? 'opacity-100' : 'opacity-0'
                )}>
                  {formatDuration(callDuration)}
                </p>
            )}
        </div>
      </div>
      
      <div className="flex justify-center gap-4 mt-6">
        <Button onClick={onToggleMute} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={onEndCall}>
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

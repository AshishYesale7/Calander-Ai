
'use client';

import { useState, useEffect } from 'react';
import type { PublicUserProfile, CallData } from '@/types';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AudioCallViewProps {
  call: CallData;
  otherUser: PublicUserProfile;
  onEndCall: () => void;
}

export default function AudioCallView({ call, otherUser, onEndCall }: AudioCallViewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, you would also mute the local audio track here.
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-5 right-5 z-[200] p-6 rounded-2xl shadow-2xl bg-gray-900/80 backdrop-blur-lg border border-gray-700 text-white w-80"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 border-4 border-green-500 shadow-lg">
          <AvatarImage src={otherUser.photoURL || ''} alt={otherUser.displayName} />
          <AvatarFallback className="text-3xl">{otherUser.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-bold text-2xl mt-4">{otherUser.displayName}</p>
        <p className={cn(
          "text-sm text-green-400 transition-opacity duration-500",
          callDuration > 0 ? 'opacity-100' : 'opacity-0'
        )}>
          {formatDuration(callDuration)}
        </p>
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <Button onClick={toggleMute} variant="outline" size="icon" className="bg-white/10 hover:bg-white/20 border-white/20 rounded-full h-14 w-14">
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={onEndCall}>
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </motion.div>
  );
}

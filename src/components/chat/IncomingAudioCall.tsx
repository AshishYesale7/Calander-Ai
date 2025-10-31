
'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import type { CallData } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';


interface IncomingAudioCallProps {
  call: CallData;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingAudioCall({ call, onAccept, onDecline }: IncomingAudioCallProps) {
  
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        "fixed top-5 left-5 z-[200] p-4 rounded-xl shadow-2xl frosted-glass bg-gray-900/80 border border-gray-700/50 text-white cursor-grab active:cursor-grabbing",
        "w-72" 
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-white/20">
              <AvatarImage src={call.callerPhotoURL || undefined} alt={call.callerName} />
              <AvatarFallback className="text-xl">
                {call.callerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
        </div>
        
        <p className="font-semibold text-lg mt-2 truncate">{call.callerName}</p>
        
        <p className="text-xs text-gray-300">Incoming audio call...</p>

      </div>

      <div className="flex justify-around mt-4">
        <div className="flex flex-col items-center gap-1">
            <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={onDecline}>
            <PhoneOff className="h-5 w-5" />
            </Button>
            <span className="text-xs text-white/70">Decline</span>
        </div>
        <div className="flex flex-col items-center gap-1">
            <Button variant="default" size="icon" className="rounded-full h-12 w-12 bg-green-600 hover:bg-green-700" onClick={onAccept}>
            <Phone className="h-5 w-5" />
            </Button>
            <span className="text-xs text-white/70">Accept</span>
        </div>
      </div>
    </motion.div>
  );
}

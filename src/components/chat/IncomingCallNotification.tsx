
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import type { CallData } from '@/types';
import { motion } from 'framer-motion';

interface IncomingCallNotificationProps {
  call: CallData;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallNotification({ call, onAccept, onDecline }: IncomingCallNotificationProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-lg shadow-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white animate-in slide-in-from-top-10 fade-in duration-300 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-green-500">
          <AvatarImage src={call.callerPhotoURL || undefined} alt={call.callerName} />
          <AvatarFallback>{call.callerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-lg">{call.callerName}</p>
          <p className="text-sm text-gray-300 flex items-center gap-1.5">
            <Video className="h-4 w-4 text-green-400" /> Incoming video call...
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={onDecline}>
          <PhoneOff className="h-6 w-6" />
        </Button>
        <Button variant="default" size="icon" className="rounded-full h-12 w-12 bg-green-600 hover:bg-green-700" onClick={onAccept}>
          <Phone className="h-6 w-6" />
        </Button>
      </div>
    </motion.div>
  );
}

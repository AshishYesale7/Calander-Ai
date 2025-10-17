
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, Bell, MessageSquare, Circle } from 'lucide-react';
import type { CallData } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IncomingCallNotificationProps {
  call: CallData;
  onAccept: () => void;
  onDecline: () => void;
}

const ActionButton = ({ icon: Icon, label, className }: { icon: React.ElementType, label: string, className?: string }) => (
    <div className="flex flex-col items-center gap-1">
        <Button variant="ghost" size="icon" className={cn("rounded-full h-10 w-10 text-white/80 hover:bg-white/10 hover:text-white", className)}>
            <Icon className="h-5 w-5" />
        </Button>
        <span className="text-[10px] text-white/70">{label}</span>
    </div>
)


export default function IncomingCallNotification({ call, onAccept, onDecline }: IncomingCallNotificationProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        "fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-2xl shadow-2xl frosted-glass bg-gray-900/80 border border-gray-700/50 text-white cursor-grab active:cursor-grabbing",
        "w-[calc(100vw-2rem)] max-w-[320px] sm:w-auto"
      )}
    >
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 border-2 border-white/20">
          <AvatarImage src={call.callerPhotoURL || undefined} alt={call.callerName} />
          <AvatarFallback className="text-2xl">{call.callerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-xl mt-3 truncate">{call.callerName}</p>
        <p className="text-xs text-gray-300 flex items-center gap-1.5">
          <Video className="h-4 w-4 text-green-400" /> Incoming video call...
        </p>
      </div>

      <div className="flex items-center justify-around mt-6">
        <ActionButton icon={Bell} label="Reminder"/>
        
        <div className="flex flex-col items-center gap-1">
            <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={onDecline}>
              <PhoneOff className="h-6 w-6" />
            </Button>
            <span className="text-xs text-white/70">Decline</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
            <Button variant="default" size="icon" className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700" onClick={onAccept}>
              <Phone className="h-6 w-6" />
            </Button>
            <span className="text-xs text-white/70">Accept</span>
        </div>

        <ActionButton icon={MessageSquare} label="Message"/>

      </div>
    </motion.div>
  );
}

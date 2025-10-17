
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PhoneOff, Phone } from 'lucide-react';
import type { PublicUserProfile } from '@/services/userService';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OutgoingAudioCallProps {
  user: PublicUserProfile;
  onCancel: () => void;
}

export default function OutgoingAudioCall({ user, onCancel }: OutgoingAudioCallProps) {

  return (
    <motion.div
      drag
      dragMomentum={false}
      className={cn(
        "fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-3 rounded-lg shadow-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white animate-in slide-in-from-top-10 fade-in duration-300 cursor-grab active:cursor-grabbing",
        "w-[90vw] max-w-sm sm:w-auto" // Added width classes
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-blue-500">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs truncate">{user.displayName}</p>
          <p className="text-[10px] text-gray-300 flex items-center gap-1.5 animate-pulse">
            <Phone className="h-2.5 w-2.5 text-blue-400" /> Calling...
          </p>
        </div>
        <div className="flex items-center gap-2 pl-2">
            <Button variant="destructive" size="icon" className="rounded-full h-8 w-8" onClick={onCancel}>
              <PhoneOff className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </motion.div>
  );
}


'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PhoneOff, Video } from 'lucide-react';
import type { PublicUserProfile } from '@/services/userService';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OutgoingCallNotificationProps {
  user: PublicUserProfile;
  onCancel: () => void;
}

export default function OutgoingCallNotification({ user, onCancel }: OutgoingCallNotificationProps) {

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        "fixed top-5 left-5 z-[200] p-3 rounded-lg shadow-2xl frosted-glass bg-gray-900/80 border border-gray-700 text-white cursor-grab active:cursor-grabbing",
        "w-[calc(100vw-2rem)] max-w-[320px] sm:w-auto"
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
            <Video className="h-2.5 w-2.5 text-blue-400" /> Calling...
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

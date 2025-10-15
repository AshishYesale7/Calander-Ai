'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PhoneOff, Phone } from 'lucide-react';
import type { PublicUserProfile } from '@/services/userService';
import { motion } from 'framer-motion';

interface OutgoingAudioCallProps {
  user: PublicUserProfile;
  onCancel: () => void;
}

export default function OutgoingAudioCall({ user, onCancel }: OutgoingAudioCallProps) {

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-5 right-5 z-[200] p-4 rounded-lg shadow-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white animate-in slide-in-from-bottom-10 fade-in duration-300 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-blue-500">
          <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-bold text-lg">{user.displayName}</p>
          <p className="text-sm text-gray-300 flex items-center gap-1.5 animate-pulse">
            <Phone className="h-4 w-4 text-blue-400" /> Calling...
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={onCancel}>
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </motion.div>
  );
}
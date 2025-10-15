
'use client';

import { format } from 'date-fns';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import type { CallData, PublicUserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface CallLogItemProps {
  item: CallData;
  currentUser: any; // Using `any` for simplicity, could use User from firebase/auth
}

export default function CallLogItem({ item, currentUser }: CallLogItemProps) {
  if (!currentUser) return null;
  
  const isOutgoing = item.callerId === currentUser.uid;
  const isMissed = item.status === 'declined' && !isOutgoing;
  
  let icon = <PhoneOutgoing className="h-4 w-4" />;
  let text = 'Outgoing video call';
  
  if (item.callType === 'audio') {
    text = 'Outgoing audio call';
  }

  if (isMissed) {
    icon = <PhoneMissed className="h-4 w-4" />;
    text = item.callType === 'audio' ? 'Missed audio call' : 'Missed video call';
  } else if (!isOutgoing) {
    icon = <PhoneIncoming className="h-4 w-4" />;
    text = item.callType === 'audio' ? 'Incoming audio call' : 'Incoming video call';
  }
  
  if (item.status === 'ended' && typeof item.duration === 'number') {
    const mins = Math.floor(item.duration / 60);
    const secs = item.duration % 60;
    const callTypeLabel = item.callType === 'audio' ? 'Audio call' : 'Video call';
    if (mins > 0) {
      text = `${callTypeLabel} - ${mins}m ${secs}s`;
    } else {
      text = `${callTypeLabel} - ${secs}s`;
    }
  }

  return (
    <div className={cn(
        "text-center text-xs text-gray-500 my-4 flex items-center gap-2",
        isOutgoing ? 'justify-end' : 'justify-start'
    )}>
        {icon}
        <span>{text}</span>
        <span>·</span>
        <span>{format(item.timestamp, 'p')}</span>
    </div>
  );
};

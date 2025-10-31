
'use client';

import { format } from 'date-fns';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, X } from 'lucide-react';
import type { CallData, PublicUserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface CallLogItemProps {
  item: CallData;
  currentUser: any; // Using `any` for simplicity, could use User from firebase/auth
}

export default function CallLogItem({ item, currentUser }: CallLogItemProps) {
  if (!currentUser) return null;
  
  const isOutgoing = item.callerId === currentUser.uid;
  const isDeclined = item.status === 'declined';
  const isMissed = isDeclined && !isOutgoing;
  const isRejected = isDeclined && isOutgoing;
  
  let icon = isOutgoing ? <ArrowUpRight className="h-4 w-4 text-muted-foreground" /> : <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />;
  let text = isOutgoing ? 'Outgoing' : 'Incoming';
  
  if(item.callType === 'video') {
    text += ' video call';
  } else {
    text += ' audio call';
  }

  if (isMissed) {
    icon = <PhoneMissed className="h-4 w-4 text-red-500" />;
    text = `Missed ${item.callType} call`;
  } else if (isRejected) {
    icon = <X className="h-4 w-4 text-red-500" />;
    text = 'Call declined';
  } else if (item.status === 'ended' && typeof item.duration === 'number') {
    const mins = Math.floor(item.duration / 60);
    const secs = item.duration % 60;
    if (mins > 0) {
      text = `${text} - ${mins}m ${secs}s`;
    } else {
      text = `${text} - ${secs}s`;
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

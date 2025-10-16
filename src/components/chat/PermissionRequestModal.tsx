
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, Mic } from 'lucide-react';
import type { CallType } from '@/types';

interface PermissionRequestModalProps {
  callType: CallType;
  onGrant: () => void;
  onDeny: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function PermissionRequestModal({
  callType,
  onGrant,
  onDeny,
  onOpenChange,
}: PermissionRequestModalProps) {

  // The modal is now simpler. It just calls the functions passed to it.
  const handleGrant = () => {
    onGrant();
    onOpenChange(false);
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            {callType === 'video' ? <Video className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            Permissions Required
          </DialogTitle>
          <DialogDescription>
            To accept this {callType} call, please grant access to your camera and microphone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleDeny}>
            Cancel
          </Button>
          <Button onClick={handleGrant}>
            Grant Permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

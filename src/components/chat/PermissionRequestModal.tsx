

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, Mic, AlertTriangle } from 'lucide-react';
import type { CallType } from '@/types';
import { LoadingSpinner } from '../ui/LoadingSpinner';

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
  const [permissionState, setPermissionState] = useState<'requesting' | 'denied'>('requesting');
  const [isAttempting, setIsAttempting] = useState(false);

  const handleGrant = async () => {
    setIsAttempting(true);
    // The onGrant function now handles the permission check itself.
    // It will close the modal on success or update the state on denial.
    onGrant();
    // We don't immediately set isAttempting to false, as the parent component will
    // either close the modal or change its state.
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        {permissionState === 'requesting' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-lg text-primary flex items-center">
                {callType === 'video' ? <Video className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                Permissions Required
              </DialogTitle>
              <DialogDescription>
                To start this {callType} call, please grant access to your {callType === 'video' ? 'camera and microphone' : 'microphone'} in the browser prompt.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleDeny}>
                Cancel
              </Button>
              <Button onClick={handleGrant} disabled={isAttempting}>
                {isAttempting ? <LoadingSpinner size="sm" className="mr-2"/> : null}
                {isAttempting ? 'Waiting...' : 'Grant Permission'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-lg text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Permissions Blocked
              </DialogTitle>
              <DialogDescription>
                You have previously blocked access to your {callType === 'video' ? 'camera/microphone' : 'microphone'}. To continue, you need to manually enable them in your browser's site settings.
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground p-2 bg-background/50 rounded-md">
                Click the lock icon (🔒) in your browser's address bar, find the Camera and Microphone settings, and change them to "Allow". You may need to reload the page afterward.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                OK
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

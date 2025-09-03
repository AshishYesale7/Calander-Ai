
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
import { Bell } from 'lucide-react';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export default function NotificationPermissionModal({
  isOpen,
  onOpenChange,
  onConfirm,
}: NotificationPermissionModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-accent" />
            </div>
          </div>
          <DialogTitle className="text-center font-headline text-xl text-primary">Enable Notifications</DialogTitle>
          <DialogDescription className="text-center">
            Get timely reminders for your upcoming events and important deadlines right on your device.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button onClick={handleConfirm} className="bg-accent hover:bg-accent/90">Enable Notifications</Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Maybe Later</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

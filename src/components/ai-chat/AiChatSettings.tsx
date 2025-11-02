'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';

interface AiChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiChatSettings({ isOpen, onClose }: AiChatSettingsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Chat Settings
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Settings content will be here...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
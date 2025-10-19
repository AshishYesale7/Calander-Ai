'use client';

import { Command, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

interface MobileBottomNavProps {
  onCommandClick: () => void;
  onChatClick: () => void;
}

export default function MobileBottomNav({ onCommandClick, onChatClick }: MobileBottomNavProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md p-2 rounded-full border border-border shadow-lg">
        <Button onClick={onCommandClick} variant="ghost" className="flex flex-col items-center justify-center h-14 w-14 rounded-full text-muted-foreground hover:text-foreground">
          <Command className="h-5 w-5" />
          <span className="text-xs mt-1">Search</span>
        </Button>
        <Button onClick={onChatClick} variant="ghost" className="flex flex-col items-center justify-center h-14 w-14 rounded-full text-muted-foreground hover:text-foreground">
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Chats</span>
        </Button>
      </div>
    </motion.div>
  );
}

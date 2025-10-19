
'use client';

import { Command, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

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
      <div className="mobile-bottom-nav-glow open">
        <span className="shine"></span><span className="shine shine-bottom"></span>
        <span className="glow"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>
        <div className="inner">
            <div className="flex items-center justify-around w-full gap-4">
            <button 
                onClick={onCommandClick} 
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20 hover:text-foreground transition-colors" 
                aria-label="Open command palette"
            >
                <Command className="h-5 w-5" /><span className="text-xs">Search</span>
            </button>
             <button 
                onClick={onChatClick} 
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20 hover:text-foreground transition-colors" 
                aria-label="Open chat"
            >
                <MessageSquare className="h-5 w-5" /><span className="text-xs">Chats</span>
            </button>
            </div>
        </div>
      </div>
    </motion.div>
  );
}


'use client';

import { motion } from 'framer-motion';
import { Command, MessageSquare } from 'lucide-react';
import React from 'react';

interface MobileBottomNavProps {
  onCommandClick: () => void;
  onChatClick: () => void;
  bottomNavRef: React.RefObject<HTMLDivElement>;
}

export default function MobileBottomNav({ onCommandClick, onChatClick, bottomNavRef }: MobileBottomNavProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
    >
      <div ref={bottomNavRef} className="mobile-bottom-nav-glow open">
          <span className="shine shine-top"></span><span className="shine shine-bottom"></span>
          <span className="glow glow-top"></span><span className="glow glow-bottom"></span>
          <span className="glow glow-bright glow-top"></span><span className="glow glow-bright glow-bottom"></span>
          <div className="inner">
              <div className="flex items-center justify-around w-full">
              <button onClick={onCommandClick} className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20" aria-label="Open command palette">
                  <Command className="h-5 w-5" /><span className="text-xs">Search</span>
              </button>
              <button onClick={onChatClick} className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20" aria-label="Open chat">
                  <MessageSquare className="h-5 w-5" /><span className="text-xs">Chats</span>
              </button>
              </div>
          </div>
      </div>
    </motion.div>
  );
}

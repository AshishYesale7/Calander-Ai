
'use client';

import { Command } from 'lucide-react';
import { motion } from 'framer-motion';

interface DesktopBottomNavProps {
  onCommandClick: () => void;
}

export default function DesktopBottomNav({ onCommandClick }: DesktopBottomNavProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden md:block"
    >
      <div className="bottom-nav-glow open">
        <span className="shine shine-top"></span><span className="shine shine-bottom"></span>
        <span className="glow glow-top"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright glow-top"></span><span className="glow glow-bright glow-bottom"></span>
        <div className="inner p-2">
            <button 
                onClick={onCommandClick} 
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground w-20 hover:text-foreground transition-colors" 
                aria-label="Open command palette"
            >
                <Command className="h-5 w-5" /><span className="text-xs">Search</span>
            </button>
        </div>
      </div>
    </motion.div>
  );
}

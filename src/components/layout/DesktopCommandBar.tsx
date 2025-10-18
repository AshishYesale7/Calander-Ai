'use client';

import { motion } from 'framer-motion';
import { Paperclip, Mic, Sparkles, ChevronDown, AudioLines } from 'lucide-react';
import { Button } from '../ui/button';

interface DesktopCommandBarProps {
  onOpenCommandPalette: () => void;
}

export default function DesktopCommandBar({ onOpenCommandPalette }: DesktopCommandBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 50, damping: 15 }}
      className="fixed bottom-6 left-0 right-0 z-40 mx-auto w-[60%]"
    >
      <div 
        onClick={onOpenCommandPalette}
        className="w-full h-14 rounded-full bg-gray-900/80 backdrop-blur-md border border-white/10 shadow-lg flex items-center px-4 text-gray-400 hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <Paperclip className="h-5 w-5 mr-3" />
        <span className="flex-1 text-left">How can Calendar.ai help?</span>

        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Auto
                <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center">
                <AudioLines className="h-5 w-5" />
            </div>
        </div>
      </div>
    </motion.div>
  );
}

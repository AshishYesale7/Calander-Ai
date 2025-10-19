
'use client';

import { motion } from 'framer-motion';
import { Paperclip, Mic, Sparkles, ChevronDown, AudioLines, Search } from 'lucide-react';
import { Button } from '../ui/button';
import React from 'react';
import { Input } from '../ui/input';

interface DesktopCommandBarProps {
  onOpenCommandPalette: () => void;
  search: string;
  setSearch: (search: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export default function DesktopCommandBar({ onOpenCommandPalette, search, setSearch, inputRef }: DesktopCommandBarProps) {
  const bottomNavRef = React.useRef<HTMLDivElement>(null);

  // This effect is for the glowing border animation, taken from the mobile nav.
  React.useEffect(() => {
    let currentIndex = 0;
    const colorPairs = [
        { hue1: 320, hue2: 280 }, { hue1: 280, hue2: 240 },
        { hue1: 240, hue2: 180 }, { hue1: 180, hue2: 140 },
        { hue1: 140, hue2: 60 },  { hue1: 60, hue2: 30 },
        { hue1: 30, hue2: 0},    { hue1: 0, hue2: 320 },
    ];
    const colorInterval = setInterval(() => {
        const navElement = bottomNavRef.current;
        if (navElement) {
            navElement.style.setProperty('--hue1', String(colorPairs[currentIndex].hue1));
            navElement.style.setProperty('--hue2', String(colorPairs[currentIndex].hue2));
        }
        currentIndex = (currentIndex + 1) % colorPairs.length;
    }, 3000);
    return () => clearInterval(colorInterval);
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 50, damping: 15 }}
      className="fixed bottom-6 left-0 right-0 z-40 mx-auto w-[468px] cursor-grab active:cursor-grabbing"
    >
      <div 
        ref={bottomNavRef}
        className="bottom-nav-glow open"
      >
        <span className="shine shine-bottom"></span><span className="shine shine-bottom" style={{ left: 'auto', right: 'calc(var(--border) * -1)', transform: 'scaleX(-1)' }}></span>
        <span className="glow glow-bottom"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright glow-bottom"></span><span className="glow glow-bright glow-bottom"></span>

        <div className="inner h-12">
          <div className="relative w-full h-full flex items-center px-4 text-gray-400">
            <Search className="h-5 w-5 mr-3" />
             <Input
                ref={inputRef}
                placeholder="How can Calendar.ai help?"
                className="flex-1 bg-transparent border-none text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={onOpenCommandPalette}
                onClick={onOpenCommandPalette}
              />
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
        </div>
      </div>
    </motion.div>
  );
}

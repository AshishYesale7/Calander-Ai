'use client';

import React from 'react';
import { Command } from '@/components/ui/command';
import { CommandListContent } from './CommandPalette';
import { Button } from '../ui/button';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AiCommandPaletteProps {
  navBarPosition: { x: number; y: number };
  search: string;
  onOpenChange: (open: boolean) => void;
  modalProps: any;
}

export default function AiCommandPalette({
  navBarPosition,
  search,
  onOpenChange,
  modalProps,
}: AiCommandPaletteProps) {
  const GAP_BETWEEN_PALETTES = 10;
  const NAVBAR_HEIGHT = 56;
  const PALETTE_HEIGHT = 450;
  
  const bottomNavRef = React.useRef<HTMLDivElement>(null);

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
      className="fixed left-1/2 -translate-x-1/2 z-30 w-[468px]"
      initial={{ opacity: 0, y: 0 }}
      animate={{ 
        opacity: 1,
        y: navBarPosition.y - (PALETTE_HEIGHT + GAP_BETWEEN_PALETTES),
        bottom: `calc(env(safe-area-inset-bottom, 0) + ${24 + NAVBAR_HEIGHT + GAP_BETWEEN_PALETTES}px)`,
      }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        height: PALETTE_HEIGHT
      }}
    >
      <div 
        ref={bottomNavRef}
        className="bottom-nav-glow open h-full flex flex-col"
      >
        <div className="inner !p-0 h-full relative">
            <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Close command palette"
            >
                <XCircle className="h-5 w-5" />
            </Button>
            <Command>
                <CommandListContent
                    search={search}
                    onSelectCommand={(callback) => {
                    onOpenChange(false);
                    callback();
                    }}
                    onEventCreation={() => {}} // Placeholder
                    {...modalProps}
                />
            </Command>
        </div>
      </div>
    </motion.div>
  );
}

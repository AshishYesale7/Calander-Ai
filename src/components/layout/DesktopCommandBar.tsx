'use client';

import { motion, type PanInfo, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, AudioLines, Search, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import React from 'react';
import { Input } from '../ui/input';
import { Command } from '@/components/ui/command';
import { CommandListContent } from './CommandPalette';

interface DesktopCommandBarProps {
  onOpenCommandPalette: () => void;
  search: string;
  setSearch: (search: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onDrag: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  navBarPosition: { x: number; y: number };
  isAiPaletteOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  modalProps: any;
}

export default function DesktopCommandBar({
  onOpenCommandPalette,
  search,
  setSearch,
  inputRef,
  onDrag,
  navBarPosition,
  isAiPaletteOpen,
  onOpenChange,
  modalProps,
}: DesktopCommandBarProps) {
  const bottomNavRef = React.useRef<HTMLDivElement>(null);
  const GAP_BETWEEN_PALETTES = 10;
  const NAVBAR_HEIGHT = 56;
  const PALETTE_HEIGHT = 450;
  
  const totalHeight = NAVBAR_HEIGHT + PALETTE_HEIGHT + GAP_BETWEEN_PALETTES;

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
      onDrag={onDrag}
      dragMomentum={false}
      initial={{ y: 0, x: "-50%" }}
      className="fixed bottom-6 left-1/2 z-40 w-[468px] cursor-grab active:cursor-grabbing"
      style={{
        height: isAiPaletteOpen ? totalHeight : NAVBAR_HEIGHT,
        transition: 'height 0.3s ease-in-out'
      }}
    >
        <div 
            ref={bottomNavRef}
            className="bottom-nav-glow open h-full flex flex-col"
        >
            <AnimatePresence>
              {isAiPaletteOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: PALETTE_HEIGHT }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden relative"
                >
                    <div className="inner !p-0 h-full">
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
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="relative w-full h-14 flex-shrink-0">
                 {isAiPaletteOpen && <div className="h-px w-full bg-white/10 absolute top-0" style={{top: `${GAP_BETWEEN_PALETTES/2}px`}}/>}
                <div 
                  className="inner h-full flex items-center"
                  style={{
                    paddingTop: isAiPaletteOpen ? `${GAP_BETWEEN_PALETTES}px` : '0',
                    height: '100%',
                  }}
                >
                    <div className="relative w-full h-full flex items-center px-4 text-gray-400">
                        <Search className="h-5 w-5 mr-3" />
                        <Input
                            ref={inputRef}
                            placeholder="How can Calendar.ai help?"
                            className="flex-1 bg-transparent border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto"
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
        </div>
    </motion.div>
  );
}

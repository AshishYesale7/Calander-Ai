
'use client';

import { motion, useDragControls } from 'framer-motion';
import { Sparkles, ChevronDown, AudioLines, Search, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import AiAssistantChat from './AiAssistantChat';

export default function DesktopCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const bottomNavRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  // Effect for cycling through the glow colors
  useEffect(() => {
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

  // Effect for keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => {
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
            return true;
        });
      }
      if (e.key === 'Escape') {
          setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Effect to center the component only on initial mount
  useEffect(() => {
    if (bottomNavRef.current) {
        const { offsetWidth } = bottomNavRef.current;
        bottomNavRef.current.style.left = `${(window.innerWidth - offsetWidth) / 2}px`;
        bottomNavRef.current.style.bottom = '24px';
    }
  }, []);


  return (
    <motion.div
      ref={bottomNavRef}
      drag
      dragListener={false} 
      onPointerDown={(e) => dragControls.start(e)}
      dragControls={dragControls}
      dragMomentum={false}
      style={{ position: 'fixed', zIndex: 40 }}
      className="w-[468px] cursor-grab active:cursor-grabbing"
    >
      <motion.div 
        className="desktop-command-bar-glow open flex flex-col"
        animate={{ height: isOpen ? '450px' : '56px' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <span className="shine"></span><span className="shine shine-bottom"></span>
        <span className="glow"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>

        <div className="inner h-full !p-0 flex flex-col">
            {isOpen && (
              <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Close command palette"
              >
                  <XCircle className="h-5 w-5" />
              </Button>
            )}

            {isOpen && (
                <AiAssistantChat 
                  initialPrompt={search} 
                  onBack={() => setIsOpen(false)} 
                />
            )}
            
            <div className="relative w-full h-14 flex px-4 text-gray-400 pt-2">
              <div className="flex w-full">
                <Search className="h-5 w-5 mr-3 mt-1" />
                <Input
                    ref={inputRef}
                    placeholder="How can Calendar.ai help?"
                    className="flex-1 bg-transparent border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onPointerDown={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-2 mt-1">
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
    </motion.div>
  );
}

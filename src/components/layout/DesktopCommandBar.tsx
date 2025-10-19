
'use client';

import { motion, type PanInfo } from 'framer-motion';
import { Sparkles, ChevronDown, AudioLines, Search, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import AiAssistantChat from './AiAssistantChat';

interface DesktopCommandBarProps {
  // Props are removed as the component will now manage its own state.
}

export default function DesktopCommandBar({}: DesktopCommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const bottomNavRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
  
  // Keyboard shortcut to open (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => {
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
            return true; // Always open on shortcut
        });
      }
      if (e.key === 'Escape') {
          setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-[468px] cursor-grab active:cursor-grabbing"
    >
      <motion.div 
        ref={bottomNavRef}
        className="bottom-nav-glow open flex flex-col"
        animate={{ height: isOpen ? '450px' : '56px' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <span className="shine"></span>
        <span className="shine shine-bottom"></span>
        <span className="glow"></span>
        <span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span>
        <span className="glow glow-bright glow-bottom"></span>

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
            
            <div className="relative w-full h-14 flex-shrink-0 flex items-center px-4 text-gray-400 mt-auto">
                <Search className="h-5 w-5 mr-3" />
                <Input
                    ref={inputRef}
                    placeholder="How can Calendar.ai help?"
                    className="flex-1 bg-transparent border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
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
      </motion.div>
    </motion.div>
  );
}

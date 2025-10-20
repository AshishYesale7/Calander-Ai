
'use client';

import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, AudioLines, Search, XCircle, ArrowUp } from 'lucide-react';
import { Button } from '../ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import AiAssistantChat from './AiAssistantChat';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';


export default function DesktopCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  const [size, setSize] = useState({ width: 580, height: 480 });

  const handleResize = (event: React.PointerEvent) => {
    const newWidth = Math.max(480, size.width + event.movementX * 2);
    const newHeight = Math.max(400, size.height + event.movementY * 2);
    setSize({ width: newWidth, height: newHeight });
  };
  
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
        const navElement = containerRef.current;
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
    if (containerRef.current) {
        const { offsetWidth } = containerRef.current;
        containerRef.current.style.left = `${(window.innerWidth - offsetWidth) / 2}px`;
        containerRef.current.style.bottom = '24px';
    }
  }, []);


  return (
    <motion.div
      ref={containerRef}
      drag
      dragListener={false} 
      dragControls={dragControls}
      dragMomentum={false}
      style={{ position: 'fixed', zIndex: 40 }}
      className="cursor-grab active:cursor-grabbing"
      animate={{ width: size.width, height: isOpen ? size.height : "auto" }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div 
        className={cn("desktop-command-bar-glow flex flex-col h-full", isOpen && 'open')}
        layout
      >
        <span className="shine"></span>
        <span className="glow"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>

        <div className={cn("inner !p-0 flex flex-col h-full", isOpen ? "justify-between" : "justify-center")}>
          <AnimatePresence>
          {isOpen && (
            <motion.div 
              key="chat-view"
              className="flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AiAssistantChat 
                initialPrompt={search} 
                onBack={() => setIsOpen(false)}
                dragControls={dragControls}
              />
               <motion.div
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    const onPointerMove = (e: PointerEvent) => handleResize(e);
                    const onPointerUp = () => {
                        document.removeEventListener('pointermove', onPointerMove);
                        document.removeEventListener('pointerup', onPointerUp);
                    };
                    document.addEventListener('pointermove', onPointerMove);
                    document.addEventListener('pointerup', onPointerUp);
                  }}
                  className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
              />
            </motion.div>
          )}
          </AnimatePresence>

          {/* This is the search bar that is now always present but styled differently */}
           <div 
            className={cn(
              "relative w-full flex items-center text-gray-400 transition-all duration-300", 
              isOpen ? "p-2" : "py-2 px-4"
            )}
            onClick={() => { if (!isOpen) setIsOpen(true); }}
            onPointerDown={(e) => {
                if (!isOpen) { // Only allow dragging from here when collapsed
                    dragControls.start(e)
                }
                e.stopPropagation()
             }}
          >
            <Search className="h-5 w-5 mr-3" />
            <Input
                ref={inputRef}
                placeholder={isOpen ? "Follow-up question..." : "How can Calendar.ai help?"}
                className={cn(
                  "flex-1 border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto py-1",
                  isOpen ? "bg-black" : "bg-transparent"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {if (!isOpen) setIsOpen(true)}}
                onPointerDown={(e) => e.stopPropagation()} // Stop this from triggering the parent's drag
            />
            <AnimatePresence>
            {!isOpen ? (
              <motion.div 
                key="collapsed-buttons"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Auto
                      <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center">
                      <AudioLines className="h-5 w-5" />
                  </div>
              </motion.div>
            ) : (
               <motion.div
                key="open-button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
               >
                 <Button size="icon" className="h-8 w-8 bg-gray-600 hover:bg-gray-500 rounded-full">
                    <ArrowUp size={18}/>
                  </Button>
               </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

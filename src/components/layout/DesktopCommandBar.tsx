
'use client';

import { motion, useDragControls, AnimatePresence, useAnimation } from 'framer-motion';
import { Sparkles, ChevronDown, AudioLines, Search, XCircle, ArrowUp, Paperclip } from 'lucide-react';
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

  const [size, setSize] = useState({
      open: { width: 580, height: 480 },
      closed: { width: 400, height: 56 }
  });
  
  const lastOpenPosition = useRef<{ x: number, y: number } | null>(null);
  const animationControls = useAnimation();
  const isInitialized = useRef(false);

  // This effect sets the initial, correct bottom-center position
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized.current && containerRef.current) {
      const initialX = (window.innerWidth - size.closed.width) / 2;
      const initialY = window.innerHeight - size.closed.height - 24;
      animationControls.set({
          x: initialX,
          y: initialY,
          width: size.closed.width,
          height: size.closed.height,
      });
      isInitialized.current = true;
    }
  }, [animationControls, size.closed]);

  // This effect handles the logic for opening and closing the command bar
  useEffect(() => {
    if (!isInitialized.current) return;

    if (isOpen) {
      let targetX, targetY;
      if (lastOpenPosition.current) {
        targetX = lastOpenPosition.current.x;
        targetY = lastOpenPosition.current.y;
      } else {
        // Default to bottom-center on first open
        targetX = (window.innerWidth - size.open.width) / 2;
        targetY = window.innerHeight - size.open.height - 24;
      }
      animationControls.start({
        x: targetX,
        y: targetY,
        width: size.open.width,
        height: size.open.height,
        transition: { type: 'spring', stiffness: 400, damping: 30 }
      });
    } else {
      const closedX = (window.innerWidth - size.closed.width) / 2;
      const closedY = window.innerHeight - size.closed.height - 24;
      animationControls.start({
        x: closedX,
        y: closedY,
        width: size.closed.width,
        height: size.closed.height,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      });
    }
  }, [isOpen, size.open, size.closed, animationControls]);


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
              setTimeout(() => inputRef.current?.focus(), 100);
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

  // Calculate drag constraints based on current size and window dimensions
  const getDragConstraints = () => {
    const currentSize = isOpen ? size.open : size.closed;
    return {
      top: 0,
      left: 0,
      right: window.innerWidth - currentSize.width,
      bottom: window.innerHeight - currentSize.height,
    };
  };


  return (
    <motion.div
      ref={containerRef}
      drag
      dragListener={false} 
      dragControls={dragControls}
      dragMomentum={false}
      dragConstraints={getDragConstraints()}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
      onDragEnd={() => {
        if (containerRef.current) {
            const { x, y } = containerRef.current.getBoundingClientRect();
            // Only update the open position if the card is actually open
            if (isOpen) {
              lastOpenPosition.current = { x, y };
            }
        }
      }}
      style={{ position: 'fixed', zIndex: 40 }}
      animate={animationControls}
    >
      <motion.div 
        className={cn("desktop-command-bar-glow flex flex-col h-full", isOpen && 'open')}
        layout="position"
      >
        <span className="shine"></span>
        <span className="glow"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>

        <div className={cn("inner !p-0 flex flex-col h-full justify-between")}>
          <AnimatePresence>
          {isOpen && (
            <motion.div 
              key="chat-view"
              className="flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <AiAssistantChat 
                initialPrompt={search} 
                onBack={() => setIsOpen(false)}
                dragControls={dragControls}
              />
            </motion.div>
          )}
          </AnimatePresence>
           <div 
            className={cn(
              "relative w-full flex items-center text-gray-400 transition-all duration-300", 
              isOpen ? "py-2 px-3 bg-black" : "py-2 px-4 cursor-grab active:cursor-grabbing"
            )}
            onClick={() => { if (!isOpen) setIsOpen(true); }}
            onPointerDown={(e) => {
                if (!isOpen) { 
                    dragControls.start(e)
                }
             }}
          >
            {isOpen ? <Paperclip className="h-5 w-5 mr-3" /> : <Search className="h-5 w-5 mr-3" />}
            <Input
                ref={inputRef}
                placeholder={isOpen ? "Follow-up question..." : "Ask Calendar.ai"}
                className={cn(
                  "flex-1 border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto py-1",
                  isOpen ? "bg-black" : "bg-transparent cursor-pointer"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {if (!isOpen) setIsOpen(true)}}
                onPointerDown={(e) => e.stopPropagation()} // Stop this from triggering the parent's drag
            />
            <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div 
                key="collapsed-buttons"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
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
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
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


'use client';

import { motion, useDragControls, AnimatePresence, useAnimation } from 'framer-motion';
import { Paperclip, ChevronDown, AudioLines, Search, XCircle, ArrowUp, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import AiAssistantChat from './AiAssistantChat';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';


export default function DesktopCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
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

  // DO NOT DELETE: This comment is for preserving the logic.
  // The restricted dragging logic is implemented here to keep the component within screen bounds.
  const getDragConstraints = () => {
    if (containerRef.current) {
      const parent = document.body;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const selfRect = containerRef.current.getBoundingClientRect();
        
        return {
          left: 0,
          right: parentRect.width - selfRect.width,
          top: 0,
          bottom: parentRect.height - selfRect.height,
        };
      }
    }
    return { left: 0, right: 0, top: 0, bottom: 0 };
  };

  // DO NOT DELETE: This comment is for preserving the logic.
  // This effect handles the opening, closing, and full-screen animations.
  // It includes "smart re-opening" logic to check screen boundaries and prevent the
  // command bar from opening partially off-screen.
  useEffect(() => {
    if (!isInitialized.current) {
        // Set initial position on first render
        const initialX = (window.innerWidth - size.closed.width) / 2;
        const initialY = window.innerHeight - size.closed.height - 24;
        animationControls.set({
            x: initialX,
            y: initialY,
            width: size.closed.width,
            height: size.closed.height,
        });
        isInitialized.current = true;
        return;
    };
    
    if (isFullScreen) {
        animationControls.start({
            x: 0,
            y: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: '0px',
            transition: { type: 'spring', stiffness: 400, damping: 30 }
        });
        return; 
    }

    if (isOpen) {
      let targetX, targetY;
      
      if (lastOpenPosition.current) {
        targetX = lastOpenPosition.current.x;
        targetY = lastOpenPosition.current.y;
      } else {
        targetX = (window.innerWidth - size.open.width) / 2;
        targetY = window.innerHeight - size.open.height - 24;
      }

      // Boundary checks before opening to prevent overflow.
      const rightBoundary = window.innerWidth - size.open.width - 8;
      const bottomBoundary = window.innerHeight - size.open.height - 8;
      
      targetX = Math.max(8, Math.min(targetX, rightBoundary));
      targetY = Math.max(8, Math.min(targetY, bottomBoundary));

      animationControls.start({
        x: targetX,
        y: targetY,
        width: size.open.width,
        height: size.open.height,
        borderRadius: '1.25rem',
        transition: { type: 'spring', stiffness: 400, damping: 30 }
      });
    } else {
      if (containerRef.current) {
         const { x, y } = containerRef.current.getBoundingClientRect();
         if (y < window.innerHeight - size.closed.height - 50) {
            lastOpenPosition.current = { x, y };
         }
      }
      
      const closedX = (window.innerWidth - size.closed.width) / 2;
      const closedY = window.innerHeight - size.closed.height - 24;
      animationControls.start({
        x: closedX,
        y: closedY,
        width: size.closed.width,
        height: size.closed.height,
        borderRadius: '1.375rem',
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      });
    }
  }, [isOpen, isFullScreen, size.open, size.closed, animationControls]);

  // DO NOT DELETE: This comment is for preserving the logic.
  // This effect cycles through a predefined set of color pairs to create the
  // animated glowing border effect. It updates CSS variables which are used by the
  // `desktop-command-bar-glow` classes in `globals.css`.
  useEffect(() => {
    let currentIndex = 0;
    const colorPairs = [
        { hue1: 320, hue2: 280 }, { hue1: 280, hue2: 240 },
        { hue1: 240, hue2: 180 }, { hue1: 180, hue2: 140 },
        { hue1: 140, hue2: 60 },  { hue1: 60, hue2: 30 },
        { hue1: 30, hue2: 0},    { hue1: 0, hue2: 320 },
    ];
    const colorInterval = setInterval(() => {
        const bar = containerRef.current;
        if (bar) {
            const nextColor = colorPairs[currentIndex];
            bar.style.setProperty('--hue1', String(nextColor.hue1));
            bar.style.setProperty('--hue2', String(nextColor.hue2));
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
          setIsFullScreen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleToggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  }

  return (
    <motion.div
      ref={containerRef}
      drag={!isFullScreen}
      dragListener={false} 
      dragControls={dragControls}
      dragMomentum={false}
      dragConstraints={getDragConstraints()}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      style={{ position: 'fixed', zIndex: 40 }}
      animate={animationControls}
      onDragStart={() => {
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
      }}
      onDragEnd={() => {
        document.body.style.userSelect = '';
      }}
    >
      <motion.div 
        className={cn("desktop-command-bar-glow flex flex-col h-full", (isOpen || isFullScreen) && 'open')}
        layout="position"
      >
        {/* DO NOT DELETE: This comment is for preserving the logic.
            The `span` elements below are essential for the glowing border effect.
            They are styled by the `desktop-command-bar-glow` and related classes in `globals.css`.
        */}
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
                handleToggleFullScreen={handleToggleFullScreen}
                isFullScreen={isFullScreen}
              />
            </motion.div>
          )}
          </AnimatePresence>
           <div 
            className={cn(
              "relative w-full flex items-center text-gray-400 transition-all duration-300", 
              isOpen ? "py-2 px-3" : "p-2 px-4 cursor-grab active:cursor-grabbing justify-center"
            )}
            onClick={() => { if (!isOpen) setIsOpen(true); }}
            onPointerDown={(e) => {
                if (!isOpen) { 
                    dragControls.start(e)
                }
             }}
          >
             <div className={cn("flex items-center w-full", isOpen ? "" : "translate-y-[-2px]")}>
                
                <AnimatePresence mode="wait">
                {isOpen ? (
                     <motion.div 
                        key="open-input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.1 } }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="w-full"
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag from input area
                     >
                       <div className="bg-gray-800/50 rounded-xl p-1.5 border border-white/10 shadow-lg">
                            <Textarea
                                placeholder="Send a message..."
                                className="bg-transparent border-none focus-visible:ring-0 text-sm text-white placeholder:text-gray-400 resize-none min-h-[32px]"
                                rows={1}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="mt-1.5 flex justify-between items-center">
                                <div className="flex items-center gap-0.5">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-white/10 hover:text-white"><Paperclip size={14}/></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-white/10 hover:text-white"><Sparkles size={14}/></Button>
                                    <Badge variant="outline" className="bg-blue-900/50 border-blue-500/50 text-blue-300 text-[10px] py-0 px-1.5">
                                        rag-v1 <X size={10} className="ml-1 cursor-pointer" />
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="secondary" className="h-6 text-xs bg-white/20 text-white">User</Button>
                                    <Button variant="secondary" className="h-6 text-xs bg-white/20 text-white">Insert</Button>
                                    <Button size="icon" className="h-6 w-6 bg-gray-600 hover:bg-gray-500"><ArrowUp size={14}/></Button>
                                </div>
                            </div>
                        </div>
                     </motion.div>
                ) : (
                  <motion.div 
                    key="collapsed-bar"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center w-full"
                  >
                      <Paperclip className="h-5 w-5 mr-3" />
                      <Input
                          ref={inputRef}
                          placeholder="Ask Calendar.ai..."
                          className={cn(
                            "flex-1 border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto py-1",
                            "bg-transparent cursor-pointer"
                          )}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onFocus={() => {if (!isOpen) setIsOpen(true)}}
                      />
                      <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          Auto
                          <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                      <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center">
                          <AudioLines className="h-5 w-5" />
                      </div>
                  </motion.div>
                )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

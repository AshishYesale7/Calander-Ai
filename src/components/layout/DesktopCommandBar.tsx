
'use client';

import { motion, useDragControls, AnimatePresence } from 'framer-motion';
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

  const [size, setSize] = useState({ width: 580, height: 480 });
  
  // Use refs to store position to prevent re-renders on drag, which is smoother.
  const positionRef = useRef({ x: 0, y: 0 });

  const handleResize = (
    event: PointerEvent,
    direction: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ) => {
    setSize(prevSize => {
      let newWidth = prevSize.width;
      let newHeight = prevSize.height;

      if (direction.includes('right')) newWidth += event.movementX;
      if (direction.includes('left')) {
        newWidth -= event.movementX;
        positionRef.current.x += event.movementX;
      }
      if (direction.includes('bottom')) newHeight += event.movementY;
      if (direction.includes('top')) {
        newHeight -= event.movementY;
        positionRef.current.y += event.movementY;
      }
      
      newWidth = Math.max(480, newWidth);
      newHeight = Math.max(400, newHeight);

      return { width: newWidth, height: newHeight };
    });
  };
  
  const ResizeHandle = ({ direction }: { direction: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
    const classMap = {
      'top': 'cursor-n-resize top-0 left-1/2 -translate-x-1/2 h-2 w-full',
      'bottom': 'cursor-s-resize bottom-0 left-1/2 -translate-x-1/2 h-2 w-full',
      'left': 'cursor-w-resize top-1/2 -translate-y-1/2 left-0 w-2 h-full',
      'right': 'cursor-e-resize top-1/2 -translate-y-1/2 right-0 w-2 h-full',
      'top-left': 'cursor-nw-resize top-0 left-0 h-3 w-3',
      'top-right': 'cursor-ne-resize top-0 right-0 h-3 w-3',
      'bottom-left': 'cursor-sw-resize bottom-0 left-0 h-3 w-3',
      'bottom-right': 'cursor-se-resize bottom-0 right-0 h-3 w-3',
    };
    
    return (
       <div
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const onPointerMove = (e: PointerEvent) => handleResize(e, direction);
            const onPointerUp = () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
            };
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
          }}
          className={cn("absolute", classMap[direction])}
      />
    )
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
        positionRef.current = {
          x: (window.innerWidth - size.width) / 2,
          y: window.innerHeight - (isOpen ? size.height : 80) - 24, // 24px from bottom
        };
        // Force a re-render to apply initial position
        if (containerRef.current) {
          containerRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
        }
    }
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (containerRef.current) {
       positionRef.current = {
        ...positionRef.current,
        y: window.innerHeight - (isOpen ? size.height : 80) - 24,
      };
      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
      }
    }
  }, [isOpen, size.height]);


  return (
    <motion.div
      ref={containerRef}
      drag
      dragListener={false} 
      dragControls={dragControls}
      dragMomentum={false}
      style={{ position: 'fixed', zIndex: 40 }}
      animate={{ 
        width: size.width, 
        height: isOpen ? size.height : "auto",
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onDragStart={() => {
        if (containerRef.current) {
          const { x, y } = containerRef.current.getBoundingClientRect();
          positionRef.current = { x, y };
        }
      }}
      onDragEnd={(_, info) => {
        positionRef.current = {
            x: positionRef.current.x + info.offset.x,
            y: positionRef.current.y + info.offset.y
        };
      }}
    >
      <motion.div 
        className={cn("desktop-command-bar-glow flex flex-col h-full", isOpen && 'open')}
        layout
      >
        <span className="shine"></span>
        
        <span className="glow"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>
        
        {isOpen && (
          <>
            <ResizeHandle direction="top" />
            <ResizeHandle direction="right" />
            <ResizeHandle direction="bottom" />
            <ResizeHandle direction="left" />
            <ResizeHandle direction="top-left" />
            <ResizeHandle direction="top-right" />
            <ResizeHandle direction="bottom-left" />
            <ResizeHandle direction="bottom-right" />
          </>
        )}

        <div className={cn("inner !p-0 flex flex-col h-full justify-between")}>
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
            </motion.div>
          )}
          </AnimatePresence>
           <div 
            className={cn(
              "relative w-full flex items-center text-gray-400 transition-all duration-300", 
              isOpen ? "py-2 px-3 bg-black" : "py-2 px-4 cursor-grab active:cursor-grabbing"
            )}
            onPointerDown={(e) => {
                if (!isOpen) { 
                    dragControls.start(e)
                }
             }}
          >
            {isOpen ? <Paperclip className="h-5 w-5 mr-3" /> : <Search className="h-5 w-5 mr-3" />}
            <Input
                ref={inputRef}
                placeholder={isOpen ? "Follow-up question..." : "How can Calendar.ai help?"}
                className={cn(
                  "flex-1 border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto py-1",
                  isOpen ? "bg-black" : "bg-transparent cursor-pointer"
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

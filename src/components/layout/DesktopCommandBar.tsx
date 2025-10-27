
'use client';

import { motion, useDragControls, AnimatePresence, useAnimation } from 'framer-motion';
import { Paperclip, ChevronDown, Sparkles, X, Minus, Expand, Shrink, ArrowUp, Image as ImageIcon, Lightbulb, Telescope, BookOpen, MoreHorizontal, Globe, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input } from '../ui/input';
import AiAssistantChat from './AiAssistantChat';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from '../ui/dropdown-menu';
import type { ChatMessage } from '@/components/layout/AiAssistantChat';
import { createConversationalEvent, type ConversationalEventOutput } from '@/ai/flows/conversational-event-flow';
import { useApiKey } from '@/hooks/use-api-key';
import shortid from 'shortid';
import { useChat } from '@/context/ChatContext';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export default function DesktopCommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
  const [selectedMcpServer, setSelectedMcpServer] = useState('Calendar ai');
  const mcpServers = ['Calendar ai', 'Google Drive', 'Gmail', 'Slack', 'Notion'];
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();
  const { isChatSidebarOpen, chattingWith } = useChat();

  useEffect(() => {
    if (chatSessions.length === 0) {
      const newId = shortid.generate();
      setChatSessions([{ id: newId, title: 'New Chat', messages: [], createdAt: new Date() }]);
      setActiveChatId(newId);
    }
  }, [chatSessions]);

  const activeChat = useMemo(() => {
    return chatSessions.find(session => session.id === activeChatId);
  }, [chatSessions, activeChatId]);


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
      // When opening, focus the textarea
      setTimeout(() => textareaRef.current?.focus(), 100);
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
      
      const shouldShiftLeft = isChatSidebarOpen || !!chattingWith;
      
      const closedX = shouldShiftLeft
        ? 80 // Position on the left if chat is open, just right of the main sidebar
        : (window.innerWidth - size.closed.width) / 2; // Center it otherwise
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
  }, [isOpen, isFullScreen, isChatSidebarOpen, chattingWith, size.open, size.closed, animationControls]);

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
              setTimeout(() => textareaRef.current?.focus(), 100);
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

  const { modelName, modelVersion } = useMemo(() => {
    const parts = selectedModel.split(' ');
    if (parts.length >= 2) {
        const version = parts.pop();
        const name = parts.join(' ');
        return { modelName: name, modelVersion: version };
    }
    return { modelName: selectedModel, modelVersion: '' };
  }, [selectedModel]);

  const handleAIResponse = async (history: ChatMessage[]) => {
      setIsLoading(true);
      try {
          const result: ConversationalEventOutput = await createConversationalEvent({
              chatHistory: history.map(m => ({ role: m.role, content: m.content })),
              apiKey,
          });
          if (result.response) {
            setChatSessions(prevSessions =>
              prevSessions.map(session =>
                session.id === activeChatId
                  ? { ...session, messages: [...session.messages, { role: 'model', content: result.response! }] }
                  : session
              )
            );
          }
      } catch (e) {
          setChatSessions(prevSessions =>
            prevSessions.map(session =>
              session.id === activeChatId
                ? { ...session, messages: [...session.messages, { role: 'model', content: "Sorry, I encountered an error." }] }
                : session
            )
          );
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    if (!activeChat || isLoading) return;

    const lastMessage = activeChat.messages[activeChat.messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      handleAIResponse(activeChat.messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.messages, activeChatId]);
  
  const handleNewChat = () => {
    const newId = shortid.generate();
    const newSession: ChatSession = { id: newId, title: 'New Chat', messages: [], createdAt: new Date() };
    setChatSessions(prev => [...prev, newSession]);
    setActiveChatId(newId);
  };

  const handleSend = () => {
    const textToSend = input || search;
    if (!textToSend.trim() || isLoading || !activeChatId) return;

    const newUserMessage: ChatMessage = { role: 'user', content: textToSend };
    
    setChatSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === activeChatId) {
          const newMessages = [...session.messages, newUserMessage];
          const newTitle = session.messages.length === 0 ? textToSend.substring(0, 30) : session.title;
          return { ...session, messages: newMessages, title: newTitle };
        }
        return session;
      })
    );

    setInput('');
    setSearch('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

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
        <span className="shine"></span>
        <span className="glow"></span><span className="glow glow-bottom"></span>
        <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>

        <div className={cn("inner !p-0 flex flex-col h-full justify-between")}>
          <AnimatePresence>
          {isOpen ? (
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
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                chatHistory={activeChat?.messages || []}
                isLoading={isLoading}
                chatSessions={chatSessions}
                activeChatId={activeChatId || ''}
                onNewChat={handleNewChat}
                onSelectChat={setActiveChatId}
              />
              <div 
                  className="relative w-full flex items-center text-gray-400 p-3"
                  onPointerDown={(e) => e.stopPropagation()}
              >
                  <div className="bg-gray-800/50 rounded-xl p-1.5 border border-white/10 shadow-lg w-full">
                      <Textarea
                          ref={textareaRef}
                          placeholder="Send a message..."
                          className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-gray-400 resize-none min-h-[32px]"
                          rows={1}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
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
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="secondary" className="h-6 text-xs bg-white/20 text-white">
                                          Auto <ChevronDown className="h-3 w-3 ml-1" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="frosted-glass w-56">
                                    <DropdownMenuItem>
                                      <Paperclip className="mr-2 h-4 w-4" />
                                      <span>Add photos & files</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <ImageIcon className="mr-2 h-4 w-4" />
                                      <span>Create image</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Lightbulb className="mr-2 h-4 w-4" />
                                      <span>Thinking</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Telescope className="mr-2 h-4 w-4" />
                                      <span>Deep research</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <BookOpen className="mr-2 h-4 w-4" />
                                      <span>Study and learn</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <MoreHorizontal className="mr-2 h-4 w-4" />
                                            <span>More</span>
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="frosted-glass">
                                          <DropdownMenuItem>
                                            <Globe className="mr-2 h-4 w-4" />
                                            <span>Web search</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            <span>Canvas</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                              <Button size="icon" className="h-6 w-6 bg-gray-600 hover:bg-gray-500" onClick={handleSend} disabled={isLoading}><ArrowUp size={14}/></Button>
                          </div>
                      </div>
                  </div>
              </div>

               <div className="text-[10px] text-gray-500 px-3 py-0.5 border-t border-white/10 flex justify-between items-center">
                  <span>{modelName} ({modelVersion})</span>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-gray-500 hover:text-white">
                              MCP Server: {selectedMcpServer} <ChevronDown className="ml-1.5 h-3 w-3" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="frosted-glass">
                          <DropdownMenuLabel>MCP Server</DropdownMenuLabel>
                          {mcpServers.map(server => (
                              <DropdownMenuItem key={server} onSelect={() => setSelectedMcpServer(server)}>
                                  {server}
                              </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </motion.div>
          ) : (
             <motion.div 
                key="collapsed-bar"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="relative w-full flex items-center text-gray-400 p-2 px-4 cursor-grab active:cursor-grabbing justify-center"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center w-full translate-y-[-2px]">
                  <Paperclip className="h-5 w-5 mr-3" />
                  <Input
                      placeholder="Ask Calendar.ai..."
                      className={cn(
                        "flex-1 border-none text-base text-muted-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-auto py-1",
                        "bg-transparent cursor-text"
                      )}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => {
                        if (!isOpen) {
                            setIsOpen(true);
                        }
                      }}
                  />
                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Auto
                      <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  <Button size="icon" className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center">
                      <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}


'use client';

import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Paperclip, ArrowUp, ChevronDown } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { useApiKey } from '@/hooks/use-api-key';
import { generateGreeting } from '@/ai/flows/generate-greeting-flow';
import { answerWebAppQuestions, type WebAppQaInput, type WebAppQaOutput } from '@/ai/flows/webapp-qa-flow';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const parseMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(#\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.endsWith('](#)')) {
      const linkText = part.slice(1, part.indexOf(']'));
      return <a href="#" key={index} className="text-accent underline hover:text-accent/80">{linkText}</a>;
    }
    return part;
  });
};

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-white",
          isUser ? "bg-blue-600 rounded-br-md" : "bg-neutral-700 rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{parseMarkdown(message.content)}</p>
      </div>
    </div>
  );
};

export default function LandingPageChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOrb, setIsOrb] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();
  const [greeting, setGreeting] = useState("How can I help?");

  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
  
  useEffect(() => {
    generateGreeting({ name: 'there' }).then(res => {
        setGreeting(`${res.greeting} How can I help?`);
    });
  }, []);

  const handleAIResponse = async (history: ChatMessage[]) => {
    setIsLoading(true);
    try {
      const result: WebAppQaOutput = await answerWebAppQuestions({
        chatHistory: history.map(m => ({ role: m.role, content: m.content })),
        apiKey,
      });

      if (result.response) {
        setChatHistory(prev => [...prev, { role: 'model', content: result.response! }]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
      handleAIResponse(chatHistory);
    }
  }, [chatHistory]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    setChatHistory(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);
  
  useEffect(() => {
    if(isOpen) {
        setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
        // When closing the chat, revert to orb state
        const timer = setTimeout(() => setIsOrb(true), 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBarClick = () => {
    if (isOrb) {
        setIsOrb(false);
    } else {
        setIsOpen(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <AnimatePresence>
          {!isOpen && (
             <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
             >
                <div 
                    onClick={handleBarClick}
                    className={cn(
                        "landing-command-orb transition-all duration-300 ease-in-out",
                        isOrb ? "is-orb" : "is-bar"
                    )}
                >
                    <span className="shine"></span>
                    <span className="glow"></span><span className="glow glow-bottom"></span>
                    <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>
                    <div className="inner !p-0">
                        <div className="relative w-full h-full flex items-center text-gray-400 p-2 px-4 cursor-pointer justify-center">
                            <div className="flex items-center w-full">
                                <Sparkles className="h-5 w-5 mr-3 shrink-0" />
                                <span className="flex-1 text-base text-muted-foreground whitespace-nowrap">Ask Calendar.ai...</span>
                                <Button size="icon" className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                                    <ArrowUp className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            drag={!isFullScreen}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            className={cn(
              "fixed z-50 flex flex-col bg-neutral-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden",
              isFullScreen ? "inset-0 rounded-none" : "bottom-6 left-1/2 rounded-3xl"
            )}
            initial={{ opacity: 0, y: 100, width: 400, height: 64 }}
            animate={{ 
                opacity: 1, 
                y: isFullScreen ? 0 : 'auto', 
                x: isFullScreen ? 0 : '-50%',
                width: isFullScreen ? '100vw' : 580,
                height: isFullScreen ? '100vh' : 480,
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div 
              className="flex-shrink-0 h-10 border-b border-white/10 flex items-center justify-center px-1.5 pr-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex-1 text-center">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="frosted-glass bg-gray-700/50 border-white/10 h-7 text-xs">
                            {selectedModel} <ChevronDown className="ml-1.5 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="frosted-glass">
                        <DropdownMenuLabel>AI Model</DropdownMenuLabel>
                        {['Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 2.0 Nano'].map(model => (
                            <DropdownMenuItem key={model} onSelect={() => setSelectedModel(model)}>
                                {model}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Chat Body */}
            <div ref={scrollAreaRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
              <ChatBubble message={{ role: 'model', content: greeting }} />
              {chatHistory.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-white bg-neutral-700 rounded-bl-md">
                        <LoadingSpinner size="sm" />
                    </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-white/10" onPointerDown={(e) => e.stopPropagation()}>
              <div className="bg-gray-800/50 rounded-xl p-1.5 border border-white/10 shadow-lg w-full">
                  <Textarea
                      ref={textareaRef}
                      placeholder="Send a message..."
                      className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-gray-400 resize-none"
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                  />
                  <div className="mt-1.5 flex justify-between items-center">
                      <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-white/10 hover:text-white"><Paperclip size={14}/></Button>
                      </div>
                      <Button size="icon" className="h-6 w-6 bg-gray-600 hover:bg-gray-500" onClick={handleSend} disabled={isLoading || !input.trim()}><ArrowUp size={14}/></Button>
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

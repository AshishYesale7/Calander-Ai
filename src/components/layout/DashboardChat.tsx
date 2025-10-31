
'use client';

import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useApiKey } from '@/hooks/use-api-key';
import { answerWebAppQuestions, type WebAppQaInput, type WebAppQaOutput } from '@/ai/flows/webapp-qa-flow';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import LottieOrb from '../landing/LottieOrb';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing-flow';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-white shadow-md",
          isUser
            ? "bg-blue-600 rounded-br-lg"
            : "bg-neutral-700 rounded-bl-lg"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
};

interface DashboardChatProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    initialMessage: string | null;
}

export default function DashboardChat({ isOpen, setIsOpen, initialMessage }: DashboardChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();
  const { user } = useAuth();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const handleAIResponse = async (history: ChatMessage[], prompt: string) => {
    setIsLoading(true);
    try {
      const result = await answerWebAppQuestions({
        chatHistory: [...history, { role: 'user', content: prompt }].map(m => ({ role: m.role, content: m.content })),
        apiKey,
      });
      if (result.response) {
        setChatHistory(prev => [...prev, { role: 'model', content: result.response! }]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error and can't provide a response right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetBriefing = async () => {
    if (!user) return;
    setIsOpen(true);
    setChatHistory(prev => [...prev, { role: 'user', content: "Give me my daily briefing." }]);
    setIsLoading(true);
     try {
      const result = await generateDailyBriefing({ userId: user.uid, apiKey });
      if (result.briefing) {
        setChatHistory(prev => [...prev, { role: 'model', content: result.briefing }]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I couldn't generate your briefing right now." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (initialMessage) {
        const newHistory = [...chatHistory, { role: 'user', content: initialMessage }];
        setChatHistory(newHistory);
        handleAIResponse(chatHistory, initialMessage);
    }
  }, [initialMessage]);


  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const newHistory = [...chatHistory, { role: 'user', content: input }];
    setChatHistory(newHistory);
    setInput('');
    handleAIResponse(chatHistory, input);
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
    }
  }, [isOpen]);

  const handleOrbClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && chatHistory.length === 0) {
        setChatHistory([{ role: 'model', content: "Hello! How can I help?"}])
    }
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={!isOpen}
      dragMomentum={false}
      className="fixed bottom-4 right-4 z-[200] flex flex-col items-end"
      style={{ position: 'fixed' }} // Ensure it's fixed for dragging
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="w-[320px] max-h-[60vh] flex flex-col frosted-glass rounded-t-2xl">
              <div
                  ref={scrollAreaRef}
                  className="flex-1 p-4 space-y-4 overflow-y-auto"
                >
                <AnimatePresence>
                  {chatHistory.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                  ))}
                </AnimatePresence>
                  {isLoading && (
                    <motion.div layout className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-2 text-white bg-neutral-700 rounded-bl-md">
                        <LoadingSpinner size="sm" />
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="p-2 border-t border-white/10">
                    <button
                        onClick={handleGetBriefing}
                        disabled={isLoading}
                        className="w-full text-xs text-center p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                        Get Daily Briefing
                    </button>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={cn(
          "relative bottom-chat-bar",
          isOpen && "is-open"
        )}
        onPointerDown={(e) => {
            if (isOpen) {
              e.stopPropagation();
            } else {
                dragControls.start(e);
            }
        }}
      >
        <div className="flex items-center w-full h-full p-2">
          <motion.div layout="position" onClick={handleOrbClick} className="cursor-pointer">
             <LottieOrb />
          </motion.div>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                  className="flex-1 px-3 flex items-center"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto', transition: { delay: 0.2 } }}
                  exit={{ opacity: 0, width: 0 }}
              >
                  <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything..."
                      rows={1}
                      className="w-full bg-transparent border-none outline-none focus:ring-0 resize-none text-white placeholder:text-gray-400 text-base"
                  />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 p-2 hover:text-white"
              >
                <X className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

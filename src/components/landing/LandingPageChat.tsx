'use client';

import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Mic } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { useApiKey } from '@/hooks/use-api-key';
import { generateGreeting } from '@/ai/flows/generate-greeting-flow';
import { createConversationalEvent, type ConversationalEventOutput } from '@/ai/flows/conversational-event-flow';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

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
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export default function LandingPageChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();
  const [greeting, setGreeting] = useState("How can I help?");

  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateGreeting({ name: 'there' }).then(res => {
        setGreeting(`${res.greeting} How can I help?`);
    });
  }, []);

  const handleAIResponse = async (history: ChatMessage[]) => {
    setIsLoading(true);
    try {
      const result: ConversationalEventOutput = await createConversationalEvent({
        chatHistory: history.map(m => ({ role: m.role, content: m.content })),
        apiKey,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  return (
    <>
      {/* Main Floating Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="landing-page-chat-bar" onClick={() => setIsOpen(true)}>
          <div className="landing-page-chat-glow" />
          <div className="landing-page-chat-orb-container">
            <div className="landing-page-chat-orb" />
          </div>
          <span className="landing-page-chat-text">Ask Calendar.ai</span>
          <Mic className="landing-page-chat-mic" />
        </div>
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
                width: isFullScreen ? '100vw' : 400,
                height: isFullScreen ? '100vh' : 600,
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div 
              className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/10 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="font-semibold text-white">AI Assistant</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
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
              <div className="bg-neutral-800 rounded-xl p-2 flex items-end gap-2">
                <Textarea
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-gray-400 resize-none flex-1"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 flex items-center justify-center flex-shrink-0"
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

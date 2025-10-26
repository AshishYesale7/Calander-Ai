
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useApiKey } from '@/hooks/use-api-key';
import { answerWebAppQuestions, type WebAppQaInput, type WebAppQaOutput } from '@/ai/flows/webapp-qa-flow';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import LottieOrb from './LottieOrb';

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

export default function LandingPageChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
      setChatHistory(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error and can't provide a response right now." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
      handleAIResponse(chatHistory);
    }
  // This dependency array is correct. We only want to trigger this when the chatHistory changes because of a user message.
  // Adding handleAIResponse would cause an infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }
  }, [isOpen]);

  const handleOrbClick = () => {
    setIsOpen(prev => !prev);
    if (!isOpen && chatHistory.length === 0) {
        setChatHistory([{ role: 'model', content: "Hello! How can I help you understand Calendar.ai?"}])
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center">
      <div 
        ref={scrollAreaRef}
        className={cn(
            "w-full max-w-2xl p-4 space-y-4 overflow-y-auto transition-all duration-300",
            isOpen ? "max-h-[60vh]" : "max-h-0"
        )}
      >
        {chatHistory.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
        {isLoading && (
            <motion.div layout className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-white bg-neutral-700 rounded-bl-md">
                    <LoadingSpinner size="sm" />
                </div>
            </motion.div>
        )}
      </div>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={cn(
          "w-[95%] max-w-2xl mb-6 rounded-full bottom-chat-bar",
          isOpen && "is-open"
        )}
      >
        <div className="flex items-center w-full h-full p-2">
          <motion.div layout="position" onClick={handleOrbClick} className="cursor-pointer">
             <LottieOrb />
          </motion.div>
          
          {isOpen && (
            <div className="flex-1 px-3 flex items-center">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Calendar.ai..."
                    rows={1}
                    className="w-full bg-transparent border-none outline-none focus:ring-0 resize-none text-white placeholder:text-gray-400 text-lg"
                />
            </div>
          )}

          <button className="text-gray-400 p-2 hover:text-white">
            <Mic className="h-6 w-6" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

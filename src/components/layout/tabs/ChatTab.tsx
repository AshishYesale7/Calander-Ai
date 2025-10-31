
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { createConversationalEvent } from '@/ai/flows/conversational-event-flow';
import type { ChatMessage } from '@/types/database';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowUp, Plus, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ChatBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    return (
      <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "")}>
        {!isUser && (
          <Avatar className="h-8 w-8 border">
            <AvatarFallback><Bot size={20} /></AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            "max-w-[80%] rounded-xl p-3 text-sm whitespace-pre-wrap",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {message.content}
        </div>
      </div>
    );
};

export default function ChatTab() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when chat history changes
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [chatHistory, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    
    const newUserMessage: ChatMessage = { role: 'user', content: input };
    const currentHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentHistory);
    setInput('');
    setIsLoading(true);

    try {
        const result = await createConversationalEvent({
            chatHistory: currentHistory.map(m => ({ role: m.role, content: m.content })),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        if (result.response) {
            setChatHistory(prev => [...prev, { role: 'model', content: result.response! }]);
        }

        if (result.event) {
            // Save the event to Firestore
            if (db) {
                await addDoc(collection(db, 'events'), {
                    userId: user.uid,
                    title: result.event.title,
                    start: new Date(result.event.date),
                    end: result.event.endDate ? new Date(result.event.endDate) : undefined,
                    isAllDay: result.event.isAllDay,
                    notes: result.event.notes,
                    createdAt: serverTimestamp(),
                });
            }
        }
    } catch (error) {
        console.error("AI Error:", error);
        setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <ScrollArea className="flex-1 -mx-4" ref={scrollAreaRef}>
        <div className="px-4 space-y-4">
            {chatHistory.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-xl p-3 bg-muted">
                        <LoadingSpinner size="sm" />
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>
      <div className="mt-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Plus className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to create an event, or anything else..."
                rows={1}
                className="pr-12 rounded-full resize-none"
            />
            <Button
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-accent hover:bg-accent/90"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
            >
                <ArrowUp className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
}

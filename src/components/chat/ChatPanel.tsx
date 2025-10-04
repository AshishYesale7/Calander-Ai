
'use client';

import { useState, useEffect, useRef } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getMessages } from '@/services/chatService';
import { sendMessage } from '@/actions/chatActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';


interface ChatPanelProps {
  user: PublicUserProfile;
  onClose: () => void;
}

export default function ChatPanel({ user: otherUser, onClose }: ChatPanelProps) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 50);
        }
    }
  };

  useEffect(() => {
    if (!currentUser || !otherUser) return;

    setIsLoading(true);
    const unsubscribe = getMessages(currentUser.uid, otherUser.uid, (newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
      scrollToBottom();
    });

    // Cleanup the listener when the component unmounts or users change
    return () => unsubscribe();
  }, [currentUser, otherUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    // Definitive guard clause to prevent sending without both user IDs.
    if (!currentUser || !otherUser || !inputMessage.trim()) {
      return;
    }
    
    const messageToSend = inputMessage;
    setInputMessage(''); // Optimistically clear input

    try {
      await sendMessage(currentUser.uid, otherUser.uid, messageToSend);
      // The real-time listener will handle adding the message to the UI.
    } catch (error) {
      console.error("Failed to send message:", error);
      // If sending fails, restore the input field so the user can retry.
      setInputMessage(messageToSend);
      // You might want to show a toast message here.
    }
  };

  return (
    <div className="fixed top-0 right-0 h-screen w-full max-w-sm flex flex-col bg-card/80 backdrop-blur-xl border-l border-border/30 z-50 animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherUser.photoURL || ''} alt={otherUser.displayName} />
            <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-primary">{otherUser.displayName}</h3>
            <p className="text-xs text-muted-foreground">{otherUser.statusEmoji || 'online'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Message Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-16">
              Start the conversation!
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}
              >
                {!isMe && (
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={otherUser.photoURL || ''} alt={otherUser.displayName} />
                    <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    isMe
                      ? 'bg-accent text-accent-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <footer className="flex-shrink-0 p-3 border-t border-border/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Button variant="ghost" size="icon" type="button">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background/50"
            autoComplete="off"
            disabled={!currentUser}
          />
          <Button type="submit" size="icon" disabled={!inputMessage.trim() || !currentUser}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

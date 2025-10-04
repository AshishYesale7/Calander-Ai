
'use client';

import { useState } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Mock messages for demonstration
const mockMessages = [
    { id: '1', sender: 'other', text: 'Hey, how are you doing?' },
    { id: '2', sender: 'me', text: 'I\'m good, thanks! Just working on the new planner feature. How about you?' },
    { id: '3', sender: 'other', text: 'Nice! I\'m preparing for the Codeforces round tonight. A bit nervous.' },
    { id: '4', sender: 'me', text: 'You\'ll do great! You\'ve been practicing a lot.' },
];

interface ChatPanelProps {
  user: PublicUserProfile;
  onClose: () => void;
}

export default function ChatPanel({ user, onClose }: ChatPanelProps) {
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = () => {
    if (inputMessage.trim()) {
      // In a real app, this would send the message to a backend service.
      console.log('Sending message:', inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="fixed top-0 right-0 h-screen w-full max-w-sm flex flex-col bg-card/80 backdrop-blur-xl border-l border-border/30 z-50 animate-in slide-in-from-right-full duration-300">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-primary">{user.displayName}</h3>
            <p className="text-xs text-muted-foreground">online</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Message Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex items-end gap-2', msg.sender === 'me' ? 'justify-end' : 'justify-start')}
            >
              {msg.sender === 'other' && (
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.sender === 'me'
                    ? 'bg-accent text-accent-foreground rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
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
          />
          <Button type="submit" size="icon" disabled={!inputMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

    
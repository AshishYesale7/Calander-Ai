
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useTimezone } from '@/hooks/use-timezone';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, TimelineEvent } from '@/types';
import { createConversationalEvent } from '@/ai/flows/conversational-event-flow';
import { saveTimelineEvent } from '@/services/timelineService';
import { ArrowLeft, Bot, Send, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface AiAssistantChatProps {
  initialPrompt: string;
  onBack: () => void;
}

export default function AiAssistantChat({ initialPrompt, onBack }: AiAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { timezone } = useTimezone();
  const { toast } = useToast();
  const router = useRouter();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !user) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: messageContent }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await createConversationalEvent({
        chatHistory: newMessages,
        timezone,
        apiKey,
      });

      if (result.response) {
        setMessages(prev => [...prev, { role: 'model', content: result.response! }]);
      }

      if (result.event) {
        const newEvent: TimelineEvent = {
          id: `ai-${Date.now()}`,
          title: result.event.title,
          date: new Date(result.event.date),
          endDate: result.event.endDate ? new Date(result.event.endDate) : undefined,
          notes: result.event.notes,
          isAllDay: result.event.isAllDay,
          type: 'ai_suggestion',
          isDeletable: true,
          status: 'pending',
          priority: 'None',
          location: result.event.location,
          reminder: result.event.reminder,
        };

        const { icon, ...data } = newEvent;
        const payload = { ...data, date: data.date.toISOString(), endDate: data.endDate ? data.endDate.toISOString() : null };
        await saveTimelineEvent(user.uid, payload, { syncToGoogle: false, timezone });
        
        toast({
          title: "Event Created by AI",
          description: `"${result.event.title}" has been added to your timeline.`,
        });
        
        // Use a short delay before navigating back to allow user to see the confirmation.
        setTimeout(() => {
           onBack();
           router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      toast({ title: "AI Error", description: "The AI assistant encountered an error.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, apiKey, timezone, toast, router, onBack]);

  useEffect(() => {
    // Send the initial prompt when the component mounts
    if (initialPrompt && messages.length === 0) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend, messages.length]);


  return (
    <div className="flex flex-col h-[450px]">
       <div className="flex items-center p-2 border-b">
         <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
           <ArrowLeft className="h-5 w-5" />
         </Button>
         <div className="ml-2">
            <h3 className="font-semibold text-base text-primary flex items-center">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Creating event...</p>
         </div>
       </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'model' && (
                 <Avatar className="h-8 w-8 border">
                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-xs md:max-w-md rounded-xl px-4 py-3 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                )}
              >
                {message.content}
              </div>
               {message.role === 'user' && (
                 <Avatar className="h-8 w-8 border">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback><User size={18}/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start">
                 <Avatar className="h-8 w-8 border">
                    <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-xl px-4 py-3 text-sm rounded-bl-none">
                    <LoadingSpinner size="sm" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

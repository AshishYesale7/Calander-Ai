
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { ChatMessage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getMessages } from '@/services/chatService';
import { sendMessage } from '@/actions/chatActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Phone, Video, Info, Smile, Mic, Image as ImageIcon, Heart, PanelLeftOpen, Loader2, Send, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { format, isSameDay } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/context/ChatContext';

interface ChatPanelProps {
  user: PublicUserProfile;
  onClose: () => void;
  onInitiateCall: (receiver: PublicUserProfile) => void;
}

export default function ChatPanel({ user: otherUser, onClose, onInitiateCall }: ChatPanelProps) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { setChattingWith, outgoingCall, ongoingCall } = useChat();
  const isMobile = useIsMobile();

  const isCallingThisUser = outgoingCall?.uid === otherUser.uid;
  const isCallActiveWithThisUser = ongoingCall && [ongoingCall.callerId, ongoingCall.receiverId].includes(otherUser.uid);
  
  // The button should be disabled if there's any outgoing call, or if there's an ongoing call that's NOT with this user.
  const isCallButtonDisabled = (!!outgoingCall) || (!!ongoingCall && !isCallActiveWithThisUser);


  const handleInitiateCall = async () => {
    if (!currentUser || !otherUser) return;
    onInitiateCall(otherUser);
  };

  const handleVideoClick = () => {
    if (isCallActiveWithThisUser) {
        // Future: Add logic to bring PiP back to full screen
        console.log("Call is active, should maximize");
    } else {
        handleInitiateCall();
    }
  };


  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior });
        }, 50);
      }
    }
  };
  
  const groupedMessages = useMemo(() => {
    return messages.reduce((acc, msg) => {
      const dateKey = format(msg.timestamp, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(msg);
      return acc;
    }, {} as Record<string, ChatMessage[]>);
  }, [messages]);


  useEffect(() => {
    if (!currentUser || !otherUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = getMessages(currentUser.uid, otherUser.uid, (newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
      scrollToBottom('auto');
    });

    return () => unsubscribe();
  }, [currentUser, otherUser]);
  
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  const handleSend = async () => {
    if (!currentUser?.uid || !otherUser?.uid || !inputMessage.trim()) {
      return;
    }

    const messageToSend = inputMessage;
    setInputMessage('');
    try {
      await sendMessage(currentUser.uid, otherUser.uid, messageToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputMessage(messageToSend);
    }
  };

  const handleBackToChatList = () => {
    setChattingWith(null);
  };
  
  return (
    <div className="flex flex-col h-full bg-black border-l border-gray-800">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-800 h-14 z-10">
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="icon" onClick={handleBackToChatList} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
           </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
            <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-xs text-white">{otherUser.displayName}</h3>
            <p className="text-xs text-gray-400">@{otherUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white">
            <Button variant="ghost" size="icon" disabled><Phone className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={handleVideoClick} disabled={isCallButtonDisabled}>
              {isCallingThisUser ? <Loader2 className="h-5 w-5 animate-spin"/> : (
                <div className="relative">
                  <Video className="h-5 w-5" />
                  {isCallActiveWithThisUser && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-black" />}
                </div>
              )}
            </Button>
            <Button variant="ghost" size="icon"><Info className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:inline-flex"><X className="h-5 w-5" /></Button>
        </div>
      </header>

      {/* Message Area */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
            <div className="flex flex-col items-center pt-8 pb-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
                    <AvatarFallback className="text-4xl">{otherUser.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold text-white">{otherUser.displayName}</h2>
                <p className="text-sm text-gray-400">@{otherUser.username}</p>
            </div>
            
            {isLoading && (
              <div className="flex justify-center items-center h-full py-10"><LoadingSpinner /></div>
            )}
            
            {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                    <div className="text-center text-xs text-gray-500 my-4">
                        {format(new Date(date), 'MM/dd/yy, h:mm a')}
                    </div>
                    {msgs.map((msg, index) => {
                      const isMe = msg.senderId === currentUser?.uid;
                      const nextMsg = msgs[index + 1];
                      const isLastInBlock = !nextMsg || nextMsg.senderId !== msg.senderId;

                      return (
                        <div
                          key={msg.id}
                          className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}
                        >
                          {!isMe && !isLastInBlock && <div className="w-8 h-8"></div> /* Spacer */}
                          {!isMe && isLastInBlock && (
                            <Avatar className="h-8 w-8 self-end">
                              <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
                              <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              'max-w-[70%] px-4 py-2.5 text-sm',
                              isMe
                                ? 'bg-blue-500 text-white rounded-3xl'
                                : 'bg-[#262626] text-white rounded-3xl',
                              isLastInBlock ? (isMe ? 'rounded-br-lg' : 'rounded-bl-lg') : 'rounded-lg'
                            )}
                          >
                            {msg.text}
                          </div>
                        </div>
                      )
                    })}
                </div>
            ))}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <footer className="flex-shrink-0 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-[#262626] rounded-full px-2"
        >
          <Button variant="ghost" size="icon" type="button" className="text-white hover:bg-transparent hover:text-gray-300"><Smile className="h-6 w-6"/></Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-400 focus-visible:ring-0 h-12"
            autoComplete="off"
          />
           <div className="flex items-center gap-1">
               {(isMobile && inputMessage.trim() === '') || !isMobile ? (
                   <>
                       <Button variant="ghost" size="icon" type="button" className="text-white hover:bg-transparent hover:text-gray-300"><Mic className="h-6 w-6"/></Button>
                       <Button variant="ghost" size="icon" type="button" className="text-white hover:bg-transparent hover:text-gray-300"><ImageIcon className="h-6 w-6"/></Button>
                   </>
               ) : null}
               {isMobile && inputMessage.trim() !== '' ? (
                    <Button variant="ghost" size="icon" type="submit" className="text-accent hover:bg-transparent hover:text-accent/80">
                        <Send className="h-6 w-6"/>
                    </Button>
               ) : null}
            </div>
        </form>
      </footer>
    </div>
  );
}



'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { ChatMessage, CallData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { subscribeToMessages, loadMessagesFromLocal, subscribeToCallHistory } from '@/services/chatService';
import { sendMessage, deleteMessage } from '@/actions/chatActions';
import { listenForTyping, updateTypingStatus } from '@/services/typingService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Phone, Video, Info, Smile, Mic, Image as ImageIcon, Send, ArrowLeft, PhoneMissed, PhoneIncoming, PhoneOutgoing, Copy, Trash2, CheckCircle, Check, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { format, isSameDay } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/context/ChatContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from "@/components/ui/context-menu"
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import CallLogItem from './CallLogItem';
import { motion, AnimatePresence } from 'framer-motion';


interface ChatPanelProps {
  user: PublicUserProfile;
  onClose: () => void;
}

type MergedChatItem = (ChatMessage | CallData);

const MessageItem = ({
  msg,
  isMe,
  isLastInBlock,
  isSelected,
  isInSelectionMode,
  onStartSelection,
  onToggleSelection,
}: {
  msg: ChatMessage;
  isMe: boolean;
  isLastInBlock: boolean;
  isSelected: boolean;
  isInSelectionMode: boolean;
  onStartSelection: (messageId: string) => void;
  onToggleSelection: (messageId: string) => void;
}) => {
  const { toast } = useToast();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text);
      toast({ title: 'Copied to clipboard' });
    }
  };

  const handlePointerDown = () => {
    // Start a timer. If held for 500ms, start selection mode.
    longPressTimer.current = setTimeout(() => {
        onStartSelection(msg.id);
        longPressTimer.current = null; // Clear the timer
    }, 500);
  };
  
  const handlePointerUp = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        // If the timer was cleared before it fired, it's a click.
        if (isInSelectionMode) {
            onToggleSelection(msg.id);
        }
    }
  };

  const handlePointerLeave = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
            className={cn('flex items-center gap-2 group', isMe ? 'justify-end' : 'justify-start')}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
        >
          {isInSelectionMode && (
            <div className="flex items-center justify-center h-full transition-opacity duration-200 opacity-100">
              <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-blue-500 border-blue-400" : "border-gray-500 bg-gray-800/50")}>
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
          )}
          <div
            className={cn(
              'max-w-[70%] px-3 py-2 text-sm flex flex-col mt-1 rounded-2xl transition-colors duration-200',
              isSelected 
                ? 'frosted-glass bg-accent/20 border border-accent/30'
                : (isMe ? 'bg-blue-500 text-white' : 'bg-[#262626] text-white'),
              isLastInBlock && (isMe ? 'rounded-br-lg' : 'rounded-bl-lg')
            )}
          >
            {msg.isDeleted ? (
              <span className="italic text-gray-300">{msg.text}</span>
            ) : (
              <span>{msg.text}</span>
            )}
            <span className={cn('self-end mt-1 text-[10px]', isMe ? 'text-white/70' : 'text-white/70')}>
              {format(msg.timestamp, 'p')}
            </span>
          </div>
        </div>
      </ContextMenuTrigger>
      {!msg.isDeleted && !isInSelectionMode && (
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onStartSelection(msg.id)}>
            <Circle className="mr-2 h-4 w-4" />
            Select
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-red-500" onSelect={(e) => {
              e.preventDefault();
              // This is a placeholder for a more complex delete dialog
              console.log("Delete action triggered");
          }}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
};


export const ChatPanelHeader = ({ user, onClose }: { user: PublicUserProfile, onClose: () => void }) => {
    const { onInitiateCall, outgoingCall, ongoingCall, outgoingAudioCall, ongoingAudioCall } = useChat();

    const isCallingThisUser = outgoingCall?.uid === user.uid || outgoingAudioCall?.uid === user.uid;
    const isCallActiveWithThisUser = (ongoingCall && [ongoingCall.callerId, ongoingCall.receiverId].includes(user.uid)) || (ongoingAudioCall && [ongoingAudioCall.callerId, ongoingAudioCall.receiverId].includes(user.uid));
    const isAnyCallActive = !!ongoingCall || !!ongoingAudioCall;
    const isAnyCallOutgoing = !!outgoingCall || !!outgoingAudioCall;
    const isCallButtonDisabled = isAnyCallOutgoing || (isAnyCallActive && !isCallActiveWithThisUser);

    return (
        <header className={cn("flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-800 h-14 z-10 sticky top-0 bg-black/80 backdrop-blur-lg")}>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-sm text-white">{user.displayName}</h3>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 text-white">
                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(user, 'audio')} disabled={isCallButtonDisabled}>
                    <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(user, 'video')} disabled={isCallButtonDisabled}>
                    <div className="relative">
                        <Video className="h-5 w-5" />
                        {isCallActiveWithThisUser && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-black" />}
                    </div>
                </Button>
                <Button variant="ghost" size="icon"><Info className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:inline-flex"><X className="h-5 w-5" /></Button>
            </div>
        </header>
    );
};

export const ChatPanelBody = ({ user }: { user: PublicUserProfile }) => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [calls, setCalls] = useState<CallData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

    const isInSelectionMode = selectedMessages.size > 0;

    const chatItems = useMemo(() => {
      return [...messages, ...calls].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [messages, calls]);

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
    
    const groupedChatItems = useMemo(() => {
        return chatItems.reduce((acc, item, index) => {
            if (!item || !item.timestamp) return acc;
            const dateKey = format(item.timestamp, 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(item);
            return acc;
        }, {} as Record<string, MergedChatItem[]>);
    }, [chatItems]);

    useEffect(() => {
        if (!currentUser || !user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setMessages(loadMessagesFromLocal(currentUser.uid, user.uid));
        setIsLoading(false);
        scrollToBottom('auto');

        const unsubMessages = subscribeToMessages(currentUser.uid, user.uid, setMessages);
        const unsubCalls = subscribeToCallHistory(currentUser.uid, allCalls => {
            setCalls(allCalls.filter(c => c.callerId === user.uid || c.receiverId === user.uid));
        });
        const unsubTyping = listenForTyping(currentUser.uid, user.uid, setIsOtherUserTyping);

        return () => {
            unsubMessages();
            unsubCalls();
            unsubTyping();
        };
    }, [currentUser, user]);
    
    useEffect(() => {
        scrollToBottom('smooth');
    }, [chatItems]);

    const handleStartSelection = (messageId: string) => {
        setSelectedMessages(new Set([messageId]));
    };

    const handleToggleSelection = (messageId: string) => {
        setSelectedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) newSet.delete(messageId);
            else newSet.add(messageId);
            return newSet;
        });
    };

    return (
        <div className="flex-1 min-h-0 relative">
            <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
                <div className="p-4 space-y-4">
                    <div className="flex flex-col items-center pt-8 pb-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                            <AvatarFallback className="text-4xl">{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="mt-4 text-xl font-bold text-white">{user.displayName}</h2>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full py-10"><LoadingSpinner /></div>
                    ) : Object.entries(groupedChatItems).map(([date, items]) => (
                        <div key={date}>
                            <div className="text-center text-xs text-gray-500 my-4">{format(new Date(date), 'MMMM d, yyyy')}</div>
                            {items.map((item, index) => {
                                if (item.type === 'call') {
                                    return <CallLogItem key={item.id} item={item} currentUser={currentUser} />
                                }
                                const msg = item as ChatMessage;
                                if (!msg.senderId) return null;
                                const isMe = msg.senderId === currentUser?.uid;
                                const nextItem = items[index + 1];
                                const isLastInBlock = !nextItem || nextItem.type === 'call' || (nextItem.type === 'message' && nextItem.senderId !== msg.senderId);

                                return (
                                    <MessageItem
                                        key={msg.id}
                                        msg={msg}
                                        isMe={isMe}
                                        isLastInBlock={isLastInBlock}
                                        isSelected={selectedMessages.has(msg.id)}
                                        isInSelectionMode={isInSelectionMode}
                                        onStartSelection={handleStartSelection}
                                        onToggleSelection={handleToggleSelection}
                                    />
                                );
                            })}
                        </div>
                    ))}
                    {isOtherUserTyping && (
                        <div className="flex items-center gap-2 px-2 pb-1 text-xs text-gray-400 animate-in fade-in duration-300">
                            <Avatar className="h-6 w-6"><AvatarImage src={user.photoURL || undefined} /><AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback></Avatar>
                            <span className="italic">typing...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export const ChatPanelFooter = () => {
    const { user: currentUser } = useAuth();
    const { chattingWith, playSendMessageSound, setIsChatInputFocused } = useChat();
    const [inputMessage, setInputMessage] = useState('');
    const { toast } = useToast();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMobile = useIsMobile();
    
    const handleSend = () => {
        if (!currentUser?.uid || !chattingWith?.uid || !inputMessage.trim()) return;

        const messageToSend = inputMessage;
        setInputMessage('');
        playSendMessageSound();

        sendMessage(currentUser.uid, chattingWith.uid, messageToSend)
            .catch(error => {
                console.error("Failed to send message:", error);
                setInputMessage(messageToSend);
                toast({ title: "Message Failed", description: "Could not send your message. Please try again.", variant: "destructive" });
            });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        updateTypingStatus(currentUser.uid, chattingWith.uid, false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);
        if (!currentUser || !chattingWith) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        updateTypingStatus(currentUser.uid, chattingWith.uid, true);
        
        typingTimeoutRef.current = setTimeout(() => {
            updateTypingStatus(currentUser.uid, chattingWith.uid, false);
        }, 1000);
    };

    return (
        <footer className="flex-shrink-0 p-3 bg-transparent">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 bg-[#262626] rounded-full px-2">
                <Button variant="ghost" size="icon" type="button" className="text-white hover:bg-transparent hover:text-gray-300"><Smile className="h-6 w-6"/></Button>
                <Input value={inputMessage} onChange={handleInputChange} onFocus={() => setIsChatInputFocused(true)} onBlur={() => setIsChatInputFocused(false)} placeholder="Message..." className="flex-1 bg-transparent border-none text-white placeholder:text-gray-400 focus-visible:ring-0 h-12 focus-visible:ring-offset-0" autoComplete="off" />
                <div className="flex items-center gap-1">
                    {(isMobile && inputMessage.trim() === '') || !isMobile ? (
                        <>
                            <Button variant="ghost" size="icon" type="button" className="text-white hover:bg-transparent hover:text-gray-300"><Mic className="h-6 w-6"/></Button>
                            <Button variant="ghost" size="icon" type="button" className="text-white hover:bg-transparent hover:text-gray-300"><ImageIcon className="h-6 w-6"/></Button>
                        </>
                    ) : null}
                    {inputMessage.trim() !== '' ? (
                        <Button variant="ghost" size="icon" type="submit" className="text-accent hover:bg-transparent hover:text-accent/80"><Send className="h-6 w-6"/></Button>
                    ) : null}
                </div>
            </form>
        </footer>
    );
}

export default function ChatPanel({ user: otherUser, onClose }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-black border-l border-gray-800">
      <ChatPanelHeader user={otherUser} onClose={onClose} />
      <ChatPanelBody user={otherUser} />
      <ChatPanelFooter />
    </div>
  );
}



'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  isMobileView?: boolean;
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
                : (isMe ? 'bg-blue-500 text-white' : 'bg-muted text-foreground'),
              isLastInBlock && (isMe ? 'rounded-br-lg' : 'rounded-bl-lg')
            )}
          >
            {msg.isDeleted ? (
              <span className="italic text-muted-foreground">{msg.text}</span>
            ) : (
              <span>{msg.text}</span>
            )}
            <span className={cn('self-end mt-1 text-[10px]', isMe ? 'text-white/70' : 'text-muted-foreground')}>
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

export function ChatPanelHeader({ user: otherUser, onClose }: { user: PublicUserProfile, onClose: () => void }) {
    const { 
      setChattingWith, outgoingCall, ongoingCall, 
      outgoingAudioCall, ongoingAudioCall, onInitiateCall
    } = useChat();
    
    const isCallingThisUser = outgoingCall?.uid === otherUser.uid || outgoingAudioCall?.uid === otherUser.uid;
    const isCallActiveWithThisUser = (ongoingCall && [ongoingCall.callerId, ongoingCall.receiverId].includes(otherUser.uid)) || 
                                     (ongoingAudioCall && [ongoingAudioCall.callerId, ongoingAudioCall.receiverId].includes(otherUser.uid));
    
    const isAnyCallActive = !!ongoingCall || !!ongoingAudioCall;
    const isAnyCallOutgoing = !!outgoingCall || !!outgoingAudioCall;

    const isCallButtonDisabled = isAnyCallOutgoing || (isAnyCallActive && !isCallActiveWithThisUser);

    const handleBackToChatList = () => {
        setChattingWith(null);
    };

    const handleInitiateVideoCall = async () => onInitiateCall(otherUser, 'video');
    const handleInitiateAudioCall = async () => onInitiateCall(otherUser, 'audio');

    return (
        <header className={cn(
            "sticky top-0 z-10 flex-shrink-0 flex items-center justify-between p-3 border-b h-14",
            "bg-background/80 backdrop-blur-lg border-border"
        )}>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleBackToChatList} className="md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
                    <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-sm text-foreground">{otherUser.displayName}</h3>
                    <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleInitiateAudioCall} disabled={isCallButtonDisabled}>
                    <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleInitiateVideoCall} disabled={isCallButtonDisabled}>
                    <div className="relative">
                        <Video className="h-5 w-5" />
                        {isCallActiveWithThisUser && <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />}
                    </div>
                </Button>
                <Button variant="ghost" size="icon"><Info className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:inline-flex"><X className="h-5 w-5" /></Button>
            </div>
        </header>
    );
}

export function ChatPanelBody({ user: otherUser }: { user: PublicUserProfile }) {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [calls, setCalls] = useState<CallData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const isInSelectionMode = selectedMessages.size > 0;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    const canDeleteForEveryone = useMemo(() => {
      if (selectedMessages.size === 0) return false;
      return Array.from(selectedMessages).every(id => {
        const msg = messages.find(m => m.id === id);
        return msg?.senderId === currentUser?.uid;
      });
    }, [selectedMessages, messages, currentUser]);

    const chatItems = useMemo(() => {
      return [...messages, ...calls].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [messages, calls]);

    const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
        if (scrollAreaRef.current) {
          const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            setTimeout(() => {
              viewport.scrollTo({ top: viewport.scrollHeight, behavior });
            }, 50);
          }
        }
    }, []);

    useEffect(() => {
      if (!currentUser || !otherUser) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setMessages(loadMessagesFromLocal(currentUser.uid, otherUser.uid));
      setIsLoading(false);
      scrollToBottom('auto');
  
      const unsubMessages = subscribeToMessages(currentUser.uid, otherUser.uid, setMessages);
      const unsubCalls = subscribeToCallHistory(currentUser.uid, (allCalls) => {
        setCalls(allCalls.filter(c => c.callerId === otherUser.uid || c.receiverId === otherUser.uid));
      });
      const unsubTyping = listenForTyping(currentUser.uid, otherUser.uid, setIsOtherUserTyping);
  
      return () => { unsubMessages(); unsubCalls(); unsubTyping(); };
    }, [currentUser, otherUser]);
  
    useEffect(() => {
      scrollToBottom('smooth');
    }, [chatItems, scrollToBottom]);

    const groupedChatItems = useMemo(() => {
        return chatItems.reduce((acc, item) => {
            if (!item || !item.timestamp) return acc;
            const dateKey = format(item.timestamp, 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(item);
            return acc;
        }, {} as Record<string, MergedChatItem[]>);
    }, [chatItems]);

    const handleStartSelection = (messageId: string) => setSelectedMessages(new Set([messageId]));
    const handleToggleSelection = (messageId: string) => {
        setSelectedMessages(prev => {
            const newSet = new Set(prev);
            newSet.has(messageId) ? newSet.delete(messageId) : newSet.add(messageId);
            return newSet;
        });
    };

    const handleBulkDelete = async (mode: 'me' | 'everyone') => {
        if (!currentUser || !otherUser || selectedMessages.size === 0) return;
        const deletePromises = Array.from(selectedMessages).map(id => deleteMessage(currentUser.uid, otherUser.uid, id, mode));
        try {
            await Promise.all(deletePromises);
            toast({ title: `${selectedMessages.size} message(s) deleted.` });
        } catch (error) {
            toast({ title: "Error", description: "Could not delete all selected messages.", variant: "destructive" });
        } finally {
            setSelectedMessages(new Set());
        }
    };
    
    return (
        <>
        <AnimatePresence initial={false}>
            {isInSelectionMode && (
                <motion.header
                    key="selection-header"
                    initial={{ y: -56, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -56, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={cn(
                        "flex-shrink-0 flex items-center justify-between p-3 h-14 z-10 absolute top-0 left-0 right-0",
                        "bg-accent/10 backdrop-blur-md border-b border-accent/30 text-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedMessages(new Set())}>
                            <X className="h-5 w-5" />
                        </Button>
                        <span className="font-semibold">{selectedMessages.size} selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[90vw] max-w-xs rounded-xl frosted-glass">
                                <AlertDialogHeader className="text-center">
                                    <AlertDialogTitle className="text-lg">Delete Message(s)?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <div className="flex flex-col gap-2 mt-2">
                                    {canDeleteForEveryone && (
                                        <AlertDialogAction onClick={() => { handleBulkDelete('everyone'); setIsDeleteDialogOpen(false); }} className="w-full justify-center bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                                            Delete for Everyone
                                        </AlertDialogAction>
                                    )}
                                    <AlertDialogAction onClick={() => { handleBulkDelete('me'); setIsDeleteDialogOpen(false); }} className="w-full justify-center">
                                        Delete for Me ({selectedMessages.size})
                                    </AlertDialogAction>
                                    <AlertDialogCancel className="w-full mt-2">Cancel</AlertDialogCancel>
                                </div>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </motion.header>
            )}
        </AnimatePresence>
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
                <div className="flex flex-col items-center pt-8 pb-4">
                    <Avatar className="h-24 w-24"><AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} /><AvatarFallback className="text-4xl">{otherUser.displayName.charAt(0)}</AvatarFallback></Avatar>
                    <h2 className="mt-4 text-xl font-bold text-foreground">{otherUser.displayName}</h2>
                    <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
                </div>
                {isLoading && <div className="flex justify-center items-center h-full py-10"><LoadingSpinner /></div>}
                {Object.entries(groupedChatItems).map(([date, items]) => (
                    <div key={date}>
                        <div className="text-center text-xs text-muted-foreground my-4">{format(new Date(date), 'MMMM d, yyyy')}</div>
                        {items.map((item, index) => {
                            if (item.type === 'call') return <CallLogItem key={item.id} item={item} currentUser={currentUser} />;
                            const msg = item as ChatMessage;
                            if (!msg.senderId) return null;
                            const isMe = msg.senderId === currentUser?.uid;
                            const nextItem = items[index + 1];
                            const isLastInBlock = !nextItem || nextItem.type === 'call' || (nextItem.type === 'message' && nextItem.senderId !== msg.senderId);
                            return <MessageItem key={msg.id} msg={msg} isMe={isMe} isLastInBlock={isLastInBlock} isSelected={selectedMessages.has(msg.id)} isInSelectionMode={isInSelectionMode} onStartSelection={handleStartSelection} onToggleSelection={handleToggleSelection} />;
                        })}
                    </div>
                ))}
                {isOtherUserTyping && (
                    <div className="flex items-center gap-2 px-2 pb-1 text-xs text-muted-foreground animate-in fade-in duration-300">
                        <Avatar className="h-6 w-6"><AvatarImage src={otherUser.photoURL || undefined} /><AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback></Avatar>
                        <span className="italic">typing...</span>
                    </div>
                )}
            </div>
        </ScrollArea>
        </>
    );
}

export function ChatPanelFooter() {
    const { user: currentUser } = useAuth();
    const { chattingWith: otherUser, setIsChatInputFocused, playSendMessageSound } = useChat();
    const [inputMessage, setInputMessage] = useState('');
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();
    const isMobileView = useIsMobile();

    const handleSend = () => {
        if (!currentUser?.uid || !otherUser?.uid || !inputMessage.trim()) return;
        const messageToSend = inputMessage;
        setInputMessage('');
        playSendMessageSound();
        sendMessage(currentUser.uid, otherUser.uid, messageToSend).catch(error => {
            console.error("Failed to send message:", error);
            setInputMessage(messageToSend);
            toast({ title: "Message Failed", description: "Could not send your message. Please try again.", variant: "destructive" });
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        updateTypingStatus(currentUser.uid, otherUser.uid, false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);
        if (!currentUser || !otherUser) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        updateTypingStatus(currentUser.uid, otherUser.uid, true);
        typingTimeoutRef.current = setTimeout(() => {
            updateTypingStatus(currentUser.uid, otherUser.uid, false);
        }, 1000);
    };

    return (
        <footer className="flex-shrink-0 p-3 bg-transparent">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 bg-muted rounded-full px-2">
                <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:bg-transparent hover:text-foreground"><Smile className="h-6 w-6"/></Button>
                <Input value={inputMessage} onChange={handleInputChange} onFocus={() => setIsChatInputFocused(true)} onBlur={() => setIsChatInputFocused(false)} placeholder="Message..." className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 h-12 focus-visible:ring-offset-0" autoComplete="off" />
                <div className="flex items-center gap-1">
                    {(isMobileView && inputMessage.trim() === '') || !isMobileView ? (
                        <>
                            <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:bg-transparent hover:text-foreground"><Mic className="h-6 w-6"/></Button>
                            <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:bg-transparent hover:text-foreground"><ImageIcon className="h-6 w-6"/></Button>
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


export function ChatPanel({ user: otherUser, onClose }: ChatPanelProps) {
    return (
        <div className="flex flex-col h-full bg-background border-l border-border">
            <ChatPanelHeader user={otherUser} onClose={onClose} />
            <ChatPanelBody user={otherUser} />
            <ChatPanelFooter />
        </div>
    );
}

    

    
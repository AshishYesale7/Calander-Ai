
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { PublicUserProfile } from '@/services/userService';
import type { ChatMessage, CallData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { subscribeToMessages, loadMessagesFromLocal } from '@/services/chatService';
import { sendMessage, deleteMessage } from '@/actions/chatActions';
import { listenForTyping, updateTypingStatus } from '@/services/typingService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Phone, Video, Info, Smile, Mic, Image as ImageIcon, Heart, PanelLeftOpen, Loader2, Send, ArrowLeft, PhoneMissed, PhoneIncoming, PhoneOutgoing, Copy, Trash2, Users } from 'lucide-react';
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
} from "@/components/ui/context-menu"
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';


interface ChatPanelProps {
  user: PublicUserProfile;
  onClose: () => void;
}

type MergedChatItem = (ChatMessage | CallData);

const CallLogItem = ({ item, currentUser }: { item: CallData, currentUser: any }) => {
    const isMissed = item.status === 'declined' && item.receiverId === currentUser?.uid;
    const isOutgoing = item.callerId === currentUser?.uid;

    let icon = <PhoneOutgoing className="h-4 w-4" />;
    let text = 'Outgoing video call';
    if (item.callType === 'audio') {
        text = 'Outgoing audio call';
    }

    if (isMissed) {
        icon = <PhoneMissed className="h-4 w-4" />;
        text = item.callType === 'audio' ? 'Missed audio call' : 'Missed video call';
    } else if (!isOutgoing) {
        icon = <PhoneIncoming className="h-4 w-4" />;
        text = item.callType === 'audio' ? 'Incoming audio call' : 'Incoming video call';
    }
    
    if (item.status === 'ended' && typeof item.duration === 'number') {
        const mins = Math.floor(item.duration / 60);
        const secs = item.duration % 60;
        const callTypeLabel = item.callType === 'audio' ? 'Audio call' : 'Video call';
        if (mins > 0) {
            text = `${callTypeLabel} - ${mins}m ${secs}s`;
        } else {
            text = `${callTypeLabel} - ${secs}s`;
        }
    }

    return (
        <div className="text-center text-xs text-gray-500 my-4 flex items-center justify-center gap-2">
            {icon}
            <span>{text}</span>
            <span>·</span>
            <span>{format(item.timestamp, 'p')}</span>
        </div>
    );
};


export default function ChatPanel({ user: otherUser, onClose }: ChatPanelProps) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [calls, setCalls] = useState<CallData[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { 
      setChattingWith, outgoingCall, ongoingCall, 
      setIsChatInputFocused, isChatInputFocused, 
      outgoingAudioCall, ongoingAudioCall, onInitiateCall 
  } = useChat();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatItems = useMemo(() => {
    return [...messages, ...calls].sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages, calls]);

  const isCallingThisUser = outgoingCall?.uid === otherUser.uid || outgoingAudioCall?.uid === otherUser.uid;
  const isCallActiveWithThisUser = (ongoingCall && [ongoingCall.callerId, ongoingCall.receiverId].includes(otherUser.uid)) || 
                                   (ongoingAudioCall && [ongoingAudioCall.callerId, ongoingAudioCall.receiverId].includes(otherUser.uid));
  
  const isAnyCallActive = !!ongoingCall || !!ongoingAudioCall;
  const isAnyCallOutgoing = !!outgoingCall || !!outgoingAudioCall;

  const isCallButtonDisabled = isAnyCallOutgoing || (isAnyCallActive && !isCallActiveWithThisUser);


  const handleInitiateVideoCall = async () => {
    if (!currentUser || !otherUser) return;
    onInitiateCall(otherUser, 'video');
  };

  const handleInitiateAudioCall = async () => {
    if (!currentUser || !otherUser) return;
    onInitiateCall(otherUser, 'audio');
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
  
  const groupedChatItems = useMemo(() => {
    return chatItems.reduce((acc, item) => {
      const dateKey = format(item.timestamp, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, MergedChatItem[]>);
  }, [chatItems]);


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
    const unsubTyping = listenForTyping(currentUser.uid, otherUser.uid, setIsOtherUserTyping);

    return () => {
      unsubMessages();
      unsubTyping();
    };
  }, [currentUser, otherUser]);
  
  useEffect(() => {
    scrollToBottom('smooth');
  }, [chatItems]);

  const handleSend = async () => {
    if (!currentUser?.uid || !otherUser?.uid || !inputMessage.trim()) {
      return;
    }

    const messageToSend = inputMessage;
    setInputMessage('');
    try {
      await sendMessage(currentUser.uid, otherUser.uid, messageToSend);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateTypingStatus(currentUser.uid, otherUser.uid, false);
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputMessage(messageToSend);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!currentUser || !otherUser) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updateTypingStatus(currentUser.uid, otherUser.uid, true);
    
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(currentUser.uid, otherUser.uid, false);
    }, 1000); // Stop typing after 1 second of inactivity
  };


  const handleBackToChatList = () => {
    setChattingWith(null);
  };

  const handleDelete = async (mode: 'me' | 'everyone') => {
    if (!messageToDelete || !currentUser || !otherUser) return;
    try {
        await deleteMessage(currentUser.uid, otherUser.uid, messageToDelete.id, mode);
        toast({ title: "Message Deleted" });
    } catch (error) {
        toast({ title: "Error", description: "Could not delete message.", variant: "destructive" });
    } finally {
        setMessageToDelete(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }
  
  const isMobileChatFocus = isMobile && isChatInputFocused;

  return (
    <>
    <div className="flex flex-col h-full bg-black border-l border-gray-800">
      {/* Header */}
      <header className={cn(
        "flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-800 h-14 z-10",
        isMobileChatFocus ? "chat-header-glassy" : "sticky top-0 bg-black"
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
            <h3 className="font-semibold text-sm text-white">{otherUser.displayName}</h3>
            <p className="text-xs text-gray-400">@{otherUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white">
            <Button variant="ghost" size="icon" onClick={handleInitiateAudioCall} disabled={isCallButtonDisabled}>
                {isCallingThisUser && outgoingAudioCall ? <Loader2 className="h-5 w-5 animate-spin"/> : <Phone className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleInitiateVideoCall} disabled={isCallButtonDisabled}>
              {isCallingThisUser && outgoingCall ? <Loader2 className="h-5 w-5 animate-spin"/> : (
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
        <div className="p-4 space-y-4 pb-4">
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
            
            {Object.entries(groupedChatItems).map(([date, items]) => (
                <div key={date}>
                    <div className="text-center text-xs text-gray-500 my-4">
                        {format(new Date(date), 'MMMM d, yyyy')}
                    </div>
                    {items.map((item, index) => {
                      if (item.type === 'call') {
                        return <CallLogItem key={item.id} item={item} currentUser={currentUser} />
                      }
                      
                      const msg = item as ChatMessage;
                      const isMe = msg.senderId === currentUser?.uid;
                      const nextItem = items[index + 1];
                      const isLastInBlock = !nextItem || nextItem.type === 'call' || (nextItem.type === 'message' && nextItem.senderId !== msg.senderId);

                      return (
                        <ContextMenu key={msg.id}>
                            <ContextMenuTrigger asChild>
                                <div
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
                                    'max-w-[70%] px-3 py-2 text-sm flex flex-col mt-1',
                                    isMe
                                        ? 'bg-blue-500 text-white rounded-3xl'
                                        : 'bg-[#262626] text-white rounded-3xl',
                                    isLastInBlock ? (isMe ? 'rounded-br-lg' : 'rounded-bl-lg') : 'rounded-lg'
                                    )}
                                >
                                    {msg.isDeleted ? (
                                        <span className="italic text-gray-400">{msg.text}</span>
                                    ) : (
                                        <span>{msg.text}</span>
                                    )}
                                     <span className={cn("text-white/70 self-end mt-1 text-[10px]", isMe ? 'text-right' : 'text-left')}>{format(msg.timestamp, 'p')}</span>
                                </div>
                                </div>
                            </ContextMenuTrigger>
                            {!msg.isDeleted && (
                                <ContextMenuContent className="w-48">
                                    <ContextMenuItem onClick={() => handleCopy(msg.text)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </ContextMenuItem>
                                    {isMe && (
                                        <>
                                            {/* Edit feature to be added */}
                                            {/* <ContextMenuItem>Edit</ContextMenuItem> */}
                                            <ContextMenuItem className="text-red-500" onSelect={() => setMessageToDelete(msg)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </ContextMenuItem>
                                        </>
                                    )}
                                </ContextMenuContent>
                            )}
                        </ContextMenu>
                      )
                    })}
                </div>
            ))}
        </div>
      </ScrollArea>

      {/* Input Form */}
      <footer className={cn(
        "flex-shrink-0 p-3 bg-black",
        isMobileChatFocus && "fixed bottom-0 left-0 right-0 z-50"
        )}>
        {isOtherUserTyping && (
          <div className="flex items-center gap-2 px-2 pb-1 text-xs text-gray-400 animate-in fade-in duration-300">
            <Avatar className="h-6 w-6">
              <AvatarImage src={otherUser.photoURL || undefined} alt={otherUser.displayName} />
              <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="italic">typing...</span>
          </div>
        )}
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
            onChange={handleInputChange}
            onFocus={() => setIsChatInputFocused(true)}
            onBlur={() => setIsChatInputFocused(false)}
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
    <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent className="w-[90vw] max-w-xs rounded-xl frosted-glass">
            <AlertDialogHeader className="text-center">
                <AlertDialogTitle className="text-lg">Delete Message?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                    You can delete this message for everyone or just for yourself.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2 mt-2">
                 <AlertDialogAction onClick={() => handleDelete('everyone')} className="w-full justify-center bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                    Delete for Everyone
                </AlertDialogAction>
                <AlertDialogAction onClick={() => handleDelete('me')} className="w-full justify-center bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete for me
                </AlertDialogAction>
                <AlertDialogCancel className="w-full mt-2">Cancel</AlertDialogCancel>
            </div>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

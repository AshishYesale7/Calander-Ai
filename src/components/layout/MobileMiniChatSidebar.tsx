
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { subscribeToRecentChats } from '@/services/chatService';
import { Button } from '../ui/button';


type RecentChatUser = PublicUserProfile & {
    lastMessage?: string;
    timestamp?: Date;
    notification?: boolean;
};

// This is a simplified version of ChatSidebar for the mobile view when a chat is open.
// It does NOT have the collapse/expand button.
export default function MobileMiniChatSidebar() {
    const { user } = useAuth();
    const { chattingWith, setChattingWith } = useChat();
    const [recentChats, setRecentChats] = useState<RecentChatUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const unsubscribe = subscribeToRecentChats(user.uid, (chats) => {
            setRecentChats(chats as RecentChatUser[]);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredChats = useMemo(() => {
        if (!searchTerm) return recentChats;
        return recentChats.filter(chat => chat.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [recentChats, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl border-l border-border/30 items-center p-2 gap-2">
            <TooltipProvider delayDuration={0}>
                <div className="space-y-2">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Search className="h-5 w-5"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="p-1 w-48">
                            <Input 
                                placeholder="Search chats..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8"
                            />
                        </PopoverContent>
                     </Popover>
                </div>
            </TooltipProvider>
            <Separator />
            <TooltipProvider delayDuration={0}>
                <ScrollArea className="flex-1 w-full">
                    <div className="space-y-2">
                        {filteredChats.map(chat => (
                            <Tooltip key={chat.id}>
                                <TooltipTrigger asChild>
                                    <button onClick={() => setChattingWith(chat)} className={cn("w-full flex justify-center p-1 rounded-lg", chattingWith?.id === chat.id && "bg-muted")}>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={chat.photoURL || ''} alt={chat.displayName} />
                                            <AvatarFallback>{chat.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{chat.displayName}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </ScrollArea>
            </TooltipProvider>
             <div className="mt-auto p-2">
                <TooltipProvider delayDuration={0}>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 w-full">
                                <UserPlus className="h-5 w-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Add Friend</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};

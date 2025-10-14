
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type RecentChatUser = PublicUserProfile & {
    lastMessage?: string;
    timestamp?: Date;
    notification?: boolean;
};


export function ChatSidebar({ onToggleCollapse }: { onToggleCollapse: () => void; }) {
    const { user } = useAuth();
    const { chattingWith, setChattingWith, setIsChatSidebarOpen } = useChat();
    const [recentChats, setRecentChats] = useState<RecentChatUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const recentChatsRef = collection(db, 'users', user.uid, 'recentChats');
        const q = query(recentChatsRef, orderBy('timestamp', 'desc'), limit(10));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatPartnersPromises = snapshot.docs.map(async (docSnapshot) => {
                const recentChatData = docSnapshot.data();
                const otherUserId = docSnapshot.id;
                const userDocSnap = await getDoc(doc(db, 'users', otherUserId));
                
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    return {
                        id: userDocSnap.id,
                        uid: userDocSnap.id,
                        displayName: userData.displayName || 'Anonymous User',
                        photoURL: userData.photoURL || null,
                        username: userData.username || `user_${otherUserId.substring(0,5)}`,
                        lastMessage: recentChatData.lastMessage,
                        timestamp: recentChatData.timestamp?.toDate(),
                        notification: Math.random() > 0.8, // Mock notification
                    } as RecentChatUser;
                }
                return null;
            });
            const fetchedChats = (await Promise.all(chatPartnersPromises)).filter(c => c !== null) as RecentChatUser[];
            setRecentChats(fetchedChats);
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
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleCollapse}>
                                <PanelRightOpen className="h-5 w-5"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Expand Sidebar</p></TooltipContent>
                    </Tooltip>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Search className="h-5 w-5"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="left" className="p-1 w-48">
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
                                <TooltipContent side="left">
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
                        <TooltipContent side="left"><p>Add Friend</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};


'use client';

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, Search, MessageSquare, PanelRightOpen, X } from "lucide-react";
import { Separator } from "../ui/separator";
import { useAuth } from '@/context/AuthContext';
import { onSnapshot, collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile } from '@/services/userService';
import { useChat } from '@/context/ChatContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';


type FollowedUserWithPresence = PublicUserProfile & {
    status?: 'online' | 'offline' | 'in-game';
    notification?: boolean; 
}

const ChatListContent = () => {
    const { user } = useAuth();
    const { setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen } = useChat();
    const [following, setFollowing] = useState<FollowedUserWithPresence[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const isMobile = useIsMobile();

    const filteredFollowing = useMemo(() => {
        return following.filter(friend => 
            friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [following, searchTerm]);

    useEffect(() => {
        if (!user || !db) return;

        const followingCollectionRef = collection(db, 'users', user.uid, 'following');
        const q = query(followingCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const followedUserPromises = snapshot.docs.map(async (docSnapshot) => {
                const userId = docSnapshot.id;
                const userDocSnap = await getDoc(doc(db, 'users', userId));
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    return {
                        id: userDocSnap.id,
                        uid: userDocSnap.id,
                        displayName: data.displayName || 'Anonymous User',
                        photoURL: data.photoURL || null,
                        username: data.username || `user_${userId.substring(0,5)}`,
                        status: 'online', // This would come from presence system
                        notification: Math.random() > 0.8, // Mock notifications
                    } as FollowedUserWithPresence;
                }
                return null;
            });
            const followedUsers = (await Promise.all(followedUserPromises)).filter(u => u !== null) as FollowedUserWithPresence[];
            setFollowing(followedUsers);
        });

        return () => unsubscribe();
    }, [user]);
    
    const handleUserClick = (friend: FollowedUserWithPresence) => {
        setChattingWith(friend);
        if (isMobile) {
            setIsChatSidebarOpen(false); // Close sheet on selection in mobile
        }
    };

    const renderChatListItem = (friend: FollowedUserWithPresence) => (
         <button 
            key={friend.id}
            className="w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-muted"
            onClick={() => handleUserClick(friend)}
        >
            <Avatar className="h-12 w-12">
                <AvatarImage src={friend.photoURL || ''} alt={friend.displayName} />
                <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm truncate">{friend.displayName}</h3>
                    <p className="text-xs text-muted-foreground">2m</p>
                </div>
                <div className="flex justify-between items-start">
                    <p className="text-xs text-muted-foreground truncate">Sounds good, see you then!</p>
                    {friend.notification && <div className="h-2 w-2 rounded-full bg-accent mt-1"></div>}
                </div>
            </div>
        </button>
    )

    return (
        <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl">
             <div className="p-4 border-b border-border/30">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search or start a new chat" 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {['All', 'Unread', 'Favorites', 'Groups'].map(filter => (
                        <Button key={filter} variant={activeFilter === filter ? 'default' : 'secondary'} size="sm" onClick={() => setActiveFilter(filter)} className="shrink-0">
                            {filter}
                        </Button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredFollowing.map(renderChatListItem)}
                </div>
            </ScrollArea>
        </div>
    );
};


export function ChatSidebar() {
    const { user } = useAuth();
    const { setChattingWith, isChatSidebarOpen, setIsChatSidebarOpen } = useChat();
    const [following, setFollowing] = useState<FollowedUserWithPresence[]>([]);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!user || !db) return;

        const followingCollectionRef = collection(db, 'users', user.uid, 'following');
        const q = query(followingCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const followedUserPromises = snapshot.docs.map(async (docSnapshot) => {
                const userId = docSnapshot.id;
                const userDocSnap = await getDoc(doc(db, 'users', userId));
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    return {
                        id: userDocSnap.id,
                        uid: userDocSnap.id,
                        displayName: data.displayName || 'Anonymous User',
                        photoURL: data.photoURL || null,
                        username: data.username || `user_${userId.substring(0,5)}`,
                        status: 'online', 
                        notification: Math.random() > 0.8,
                    } as FollowedUserWithPresence;
                }
                return null;
            });
            const followedUsers = (await Promise.all(followedUserPromises)).filter(u => u !== null) as FollowedUserWithPresence[];
            setFollowing(followedUsers);
        });

        return () => unsubscribe();
    }, [user]);

    if (isMobile) {
        return (
            <Sheet open={isChatSidebarOpen} onOpenChange={setIsChatSidebarOpen}>
                <SheetContent side="right" className="p-0 border-l-0 w-full max-w-sm">
                    <SheetHeader className="p-4 border-b border-border/30">
                       <SheetTitle className="text-primary font-bold text-xl">Chats</SheetTitle>
                    </SheetHeader>
                    <ChatListContent />
                </SheetContent>
            </Sheet>
        );
    }

    if (isChatSidebarOpen) {
      return (
        <aside className="fixed top-16 right-0 h-[calc(100%-4rem)] w-[25rem] z-30 flex-col border-l border-border/30 hidden md:flex">
          <ChatListContent />
        </aside>
      );
    }
    
    return (
        <aside className="fixed top-16 right-0 h-[calc(100%-4rem)] w-20 bg-background/50 backdrop-blur-md border-l border-border/30 z-30 hidden md:flex flex-col items-center py-4 space-y-4">
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12" onClick={() => setIsChatSidebarOpen(true)}>
                            <PanelRightOpen className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="frosted-glass">
                        <p>Open Chats</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Separator className="w-10/12 my-2 bg-border/50" />

            <div className="flex flex-col items-center space-y-4">
                {following.slice(0, 7).map(friend => (
                   <TooltipProvider key={friend.id} delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => setChattingWith(friend)} className="relative group">
                                    <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-accent transition-colors duration-200">
                                        <AvatarImage src={friend.photoURL || ''} alt={friend.displayName} />
                                        <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {friend.notification && (
                                        <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-background"></div>
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="frosted-glass">
                                <p className="font-semibold">{friend.displayName}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
             <div className="mt-auto">
                 <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12" onClick={() => setIsChatSidebarOpen(true)}>
                                <MessageSquare className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="frosted-glass">
                            <p>All Chats</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </aside>
    )
}

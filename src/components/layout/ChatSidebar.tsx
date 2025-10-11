
'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, Search, MessageSquare, PanelRightOpen, X, PanelLeftOpen, UserPlus, PanelLeftClose } from "lucide-react";
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

interface ChatListContentProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}


const ChatListContent = ({ isCollapsed, onToggleCollapse }: ChatListContentProps) => {
    const { user } = useAuth();
    const { chattingWith, setChattingWith, setIsChatSidebarOpen } = useChat();
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
        } else if (isCollapsed) {
            onToggleCollapse(); // Expand sidebar on desktop if collapsed
        }
    };

    if (isCollapsed) {
        return (
            <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl border-l border-border/30 items-center p-2 gap-2">
                <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-9 w-9">
                    <PanelLeftOpen className="h-5 w-5" />
                </Button>
                <Separator />
                <TooltipProvider delayDuration={0}>
                    <ScrollArea className="flex-1 w-full">
                        <div className="space-y-2">
                            {following.map(friend => (
                                <Tooltip key={friend.id}>
                                    <TooltipTrigger asChild>
                                        <button onClick={() => handleUserClick(friend)} className={cn("w-full flex justify-center p-1 rounded-lg", chattingWith?.id === friend.id && "bg-muted")}>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={friend.photoURL || ''} alt={friend.displayName} />
                                                <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p>{friend.displayName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </ScrollArea>
                </TooltipProvider>
                <Separator />
                <TooltipProvider delayDuration={0}>
                    <div className="space-y-2">
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><UserPlus className="h-5 w-5"/></Button>
                            </TooltipTrigger>
                             <TooltipContent side="left"><p>Add Friend</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><MessageSquare className="h-5 w-5"/></Button>
                            </TooltipTrigger>
                             <TooltipContent side="left"><p>All Chats</p></TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl border-l border-border/30">
             <div className="p-4 border-b border-border/30 flex items-center justify-between">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search or start a new chat" 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Button variant="ghost" size="icon" className="h-9 w-9 ml-2" onClick={() => setIsChatSidebarOpen(false)}>
                    <PanelRightOpen className="h-5 w-5" />
                </Button>
            </div>
            <div className="p-4 border-b border-border/30">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {['All', 'Unread', 'Favorites', 'Groups'].map(filter => (
                        <Button key={filter} variant={activeFilter === filter ? 'default' : 'secondary'} size="sm" onClick={() => setActiveFilter(filter)} className="shrink-0">
                            {filter}
                        </Button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredFollowing.map(friend => (
                        <button 
                            key={friend.id}
                            className={cn("w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-muted", chattingWith?.id === friend.id && "bg-muted")}
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
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


export function ChatSidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean, onToggleCollapse: () => void }) {
    const { isChatSidebarOpen, setIsChatSidebarOpen } = useChat();
    const isMobile = useIsMobile();
    
    if (isMobile) {
        return (
             <Sheet open={isChatSidebarOpen} onOpenChange={setIsChatSidebarOpen}>
                <SheetContent side="right" className="p-0 w-[85vw] max-w-sm">
                   <SheetHeader className="sr-only">
                     <SheetTitle>Chat</SheetTitle>
                   </SheetHeader>
                   <ChatListContent isCollapsed={false} onToggleCollapse={() => {}} />
                </SheetContent>
             </Sheet>
        );
    }
    
    // Desktop view logic remains, but simplified container
    return (
      <div className="h-full w-full">
        <ChatListContent isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse}/>
      </div>
    )
}

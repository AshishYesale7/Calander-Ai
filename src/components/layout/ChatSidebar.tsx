
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightOpen } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type FollowedUserWithPresence = PublicUserProfile & {
    status?: 'online' | 'offline' | 'in-game';
};

export function ChatSidebar({ onToggleCollapse }: { onToggleCollapse: () => void; }) {
    const { user } = useAuth();
    const { chattingWith, setChattingWith, setIsChatSidebarOpen } = useChat();
    const [following, setFollowing] = useState<FollowedUserWithPresence[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const followingCollectionRef = collection(db, 'users', user.uid, 'following');
        const q = query(followingCollectionRef, orderBy('timestamp', 'desc'), limit(10));
        
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
                    } as FollowedUserWithPresence;
                }
                return null;
            });
            const followedUsers = (await Promise.all(followedUserPromises)).filter(u => u !== null) as FollowedUserWithPresence[];
            setFollowing(followedUsers);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredFollowing = useMemo(() => {
        if (!searchTerm) return following;
        return following.filter(friend => friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [following, searchTerm]);
    
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
                        <PopoverContent side="left" className="p-1 w-48">
                            <Input 
                                placeholder="Search friends..."
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
                        {filteredFollowing.map(friend => (
                            <Tooltip key={friend.id}>
                                <TooltipTrigger asChild>
                                    <button onClick={() => setChattingWith(friend)} className={cn("w-full flex justify-center p-1 rounded-lg", chattingWith?.id === friend.id && "bg-muted")}>
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

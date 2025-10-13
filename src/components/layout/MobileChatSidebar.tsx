'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile } from '@/services/userService';
import { cn } from '@/lib/utils';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';

type FollowedUserWithPresence = PublicUserProfile & {
    status?: 'online' | 'offline' | 'in-game';
    notification?: boolean;
};

export default function MobileChatSidebar() {
    const { user } = useAuth();
    const { chattingWith, setChattingWith } = useChat();
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
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredFollowing = useMemo(() => {
        return following.filter(friend =>
            friend.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [following, searchTerm]);

    const handleUserClick = (friend: FollowedUserWithPresence) => {
        setChattingWith(friend);
    };
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full bg-card/60 backdrop-blur-xl border-r border-border/30">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col h-full bg-card/60 backdrop-blur-xl border-r border-border/30")}>
             <div className="p-4 border-b border-border/30">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
             <div className="p-2 mt-auto border-t border-border/30">
                <Button variant="ghost" className="w-full justify-center">
                    <UserPlus className="mr-2 h-4 w-4"/> Add Friend
                </Button>
            </div>
        </div>
    );
};
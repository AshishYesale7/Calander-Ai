
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, MessageSquare } from "lucide-react";
import { Separator } from "../ui/separator";
import { useAuth } from '@/context/AuthContext';
import { onSnapshot, collection, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ChatPanel from '../chat/ChatPanel';
import type { PublicUserProfile } from '@/services/userService';

// Define a more detailed type for a followed user with presence
type FollowedUserWithPresence = {
    id: string;
    displayName: string;
    photoURL?: string | null;
    username: string;
    status?: 'online' | 'offline' | 'in-game';
    notification?: boolean; // You can use this for unread messages later
}

const ChatAvatar = ({ user, onClick }: { user: FollowedUserWithPresence, onClick: () => void }) => {
    const statusColor = {
        online: 'bg-green-500',
        offline: 'bg-gray-500',
        'in-game': 'bg-yellow-500',
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button onClick={onClick} className="relative group">
                        <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-accent transition-colors duration-200">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColor[user.status || 'offline']}`}></div>
                        {user.notification && (
                             <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 border-2 border-background"></div>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="frosted-glass">
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="capitalize text-muted-foreground">{user.status?.replace('-', ' ') || 'Offline'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const GroupIcon = ({ icon: Icon, name }: { icon: React.ElementType, name: string }) => (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="h-10 w-10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-muted-foreground/80" />
                </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="frosted-glass">
                <p>{name}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
)

export function ChatSidebar() {
    const { user } = useAuth();
    const [following, setFollowing] = useState<FollowedUserWithPresence[]>([]);
    const [chattingWith, setChattingWith] = useState<PublicUserProfile | null>(null);

    useEffect(() => {
        if (!user || !db) {
            setFollowing([]);
            return;
        };

        const followingCollectionRef = collection(db, 'users', user.uid, 'following');
        const q = query(followingCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const userDocPromises = snapshot.docs.map(docSnapshot => {
                const targetUserId = docSnapshot.id;
                const userDocRef = collection(db, 'users');
                return getDoc(doc(userDocRef, targetUserId));
            });

            const userDocs = await Promise.all(userDocPromises);
            
            const followedUsers: FollowedUserWithPresence[] = userDocs
                .filter(doc => doc.exists())
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        displayName: data.displayName || 'Anonymous User',
                        photoURL: data.photoURL,
                        username: data.username,
                        status: data.status || 'offline', // Assume a 'status' field exists
                    };
                });
            
            setFollowing(followedUsers);
        }, (error) => {
            console.error("Error fetching real-time following list:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAvatarClick = (userToChat: PublicUserProfile) => {
        if (chattingWith?.uid === userToChat.uid) {
            setChattingWith(null); // Toggle off if clicking the same user
        } else {
            setChattingWith(userToChat);
        }
    };


    return (
        <>
            <aside className="fixed top-0 right-0 h-screen w-20 bg-background/50 backdrop-blur-md border-l border-border/30 z-40 hidden lg:flex flex-col items-center py-4 space-y-4">
                {/* Following Section */}
                <div className="flex flex-col items-center space-y-4">
                    <GroupIcon icon={Users} name="Following" />
                    {following.map(friend => (
                        <ChatAvatar key={friend.id} user={friend} onClick={() => handleAvatarClick(friend as PublicUserProfile)} />
                    ))}
                </div>
                {following.length > 0 && <Separator className="w-10/12 my-4 bg-border/50" />}
            </aside>
            
            {chattingWith && (
                <ChatPanel user={chattingWith} onClose={() => setChattingWith(null)} />
            )}
        </>
    )
}

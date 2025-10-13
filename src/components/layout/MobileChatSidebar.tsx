
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile, CallData } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightClose, Users, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ChatIcon } from '../logo/ChatIcon';

type FollowedUserWithPresence = PublicUserProfile & {
    status?: 'online' | 'offline' | 'in-game';
    notification?: boolean;
};

type CallLogItem = CallData & {
    otherUser: PublicUserProfile;
};


const UpdatesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" />
    </svg>
);


const NavItem = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center gap-1 text-muted-foreground w-20 transition-colors",
            isActive ? "text-accent" : "hover:text-foreground"
        )}
    >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
    </button>
);

const ChatListView = () => {
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

    return (
        <>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search chats..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="flex-1 mt-2">
                <div className="p-2 space-y-1">
                    {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : filteredFollowing.map(friend => (
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
        </>
    );
};

const CallLogView = () => {
    const { user } = useAuth();
    const [callLog, setCallLog] = useState<CallLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const callsCollectionRef = collection(db, 'calls');
        // Simplified query to avoid composite index requirement
        const q = query(
            callsCollectionRef, 
            where('participantIds', 'array-contains', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            // Client-side filtering for status
            const filteredDocs = snapshot.docs.filter(doc => ['ended', 'declined'].includes(doc.data().status));

            const callLogPromises = filteredDocs.map(async (callDoc) => {
                const callData = callDoc.data() as CallData;
                const otherUserId = callData.callerId === user.uid ? callData.receiverId : callData.callerId;
                
                const userDocSnap = await getDoc(doc(db, 'users', otherUserId));
                if (userDocSnap.exists()) {
                    const otherUserData = userDocSnap.data();
                    return {
                        ...callData,
                        id: callDoc.id,
                        otherUser: {
                            uid: otherUserId,
                            displayName: otherUserData.displayName || 'Anonymous',
                            photoURL: otherUserData.photoURL || null,
                            username: otherUserData.username || ''
                        } as PublicUserProfile
                    } as CallLogItem;
                }
                return null;
            });

            const resolvedCalls = (await Promise.all(callLogPromises)).filter(c => c !== null) as CallLogItem[];
            setCallLog(resolvedCalls);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getCallIcon = (call: CallLogItem) => {
        const isMissed = call.status === 'declined' && call.receiverId === user?.uid;
        const isOutgoing = call.callerId === user?.uid;
        
        if (isMissed) return <PhoneMissed className="h-4 w-4 text-red-500" />;
        if (isOutgoing) return <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />;
        return <PhoneIncoming className="h-4 w-4 text-muted-foreground" />;
    };

    return (
        <>
            <h2 className="text-lg font-semibold px-4 pt-2">Calls</h2>
            <ScrollArea className="flex-1 mt-2">
                <div className="p-2 space-y-1">
                    {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : callLog.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-8">No recent calls.</p>
                    ) : callLog.map(call => (
                        <div key={call.id} className="p-2 rounded-lg flex items-center gap-3 hover:bg-muted">
                             <Avatar className="h-12 w-12">
                                <AvatarImage src={call.otherUser.photoURL || ''} alt={call.otherUser.displayName} />
                                <AvatarFallback>{call.otherUser.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{call.otherUser.displayName}</h3>
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {getCallIcon(call)}
                                    <span>{formatDistanceToNow(new Date(call.createdAt.seconds * 1000), { addSuffix: true })}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon"><Phone className="h-5 w-5 text-accent"/></Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </>
    );
};


export default function MobileChatSidebar() {
    const { setIsChatSidebarOpen } = useChat();
    const [activeView, setActiveView] = useState<'chats' | 'updates' | 'communities' | 'calls'>('chats');
    
    return (
        <div className={cn("flex flex-col h-full bg-card/60 backdrop-blur-xl border-r border-border/30")}>
             <div className="p-4 border-b border-border/30">
                 <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold font-headline text-primary">Chats</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatSidebarOpen(false)}>
                        <PanelRightClose className="h-6 w-6 text-black dark:text-white" />
                    </Button>
                </div>
            </div>

            {/* Content based on active view */}
            <div className="flex-1 flex flex-col min-h-0 p-2">
                {activeView === 'chats' && <ChatListView />}
                {activeView === 'calls' && <CallLogView />}
                {(activeView === 'updates' || activeView === 'communities') && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Coming soon!</p>
                    </div>
                )}
            </div>

             <div className="p-2 mt-auto border-t border-border/30">
                <div className="flex justify-around items-center">
                    <NavItem icon={ChatIcon} label="Chats" isActive={activeView === 'chats'} onClick={() => setActiveView('chats')} />
                    <NavItem icon={UpdatesIcon} label="Updates" isActive={activeView === 'updates'} onClick={() => setActiveView('updates')} />
                    <NavItem icon={Users} label="Communities" isActive={activeView === 'communities'} onClick={() => setActiveView('communities')} />
                    <NavItem icon={Phone} label="Calls" isActive={activeView === 'calls'} onClick={() => setActiveView('calls')} />
                </div>
            </div>
        </div>
    );


}

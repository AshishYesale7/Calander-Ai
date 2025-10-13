
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile, CallData } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightClose, Users, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Plus, MessageCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ChatIcon } from '../logo/ChatIcon';
import { motion, AnimatePresence } from 'framer-motion';

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

const NewGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        <path d="M20.49 16.51c.31-.25.51-.62.51-.1.01V13h-2v2.51c0 .4-.2.76-.51 1.01l-4.5 3.51L16 22l4.49-3.49z"/>
        <path d="M3.51 16.51c-.31-.25-.51-.62-.51-.1.01V13h2v2.51c0 .4.2.76.51 1.01l4.5 3.51L8 22l-4.49-3.49z"/>
    </svg>
);

const MetaAiIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="currentColor"/>
        <path d="M12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18Z" fill="currentColor"/>
        <path d="M12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16Z" fill="currentColor"/>
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
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

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
    
    const fabMenuVariants = {
        open: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 24, staggerChildren: 0.05 }
        },
        closed: {
            opacity: 0,
            y: 20,
            transition: { duration: 0.2 }
        }
    };
    
    const fabMenuItemVariants = {
        open: { opacity: 1, y: 0 },
        closed: { opacity: 0, y: 10 }
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
            <div className="relative flex-1 mt-2">
              <ScrollArea className="absolute inset-0">
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
              {/* FAB and Menu */}
              <div className="absolute bottom-4 right-4">
                  <AnimatePresence>
                      {isFabMenuOpen && (
                          <motion.div
                              variants={fabMenuVariants}
                              initial="closed"
                              animate="open"
                              exit="closed"
                              className="mb-4 space-y-2 origin-bottom-right"
                          >
                               <motion.div variants={fabMenuItemVariants} className="flex items-center justify-end gap-2">
                                  <span className="text-sm bg-card p-2 rounded-md shadow-lg">New Chat with Calendar.ai</span>
                                  <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-muted text-muted-foreground hover:bg-muted/80">
                                      <MetaAiIcon className="h-5 w-5"/>
                                  </Button>
                              </motion.div>
                              <motion.div variants={fabMenuItemVariants} className="flex items-center justify-end gap-2">
                                  <span className="text-sm bg-card p-2 rounded-md shadow-lg">New Group</span>
                                   <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-muted text-muted-foreground hover:bg-muted/80">
                                      <NewGroupIcon className="h-5 w-5"/>
                                  </Button>
                              </motion.div>
                              <motion.div variants={fabMenuItemVariants} className="flex items-center justify-end gap-2">
                                  <span className="text-sm bg-card p-2 rounded-md shadow-lg">New Contact</span>
                                   <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-muted text-muted-foreground hover:bg-muted/80">
                                      <UserPlus className="h-5 w-5"/>
                                  </Button>
                              </motion.div>
                          </motion.div>
                      )}
                  </AnimatePresence>
                  <Button
                      onClick={() => setIsFabMenuOpen(prev => !prev)}
                      size="icon"
                      className="rounded-full h-14 w-14 shadow-lg bg-accent hover:bg-accent/90"
                  >
                      <motion.div
                          animate={{ rotate: isFabMenuOpen ? 45 : 0 }}
                          transition={{ duration: 0.2 }}
                      >
                          <Plus className="h-7 w-7" />
                      </motion.div>
                  </Button>
              </div>
            </div>
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
        
        const q = query(
            callsCollectionRef, 
            where('participantIds', 'array-contains', user.uid),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const docs = snapshot.docs.filter(doc => ['ended', 'declined'].includes(doc.data().status));

            const callLogPromises = docs.map(async (callDoc) => {
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

            const resolvedCalls = (await Promise.all(callLogPromises))
                .filter(c => c !== null) as CallLogItem[];
            
            // Sort client-side
            resolvedCalls.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

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

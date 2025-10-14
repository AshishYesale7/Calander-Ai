
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile, CallData } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightClose, Users, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Plus, Video, Trash2, ArrowUpRight, ArrowDownLeft, Archive, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ChatIcon } from '../logo/ChatIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { NewGroupIcon } from '../logo/NewGroupIcon';
import { UpdatesIcon } from '../logo/UpdatesIcon';
import { deleteCalls } from '@/services/callService';
import { Checkbox } from '../ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '../ui/context-menu';
import { deleteConversationForCurrentUser } from '@/actions/chatActions';
import { subscribeToCallHistory, saveCallsToLocal, loadCallsFromLocal } from '@/services/chatService';

const RECENT_CHATS_LOCAL_KEY = 'futureSightRecentChats';

type RecentChatUser = PublicUserProfile & {
    lastMessage?: string;
    timestamp?: Date;
    notification?: boolean;
};

type CallLogItem = CallData & {
    otherUser: PublicUserProfile;
};

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
    const { toast } = useToast();
    const [recentChats, setRecentChats] = useState<RecentChatUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<RecentChatUser | null>(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        // 1. Load from local storage first for instant UI
        const storedChats = localStorage.getItem(RECENT_CHATS_LOCAL_KEY);
        if (storedChats) {
            try {
                const parsedChats = JSON.parse(storedChats).map((c: any) => ({
                    ...c,
                    timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
                }));
                setRecentChats(parsedChats);
            } catch (e) {
                console.error("Failed to parse recent chats from localStorage", e);
            }
        }
        setIsLoading(false); // Stop initial loading

        // 2. Set up Firestore listener for real-time updates
        const recentChatsRef = collection(db, 'users', user.uid, 'recentChats');
        const q = query(recentChatsRef, orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatPartnersPromises = snapshot.docs.map(async (docSnapshot) => {
                const recentChatData = docSnapshot.data();
                const otherUserId = docSnapshot.id;
                const userDocSnap = await getDoc(doc(db, 'users', otherUserId));
                
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    return {
                        id: userDocSnap.id, uid: userDocSnap.id,
                        displayName: userData.displayName || 'Anonymous User',
                        photoURL: userData.photoURL || null,
                        username: userData.username || `user_${otherUserId.substring(0,5)}`,
                        lastMessage: recentChatData.lastMessage,
                        timestamp: recentChatData.timestamp?.toDate(),
                    } as RecentChatUser;
                }
                return null;
            });
            const fetchedChats = (await Promise.all(chatPartnersPromises)).filter(c => c !== null) as RecentChatUser[];
            setRecentChats(fetchedChats);
            localStorage.setItem(RECENT_CHATS_LOCAL_KEY, JSON.stringify(fetchedChats)); // Update local storage
        });

        return () => unsubscribe();
    }, [user]);

    const filteredChats = useMemo(() => {
        return recentChats.filter(chat =>
            chat.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [recentChats, searchTerm]);

    const handleUserClick = (chatPartner: RecentChatUser) => {
        setChattingWith(chatPartner);
    };

    const handleDeleteChat = async () => {
        if (!chatToDelete || !user) return;

        // 1. Optimistic UI update
        const originalChats = [...recentChats];
        const newChats = recentChats.filter(c => c.uid !== chatToDelete.uid);
        setRecentChats(newChats);
        localStorage.setItem(RECENT_CHATS_LOCAL_KEY, JSON.stringify(newChats)); // Update local storage immediately

        if (chattingWith?.uid === chatToDelete.uid) {
            setChattingWith(null);
        }
        
        toast({
            title: "Chat Deleted",
            description: `Your chat history with ${chatToDelete.displayName} has been cleared.`
        });
        setChatToDelete(null);

        // 2. Background Firestore deletion
        try {
            await deleteConversationForCurrentUser(user.uid, chatToDelete.uid);
        } catch (err) {
            // Revert on failure
            setRecentChats(originalChats);
            localStorage.setItem(RECENT_CHATS_LOCAL_KEY, JSON.stringify(originalChats));
            toast({ title: "Error", description: "Failed to delete chat history from the cloud.", variant: "destructive"});
        }
    };

    const fabMenuVariants = {
        open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24, staggerChildren: 0.05 } },
        closed: { opacity: 0, y: 20, transition: { duration: 0.2 } }
    };
    
    const fabMenuItemVariants = {
        open: { opacity: 1, y: 0 },
        closed: { opacity: 0, y: 10 }
    };

    return (
        <>
            <div className="relative flex-shrink-0 p-4 border-b border-border/30">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search or start a new chat"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="relative flex-1 mt-2 min-h-0">
              <ScrollArea className="absolute inset-0">
                  <div className="p-2 space-y-1">
                      {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : filteredChats.map(chat => (
                        <ContextMenu key={chat.id}>
                            <ContextMenuTrigger>
                                <button
                                    className={cn("w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-muted", chattingWith?.id === chat.id && "bg-muted")}
                                    onClick={() => handleUserClick(chat)}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={chat.photoURL || ''} alt={chat.displayName} />
                                        <AvatarFallback>{chat.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-sm truncate">{chat.displayName}</h3>
                                            {chat.timestamp && <p className="text-xs text-muted-foreground">{formatDistanceToNow(chat.timestamp, { addSuffix: true })}</p>}
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                                            {chat.notification && <div className="h-2 w-2 rounded-full bg-accent mt-1"></div>}
                                        </div>
                                    </div>
                                </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem>
                                    <Archive className="mr-2 h-4 w-4" /> Archive Chat
                                </ContextMenuItem>
                                <ContextMenuItem>
                                    <EyeOff className="mr-2 h-4 w-4" /> Hide Contact
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem className="text-red-500" onSelect={() => setChatToDelete(chat)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
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
                                      <CalendarAiLogo className="h-5 w-5"/>
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
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
                <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat with {chatToDelete?.displayName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your copy of the message history. The other person will still be able to see the conversation. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteChat}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

const CallLogView = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { onInitiateCall } = useChat();
    const [callLog, setCallLog] = useState<CallLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        // Immediately load from local storage
        const localCalls = loadCallsFromLocal(user.uid);
        setCallLog(localCalls as any);
        setIsLoading(false);

        // Subscribe to real-time updates
        const unsub = subscribeToCallHistory(user.uid, (calls) => {
            setCallLog(calls as any); // The service now provides CallLogItem
        });

        return () => unsub();
    }, [user]);

    const getCallIcon = (call: CallLogItem) => {
        if (!user) return null;
        
        const isOutgoing = call.callerId === user.uid;
        const isDeclined = call.status === 'declined';
        
        const isMissed = isDeclined && !isOutgoing;
        const isRejected = isDeclined && isOutgoing;

        const BaseIcon = call.callType === 'video' ? Video : Phone;
        const baseClass = "h-4 w-4";

        if (isMissed) return <PhoneMissed className={cn(baseClass, "text-red-500")} />;
        if (isRejected) return <X className={cn(baseClass, "text-red-500")} />;
        if (isOutgoing) return <ArrowUpRight className={cn(baseClass, "text-muted-foreground")} />;
        return <ArrowDownLeft className={cn(baseClass, "text-muted-foreground")} />;
    };

    const isAllSelected = useMemo(() => callLog.length > 0 && selectedIds.size === callLog.length, [selectedIds, callLog]);

    const handleToggleAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedIds(new Set(callLog.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleBulkDelete = async () => {
        if (!user || selectedIds.size === 0) return;
        const idsToDelete = Array.from(selectedIds);
        const originalLog = [...callLog];
        
        // Optimistic UI update
        const newLog = callLog.filter(c => !idsToDelete.includes(c.id));
        setCallLog(newLog);
        saveCallsToLocal(user.uid, newLog);
        setSelectedIds(new Set());

        try {
            await deleteCalls(user.uid, idsToDelete);
            toast({ title: "Deleted", description: `${idsToDelete.length} call(s) removed from history.` });
        } catch (error) {
            setCallLog(originalLog);
            saveCallsToLocal(user.uid, originalLog);
            toast({ title: "Error", description: "Failed to delete call logs.", variant: "destructive" });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center px-4 pt-4">
                <h2 className="text-lg font-semibold">Calls</h2>
                {selectedIds.size > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="h-7 animate-in fade-in duration-300">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete ({selectedIds.size})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="frosted-glass">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Call Logs?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the selected {selectedIds.size} call(s) from your history. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleBulkDelete}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex items-center px-2 py-2 border-b border-border/30">
                <Checkbox
                    id="select-all-calls"
                    checked={isAllSelected}
                    onCheckedChange={handleToggleAll}
                    className="mr-3 ml-2"
                />
                <label htmlFor="select-all-calls" className="text-sm font-medium">Select All</label>
            </div>
            <ScrollArea className="flex-1 mt-2">
                <div className="p-2 space-y-1">
                    {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : callLog.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-8">No recent calls.</p>
                    ) : callLog.map(call => (
                        <div key={call.id} className="p-2 rounded-lg flex items-center gap-3 hover:bg-muted">
                             <Checkbox 
                                id={`call-${call.id}`}
                                checked={selectedIds.has(call.id)}
                                onCheckedChange={() => handleToggleSelection(call.id)}
                            />
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
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser, 'audio')}><Phone className="h-5 w-5 text-accent hover:text-black"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser, 'video')}><Video className="h-5 w-5 text-accent hover:text-black"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </>
    );
};


export default function DesktopChatSidebar() {
    const { setIsChatSidebarOpen } = useChat();
    const [activeView, setActiveView] = useState<'chats' | 'updates' | 'communities' | 'calls'>('chats');
    
    return (
        <div className={cn("flex flex-col h-full bg-black/80 backdrop-blur-lg border-l border-border/30")}>
             <div className="p-4 border-b border-border/30">
                 <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold font-headline text-primary">Chats</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatSidebarOpen(false)}>
                        <PanelRightClose className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
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

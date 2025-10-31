
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile, CallData } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightClose, Users, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, MessageSquare, Plus, Video, Trash2, ArrowUpRight, ArrowDownLeft, Archive, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useTimezone } from '@/hooks/use-timezone';
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
import { subscribeToCallHistory, loadCallsFromLocal, subscribeToRecentChats } from '@/services/chatService';
import { getContactsOnApp as getGoogleContactsOnApp } from '@/services/googleContactsService';
import { getMicrosoftContactsOnApp } from '@/services/microsoftContactsService';

type RecentChatUser = PublicUserProfile & {
    lastMessage?: string;
    timestamp?: Date;
    notification?: boolean;
};

type CallLogItem = CallData & {
    otherUser: PublicUserProfile;
};

const ContactListView = () => {
    const { user } = useAuth();
    const { setChattingWith } = useChat();
    const [contacts, setContacts] = useState<PublicUserProfile[]>([]);
    const [isLoading, setIsLoading] = useState<'google' | 'microsoft' | false>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchContacts = async (provider: 'google' | 'microsoft') => {
        if (!user) return;
        setIsLoading(provider);
        setError(null);
        try {
            const appContacts = provider === 'google'
                ? await getGoogleContactsOnApp(user.uid)
                : await getMicrosoftContactsOnApp(user.uid);
            
            setContacts(prev => {
                const existingUids = new Set(prev.map(c => c.uid));
                const newContacts = appContacts.filter(c => !existingUids.has(c.uid));
                return [...prev, ...newContacts];
            });
            if (appContacts.length === 0) {
                 setError(`No new contacts from ${provider} found on Calendar.ai.`);
            }
        } catch (error: any) {
            setError(error.message || `Failed to fetch ${provider} contacts.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <div className="p-4 border-b border-border/30 flex-shrink-0">
                <h2 className="text-lg font-semibold">Find Contacts</h2>
                <p className="text-xs text-muted-foreground mt-1">Discover which of your contacts are already on Calendar.ai.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleFetchContacts('google')} disabled={!!isLoading}>
                        {isLoading === 'google' && <LoadingSpinner size="sm" className="mr-2"/>}
                        Find on Google
                    </Button>
                    <Button variant="outline" onClick={() => handleFetchContacts('microsoft')} disabled={!!isLoading}>
                        {isLoading === 'microsoft' && <LoadingSpinner size="sm" className="mr-2"/>}
                        Find on Microsoft
                    </Button>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {error && <p className="text-xs text-destructive text-center p-2">{error}</p>}
                    {contacts.length > 0 ? (
                        contacts.map(contact => (
                            <button key={contact.uid} onClick={() => setChattingWith(contact)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={contact.photoURL || undefined} alt={contact.displayName}/>
                                    <AvatarFallback>{contact.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-sm font-medium truncate">{contact.displayName}</p>
                                    <p className="text-xs text-muted-foreground">@{contact.username}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        !isLoading && !error && <p className="text-xs text-muted-foreground text-center p-8">Click a provider above to find your contacts.</p>
                    )}
                    {isLoading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
                </div>
            </ScrollArea>
        </>
    );
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
    const { timezone } = useTimezone();
    const [recentChats, setRecentChats] = useState<RecentChatUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<RecentChatUser | null>(null);

    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);

        const unsubscribe = subscribeToRecentChats(user.uid, (chats) => {
            setRecentChats(chats);
            setIsLoading(false);
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

        const chatPartnerId = chatToDelete.uid;
        const chatPartnerName = chatToDelete.displayName;
        setChatToDelete(null);

        try {
            await deleteConversationForCurrentUser(user.uid, chatPartnerId);
            
            const messageCacheKey = `chatMessages_${user.uid}_${chatPartnerId}`;
            localStorage.removeItem(messageCacheKey);

            if (chattingWith?.uid === chatPartnerId) {
                setChattingWith(null);
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to clear chat history.", variant: "destructive"});
        }
    };

    const formatTimestamp = (timestamp?: Date) => {
        if (!timestamp) return '';
        const zonedTimestamp = toZonedTime(timestamp, timezone);
        if (isToday(zonedTimestamp)) {
            return format(zonedTimestamp, 'p');
        }
        if (isYesterday(zonedTimestamp)) {
            return 'Yesterday';
        }
        return format(zonedTimestamp, 'dd-MM-yy');
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
            <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search chats..."
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
                                        <AvatarImage src={chat.photoURL || undefined} alt={chat.displayName} />
                                        <AvatarFallback>{chat.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-sm truncate">{chat.displayName}</h3>
                                            {chat.timestamp && <p className="text-xs text-muted-foreground">{formatTimestamp(chat.timestamp)}</p>}
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
                        <AlertDialogTitle>Clear Chat History with {chatToDelete?.displayName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your copy of the message and call history. The other person will still see the conversation. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteChat}>Clear History</AlertDialogAction>
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
    const [callLog, setCallLog] = useState<CallData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


    useEffect(() => {
        if (!user || !db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const localCalls = loadCallsFromLocal(user.uid);
        setCallLog(localCalls);
        setIsLoading(false);

        const unsub = subscribeToCallHistory(user.uid, (calls) => {
            setCallLog(calls);
        });

        return () => unsub();
    }, [user]);

    const getCallIcon = (call: CallData) => {
        if (!user) return null;
        
        const isOutgoing = call.callerId === user.uid;
        const isDeclined = call.status === 'declined';
        
        const isMissed = isDeclined && !isOutgoing;
        const isRejected = isDeclined && isOutgoing;

        if (isMissed) return <PhoneMissed className="h-4 w-4 text-red-500" />;
        if (isRejected) return <X className="h-4 w-4 text-red-500" />;
        if (isOutgoing) return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
        return <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />;
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
        
        // No optimistic update here to prevent freezes. Let the listener handle it.
        try {
            await deleteCalls(user.uid, idsToDelete);
            setSelectedIds(new Set());
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete call logs.", variant: "destructive" });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center px-4 pt-2">
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
                    id="select-all-calls-mobile"
                    checked={isAllSelected}
                    onCheckedChange={handleToggleAll}
                    className="mr-3 ml-2"
                />
                <label htmlFor="select-all-calls-mobile" className="text-sm font-medium">Select All</label>
            </div>
            <ScrollArea className="flex-1 mt-2">
                <div className="p-2 space-y-1">
                    {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner/></div> : callLog.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground p-8">No recent calls.</p>
                    ) : callLog.map(call => (
                        <div key={call.id} className="p-2 rounded-lg flex items-center gap-3 hover:bg-muted">
                            <Checkbox 
                                id={`call-mobile-${call.id}`}
                                checked={selectedIds.has(call.id)}
                                onCheckedChange={() => handleToggleSelection(call.id)}
                            />
                             <Avatar className="h-12 w-12">
                                <AvatarImage src={call.otherUser?.photoURL || ''} alt={call.otherUser?.displayName} />
                                <AvatarFallback>{call.otherUser?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{call.otherUser?.displayName}</h3>
                                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {getCallIcon(call)}
                                    <span>{format(call.createdAt, 'p')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser as PublicUserProfile, 'audio')}><Phone className="h-5 w-5 text-accent hover:text-black"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser as PublicUserProfile, 'video')}><Video className="h-5 w-5 text-accent hover:text-black"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </>
    );
};


export default function MobileChatSidebar() {
    const { setIsChatSidebarOpen } = useChat();
    const [activeView, setActiveView] = useState<'chats' | 'updates' | 'contacts' | 'calls'>('chats');
    
    return (
        <div className={cn("flex flex-col h-full bg-card/60 backdrop-blur-xl border-r border-border/30")}>
             <div className="p-4 border-b border-border/30">
                 <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold font-headline text-primary">
                      {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                    </h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatSidebarOpen(false)}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Content based on active view */}
            <div className="flex-1 flex flex-col min-h-0 p-2">
                {activeView === 'chats' && <ChatListView />}
                {activeView === 'calls' && <CallLogView />}
                {activeView === 'contacts' && <ContactListView />}
                {activeView === 'updates' && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Coming soon!</p>
                    </div>
                )}
            </div>

             <div className="p-2 mt-auto border-t border-border/30">
                <div className="flex justify-around items-center">
                    <NavItem icon={ChatIcon} label="Chats" isActive={activeView === 'chats'} onClick={() => setActiveView('chats')} />
                    <NavItem icon={UpdatesIcon} label="Updates" isActive={activeView === 'updates'} onClick={() => setActiveView('updates')} />
                    <NavItem icon={Users} label="Contacts" isActive={activeView === 'contacts'} onClick={() => setActiveView('contacts')} />
                    <NavItem icon={Phone} label="Calls" isActive={activeView === 'calls'} onClick={() => setActiveView('calls')} />
                </div>
            </div>
        </div>
    );
}

    

    




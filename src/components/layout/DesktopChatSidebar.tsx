
'use client';

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { onSnapshot, collection, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicUserProfile, CallData } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, X, PanelRightClose, Users, Phone, ArrowUpRight, ArrowDownLeft, Archive, EyeOff, Video, Trash2, Plus, PhoneMissed, Copy } from 'lucide-react';
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
import { useTheme } from '@/hooks/use-theme';
import { getContactsOnApp as getGoogleContactsOnApp } from '@/services/googleContactsService';
import { getContactsOnApp as getMicrosoftContactsOnApp } from '@/services/microsoftContactsService';
import Link from 'next/link';

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
    const { toast } = useToast();
    const [appUsers, setAppUsers] = useState<PublicUserProfile[]>([]);
    const [externalContacts, setExternalContacts] = useState<{ displayName: string }[]>([]);
    const [isLoading, setIsLoading] = useState<'google' | 'microsoft' | false>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchContacts = async (provider: 'google' | 'microsoft') => {
        if (!user) return;
        setIsLoading(provider);
        setError(null);
        try {
            const { appUsers: fetchedAppUsers, externalContacts: fetchedExternalContacts } = provider === 'google'
                ? await getGoogleContactsOnApp(user.uid)
                : await getMicrosoftContactsOnApp(user.uid);
            
            setAppUsers(prev => {
                const existingUids = new Set(prev.map(c => c.uid));
                const newContacts = fetchedAppUsers.filter(c => !existingUids.has(c.uid));
                return [...prev, ...newContacts];
            });

            setExternalContacts(prev => {
                const existingNames = new Set(prev.map(c => c.displayName));
                const newContacts = fetchedExternalContacts.filter(c => !existingNames.has(c.displayName));
                return [...prev, ...newContacts];
            });

            if (fetchedAppUsers.length === 0 && fetchedExternalContacts.length === 0) {
                 setError(`No new contacts from ${provider} found.`);
            }
        } catch (error: any) {
            if (error.message.includes('permission') || error.message.includes('accessNotConfigured') || (error.code && error.code === 403)) {
              const state = Buffer.from(JSON.stringify({ userId: user.uid, provider })).toString('base64');
              const authUrl = `/api/auth/${provider}/redirect?state=${encodeURIComponent(state)}`;
              window.open(authUrl, '_blank', 'width=500,height=600');
              setError(`Please grant contact permissions for ${provider} in the pop-up window and try again.`);
            } else {
              setError(error.message || `Failed to fetch ${provider} contacts.`);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInvite = () => {
      const url = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "The invite link has been copied to your clipboard.",
      });
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
                <div className="p-2 space-y-4">
                    {error && <p className="text-xs text-destructive text-center p-2">{error}</p>}
                    
                    {appUsers.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">On Calendar.ai</h3>
                            {appUsers.map(contact => (
                                <Link href="#" key={contact.uid} onClick={() => setChattingWith(contact)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={contact.photoURL || undefined} alt={contact.displayName}/>
                                        <AvatarFallback>{contact.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="text-sm font-medium truncate">{contact.displayName}</p>
                                        <p className="text-xs text-muted-foreground">@{contact.username}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    
                    {externalContacts.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Invite to Calendar.ai</h3>
                            {externalContacts.map((contact, index) => (
                                <div key={index} className="w-full flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{contact.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-medium truncate">{contact.displayName}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={handleInvite}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Invite
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && appUsers.length === 0 && externalContacts.length === 0 && !error && (
                         <p className="text-xs text-muted-foreground text-center p-8">Click a provider above to find your contacts.</p>
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
        setChatToDelete(null); // Close dialog

        try {
            await deleteConversationForCurrentUser(user.uid, chatPartnerId);
            
            const messageCacheKey = `chatMessages_${user.uid}_${chatPartnerId}`;
            localStorage.removeItem(messageCacheKey);

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
        
        try {
            await deleteCalls(user.uid, idsToDelete);
            setSelectedIds(new Set());
        } catch (error) {
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
                                <AvatarImage src={call.otherUser?.photoURL || undefined} alt={call.otherUser?.displayName} />
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
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser as PublicUserProfile, 'audio')}><Phone className="h-5 w-5 text-accent hover:text-white dark:hover:text-black"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onInitiateCall(call.otherUser as PublicUserProfile, 'video')}><Video className="h-5 w-5 text-accent hover:text-white dark:hover:text-black"/></Button>
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
    const { theme } = useTheme();
    const [activeView, setActiveView] = useState<'chats' | 'updates' | 'contacts' | 'calls'>('chats');
    
    return (
        <div className={cn("flex flex-col h-full border-l",
            theme === 'dark' ? 'bg-black/80 backdrop-blur-lg border-border/30' : 'bg-background border-border'
        )}>
             <div className="p-4 border-b border-border/30">
                 <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold font-headline text-primary">
                        {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                    </h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsChatSidebarOpen(false)}>
                        <PanelRightClose className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
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

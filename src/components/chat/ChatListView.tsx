
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { db } from '@/lib/firebase';
import type { PublicUserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Search, UserPlus, Plus, Archive, EyeOff, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useTimezone } from '@/hooks/use-timezone';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { NewGroupIcon } from '../logo/NewGroupIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '../ui/context-menu';
import { deleteConversationForCurrentUser } from '@/actions/chatActions';
import { subscribeToRecentChats } from '@/services/chatService';

type RecentChatUser = PublicUserProfile & {
    lastMessage?: string;
    timestamp?: Date;
    notification?: boolean;
};

export default function ChatListView() {
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
            setRecentChats(chats as RecentChatUser[]);
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


'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import { X, Users, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { ChatIcon } from '../logo/ChatIcon';
import { UpdatesIcon } from '../logo/UpdatesIcon';
import ChatListView from '../chat/ChatListView';
import CallLogView from '../chat/CallLogView';
import ContactListView from '../chat/ContactListView';

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

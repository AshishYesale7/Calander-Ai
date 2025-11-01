
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bot,
  ChevronDown,
  Settings,
  MessageSquare,
  Zap,
  Folder,
  Search as SearchIcon,
  X,
  Minus,
  Expand,
  Shrink,
  Plus,
  FileText,
} from 'lucide-react';
import { PixelMonsterLogo } from '../logo/PixelMonsterLogo';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { ChatSession } from './DesktopCommandBar';
import { conversationalAgent } from '@/ai/flows/conversational-agent-flow';
import FileSystemBody from './tabs/FileSystemBody';
import AutomationTab from './tabs/AutomationTab';
import SummarizerTab from './tabs/SummarizerTab'; 

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

const LeftSidebar = ({
    chatSessions,
    activeChatId,
    onSelectChat,
    onNewChat,
    activeView,
    setActiveView,
}: {
    chatSessions: ChatSession[],
    activeChatId: string,
    onSelectChat: (id: string) => void,
    onNewChat: () => void,
    activeView: 'chat' | 'files' | 'automation' | 'search' | 'summarizer',
    setActiveView: (view: 'chat' | 'files' | 'automation' | 'search' | 'summarizer') => void,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const icons = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'summarizer', icon: FileText, label: 'Summarizer' },
    { id: 'files', icon: Folder, label: 'Files' },
    { id: 'automation', icon: Zap, label: 'Automation' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
  ];
  return (
    <div
        className={cn(
            "bg-black/20 flex flex-col py-2 gap-2 border-r border-white/10 transition-[width] duration-300",
            isExpanded ? "w-48 items-stretch" : "w-12 items-center"
        )}
        onPointerDown={(e) => e.stopPropagation()}
    >
        <div className="flex-shrink-0 flex items-center justify-between px-2 h-8">
            {isExpanded && (
                <Button variant="outline" className="h-7 text-xs w-full bg-gray-700/50 border-white/10" onClick={onNewChat}>
                    <Plus className="mr-1 h-3 w-3" /> New Chat
                </Button>
            )}
             <Button
                variant="ghost"
                onClick={() => setIsExpanded(prev => !prev)}
                className={cn(
                    "h-8 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white flex",
                    isExpanded ? "w-8 justify-center" : "w-8 justify-center",
                )}
              >
                {isExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </Button>
        </div>

        <div className="flex-1 space-y-2 mt-2">
            {icons.map((item) => (
                <Button
                key={item.id}
                variant="ghost"
                onClick={() => setActiveView(item.id as any)}
                className={cn(
                    "h-8 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white flex",
                    isExpanded ? "w-auto mx-2 justify-start gap-2 px-2" : "w-8 justify-center",
                    activeView === item.id && 'bg-yellow-400/80 text-black'
                )}
                aria-label={item.label}
                >
                <item.icon className="h-4 w-4 shrink-0" />
                {isExpanded && <span className="text-sm truncate">{item.label}</span>}
                </Button>
            ))}

            {isExpanded && activeView === 'chat' && (
                <div className="px-2 pt-2 border-t border-white/10 mt-2">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 px-2">History</h4>
                    <div className="max-h-48 overflow-y-auto">
                        {chatSessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => onSelectChat(session.id)}
                                className={cn(
                                    "w-full text-left text-sm p-2 rounded-md truncate",
                                    session.id === activeChatId ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
                                )}
                            >
                                {session.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

const ChatHeader = ({
    dragControls,
    selectedModel,
    setSelectedModel,
}: {
    dragControls: any,
    selectedModel: string,
    setSelectedModel: (model: string) => void,
}) => {
    const aiModels = ['Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 2.0 Nano'];
    return (
        <div
          className="flex-shrink-0 h-10 border-b border-white/10 flex items-center justify-between px-1.5 pr-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5 p-2">
                    <button onClick={dragControls.onBack} aria-label="Close" className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-black/60 hover:text-black">
                        <X size={10} strokeWidth={4} />
                    </button>
                    <button className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-black/60 hover:text-black">
                        <Minus size={10} strokeWidth={4} />
                    </button>
                    <button onClick={dragControls.handleToggleFullScreen} aria-label={dragControls.isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-black/60 hover:text-black">
                         {dragControls.isFullScreen ? <Shrink size={8} strokeWidth={3} /> : <Expand size={8} strokeWidth={3} />}
                    </button>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="frosted-glass bg-gray-700/50 border-white/10 h-7 text-xs">
                            {selectedModel} <ChevronDown className="ml-1.5 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="frosted-glass">
                        <DropdownMenuLabel>AI Model</DropdownMenuLabel>
                        {aiModels.map(model => (
                            <DropdownMenuItem key={model} onSelect={() => setSelectedModel(model)}>
                                {model}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400"><Settings size={16}/></Button>
            </div>
        </div>
    )
};

const ChatBody = ({ chatHistory, isLoading }: { chatHistory: ChatMessage[], isLoading: boolean }) => {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('Hello!');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.displayName) {
            setGreeting(`Hello, ${user.displayName}`);
        } else {
            setGreeting('Hello!');
        }
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
              viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [chatHistory, isLoading]);

    if (chatHistory.length === 0 && !isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <PixelMonsterLogo className="h-10 w-10 md:h-12 md:w-12" />
                <div className="font-mono text-xl md:text-3xl mt-3 text-green-400/50 tracking-widest relative">
                    <span className="absolute inset-0 opacity-30 filter blur-sm">{greeting}</span>
                    {greeting}
                </div>
            </div>
        );
    }
    
    return (
        <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-4 space-y-6">
                {chatHistory.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'model' && (
                            <Avatar className="h-8 w-8 border border-white/10">
                                <AvatarFallback className="bg-primary/20"><Bot size={20} /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn(
                            "max-w-[75%] rounded-xl p-3 text-sm whitespace-pre-wrap",
                            message.role === 'user' ? 'bg-blue-600' : 'bg-gray-700/50'
                        )}>
                            {message.content}
                        </div>
                        {message.role === 'user' && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL || ''} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                         <Avatar className="h-8 w-8 border border-white/10">
                            <AvatarFallback className="bg-primary/20"><Bot size={20} /></AvatarFallback>
                        </Avatar>
                        <div className="max-w-[75%] rounded-xl p-3 text-sm bg-gray-700/50 flex items-center">
                            <LoadingSpinner size="sm" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};


export default function AiAssistantChat({
    onBack,
    dragControls,
    handleToggleFullScreen,
    isFullScreen,
    selectedModel,
    setSelectedModel,
    chatHistory,
    isLoading,
    chatSessions,
    activeChatId,
    onNewChat,
    onSelectChat
}: {
  onBack: () => void;
  dragControls: any;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  chatSessions: ChatSession[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}) {

  const [activeView, setActiveView] = useState<'chat' | 'files' | 'automation' | 'search' | 'summarizer'>('chat');

  const chatHeaderDragControls = {
      start: (e: React.PointerEvent) => {
        if (dragControls && typeof dragControls.start === 'function') {
            dragControls.start(e);
        }
      },
      onBack: onBack,
      handleToggleFullScreen: handleToggleFullScreen,
      isFullScreen: isFullScreen
  }

  return (
    <div className="flex flex-col h-full bg-[#1d2025] text-white rounded-xl overflow-hidden">
        <ChatHeader
            dragControls={chatHeaderDragControls}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
        />

        <div className="flex-1 flex min-h-0">
            <LeftSidebar
              chatSessions={chatSessions}
              activeChatId={activeChatId}
              onSelectChat={onSelectChat}
              onNewChat={onNewChat}
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <div className="flex-1 flex flex-col relative">
                {activeView === 'chat' && <ChatBody chatHistory={chatHistory} isLoading={isLoading} />}
                {activeView === 'summarizer' && <SummarizerTab />}
                {activeView === 'files' && <FileSystemBody />}
                {activeView === 'automation' && <AutomationTab />}
                {activeView === 'search' && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Search view coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

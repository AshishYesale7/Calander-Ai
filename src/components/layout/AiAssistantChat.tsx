
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bot,
  ChevronDown,
  Settings,
  MessageSquare,
  Terminal,
  Folder,
  Search as SearchIcon,
  X,
  Minus,
  Expand,
  Shrink,
} from 'lucide-react';
import { PixelMonsterLogo } from '../logo/PixelMonsterLogo';
import { useAuth } from '@/context/AuthContext';
import { generateGreeting } from '@/ai/flows/generate-greeting-flow';
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


export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface AiAssistantChatProps {
  initialPrompt: string;
  onBack: () => void;
  dragControls: any;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  chatHistory: ChatMessage[];
  isLoading: boolean;
}


const LeftSidebar = () => {
  const icons = [
    { icon: MessageSquare, label: 'Chat', active: true },
    { icon: Terminal, label: 'Terminal' },
    { icon: Folder, label: 'Files' },
    { icon: SearchIcon, label: 'Search' },
  ];
  return (
    <div className="w-12 bg-black/20 flex flex-col items-center py-2 gap-2 border-r border-white/10" onPointerDown={(e) => e.stopPropagation()}>
      {icons.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 rounded-lg ${item.active ? 'bg-yellow-400/80 text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          aria-label={item.label}
        >
          <item.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};

const ChatHeader = ({ 
    dragControls, 
    selectedModel, 
    setSelectedModel,
    onNewChat,
}: { 
    dragControls: any, 
    selectedModel: string, 
    setSelectedModel: (model: string) => void,
    onNewChat: () => void,
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
                <Button variant="outline" className="bg-gray-700/50 border-white/10 h-7 text-xs" onClick={onNewChat}>New Chat</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400"><Settings size={16}/></Button>
            </div>
        </div>
    )
};

const ChatBody = ({ chatHistory, isLoading }: { chatHistory: ChatMessage[], isLoading: boolean }) => {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGreeting = async () => {
            if (user?.displayName) {
                try {
                    const result = await generateGreeting({ name: user.displayName });
                    setGreeting(`${result.greeting} ${user.displayName}`);
                } catch (e) {
                    setGreeting(`Hello, ${user.displayName}`);
                }
            } else {
                setGreeting('Hello!');
            }
        };
        fetchGreeting();
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    isLoading
}: AiAssistantChatProps) {

  const handleNewChat = () => {
    // This function will be implemented in the parent to clear history
  };

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
            onNewChat={handleNewChat}
        />

        <div className="flex-1 flex min-h-0">
            <LeftSidebar />
            <div className="flex-1 flex flex-col relative">
               <ChatBody chatHistory={chatHistory} isLoading={isLoading} />
            </div>
        </div>
    </div>
  );
}

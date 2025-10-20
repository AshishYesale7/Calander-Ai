
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Bot,
  Send,
  User,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
  Paperclip,
  Sparkles,
  ArrowUp,
  Settings,
  MessageSquare,
  Terminal,
  Folder,
  Search as SearchIcon,
  X,
  Minus,
  Code,
  Expand,
  Shrink,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { PixelMonsterLogo } from '../logo/PixelMonsterLogo';
import { useAuth } from '@/context/AuthContext';
import { generateGreeting } from '@/ai/flows/generate-greeting-flow';
import { createConversationalEvent } from '@/ai/flows/conversational-event-flow';
import type { ConversationalEventOutput } from '@/ai/flows/conversational-event-flow';
import { useApiKey } from '@/hooks/use-api-key';
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


interface AiAssistantChatProps {
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  onBack: () => void;
  dragControls: any;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
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

const ChatBody = ({ chatHistory }: { chatHistory: ChatMessage[] }) => {
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
    }, [chatHistory]);

    if (chatHistory.length === 0) {
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
            </div>
        </ScrollArea>
    );
};

const ChatFooter = ({ onSend, input, setInput }: { onSend: () => void, input: string, setInput: (s: string) => void }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };
    
    return (
        <div 
            className="relative w-full flex items-center text-gray-400 p-3"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="bg-gray-800/50 rounded-xl p-1.5 border border-white/10 shadow-lg w-full">
                <textarea
                    ref={textareaRef}
                    placeholder="Send a message..."
                    className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-white placeholder:text-gray-400 resize-none min-h-[32px] w-full"
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="mt-1.5 flex justify-between items-center">
                    <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-white/10 hover:text-white"><Paperclip size={14}/></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:bg-white/10 hover:text-white"><Sparkles size={14}/></Button>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="secondary" className="h-6 text-xs bg-white/20 text-white">User</Button>
                        <Button variant="secondary" className="h-6 text-xs bg-white/20 text-white">Insert</Button>
                        <Button size="icon" className="h-6 w-6 bg-gray-600 hover:bg-gray-500" onClick={onSend}><ArrowUp size={14}/></Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function AiAssistantChat({ 
    initialPrompt, 
    onPromptChange, 
    onBack, 
    dragControls, 
    handleToggleFullScreen, 
    isFullScreen,
    selectedModel,
    setSelectedModel,
}: AiAssistantChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = useApiKey();

  useEffect(() => {
    setInput(initialPrompt);
    // If there's an initial prompt, start the conversation
    if (initialPrompt.trim()) {
        const userMessage: ChatMessage = { role: 'user', content: initialPrompt };
        setChatHistory([userMessage]);
        handleAIResponse([userMessage]);
        onPromptChange(''); // Clear the initial prompt from parent
    }
  }, [initialPrompt]);

  const handleAIResponse = async (history: ChatMessage[]) => {
      setIsLoading(true);
      try {
          const result: ConversationalEventOutput = await createConversationalEvent({
              chatHistory: history.map(m => ({ role: m.role, content: m.content })),
              apiKey,
          });
          if (result.response) {
              setChatHistory(prev => [...prev, { role: 'model', content: result.response! }]);
          }
      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error." }]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const newUserMessage: ChatMessage = { role: 'user', content: input };
    const newHistory = [...chatHistory, newUserMessage];
    setChatHistory(newHistory);
    setInput('');
    handleAIResponse(newHistory);
  };
  
  const handleNewChat = () => {
    setChatHistory([]);
    setInput('');
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

        <div className="flex-1 flex flex-col min-h-0">
            <ChatBody chatHistory={chatHistory} />
             {isLoading && (
                <div className="px-4 pb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    <span>Thinking...</span>
                </div>
            )}
            <ChatFooter onSend={handleSend} input={input} setInput={setInput} />
        </div>
    </div>
  );
}

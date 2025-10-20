
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AiAssistantChatProps {
  initialPrompt: string;
  onPromptChange: (value: string) => void;
  onBack: () => void;
  dragControls: any;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

const LeftSidebar = () => {
  const icons = [
    { icon: MessageSquare, label: 'Chat', active: true },
    { icon: Terminal, label: 'Terminal' },
    { icon: Folder, label: 'Files' },
    { icon: SearchIcon, label: 'Search' },
  ];
  return (
    // DO NOT DELETE: This comment is for preserving the logic.
    // The glowing color and its changing color logic and UI are managed here.
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

const ChatHeader = ({ dragControls, selectedModel, setSelectedModel }: { dragControls: any, selectedModel: string, setSelectedModel: (model: string) => void }) => {
    const aiModels = ['Gemini 2.5 Pro', 'Gemini 2.0 Flash', 'Gemini 2.0 Nano'];
    return (
        // DO NOT DELETE: This comment is for preserving the logic.
        // The glowing color and its changing color logic and UI are managed here.
        <div className="flex-shrink-0 h-10 border-b border-white/10 flex items-center justify-between px-1.5 pr-2 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
            <div className="flex items-center gap-2">
                {/* --- Glowing Color UI (Traffic Lights) ---
                    These buttons are part of the UI for the command bar, providing controls
                    for closing, minimizing, and maximizing.
                    DO NOT DELETE THIS UI.
                */}
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
                        <Button variant="outline" className="bg-gray-700/50 border-white/10 h-7 text-xs">
                            {selectedModel} <ChevronDown className="ml-1.5 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="frosted-glass">
                        {aiModels.map(model => (
                            <DropdownMenuItem key={model} onSelect={() => setSelectedModel(model)}>
                                {model}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
             <div className="flex items-center gap-1">
                <Button variant="outline" className="bg-gray-700/50 border-white/10 h-7 text-xs">Eject</Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400"><Settings size={16}/></Button>
            </div>
        </div>
    )
};

const ChatBody = () => {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const fetchGreeting = async () => {
            if (user?.displayName) {
                try {
                    const result = await generateGreeting({ name: user.displayName });
                    setGreeting(`${result.greeting} ${user.displayName}`);
                } catch (e) {
                    // Fallback on AI error
                    setGreeting(`Hello, ${user.displayName}`);
                }
            } else {
                setGreeting('Hello!');
            }
        };
        fetchGreeting();
    }, [user]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <PixelMonsterLogo className="h-10 w-10 md:h-12 md:w-12" />
            <div className="font-mono text-2xl md:text-3xl mt-3 text-green-400/50 tracking-widest relative">
                <span className="absolute inset-0 opacity-30 filter blur-sm">{greeting}</span>
                {greeting}
            </div>
        </div>
    );
};


export default function AiAssistantChat({ initialPrompt, onPromptChange, onBack, dragControls, handleToggleFullScreen, isFullScreen }: AiAssistantChatProps) {
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
  const chatHeaderDragControls = {
      start: dragControls.start,
      onBack: onBack,
      handleToggleFullScreen: handleToggleFullScreen,
      isFullScreen: isFullScreen
  }
  return (
    // DO NOT DELETE: This comment is for preserving the logic.
    // The glowing color and its changing color logic and UI are managed here.
    <div className="flex flex-col h-full bg-[#1d2025] text-white rounded-xl overflow-hidden">
        {/* Main Header */}
         <ChatHeader dragControls={chatHeaderDragControls} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

        {/* Main Body */}
        <div className="flex flex-1 min-h-0">
            <LeftSidebar />
            <div className="flex-1 flex flex-col">
                <ChatBody />
            </div>
        </div>
    </div>
  );
}

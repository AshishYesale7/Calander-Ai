
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '../ui/badge';
import { PixelMonsterLogo } from '../logo/PixelMonsterLogo';

interface AiAssistantChatProps {
  initialPrompt: string;
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
    <div className="w-14 bg-black/20 flex flex-col items-center py-3 gap-3 border-r border-white/10" onPointerDown={(e) => e.stopPropagation()}>
      {icons.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-lg ${item.active ? 'bg-yellow-400/80 text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          aria-label={item.label}
        >
          <item.icon className="h-5 w-5" />
        </Button>
      ))}
    </div>
  );
};

const ChatHeader = ({dragControls}: {dragControls: any}) => (
  <div className="flex-shrink-0 h-11 border-b border-white/10 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400"><ChevronLeft size={18} /></Button>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400"><ChevronRight size={18} /></Button>
    </div>
    <div className="flex-1 flex items-center justify-center">
        <div className="bg-white/10 px-3 py-1 rounded-md text-sm flex items-center gap-2 border-b-2 border-white/50">
            <span>Unnamed Chat</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400"><MoreHorizontal size={16}/></Button>
        </div>
    </div>
    <div className="w-14"></div>
  </div>
);

const ChatBody = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <PixelMonsterLogo className="h-12 w-12" />
        <div className="font-mono text-3xl mt-3 text-green-400/50 tracking-widest relative">
            <span className="absolute inset-0 opacity-30 filter blur-sm">LM STUDIO</span>
            LM STUDIO
        </div>
    </div>
);

const ChatInput = () => (
    <div className="p-2">
        <div className="bg-gray-800/50 rounded-xl p-2 border border-white/10 shadow-lg">
            <Textarea
                placeholder="Send a message..."
                className="bg-transparent border-none focus-visible:ring-0 text-sm text-white placeholder:text-gray-400 resize-none min-h-[36px]"
                rows={1}
            />
            <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:bg-white/10 hover:text-white"><Paperclip size={16}/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:bg-white/10 hover:text-white"><Sparkles size={16}/></Button>
                    <Badge variant="outline" className="bg-blue-900/50 border-blue-500/50 text-blue-300 text-xs py-0.5 px-2">rag-v1 <X size={12} className="ml-1.5 cursor-pointer" /></Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" className="h-7 text-xs bg-white/20 text-white">User</Button>
                    <Button variant="secondary" className="h-7 text-xs bg-white/20 text-white">Insert</Button>
                    <Button size="icon" className="h-7 w-7 bg-gray-600 hover:bg-gray-500"><ArrowUp size={16}/></Button>
                </div>
            </div>
        </div>
    </div>
);


export default function AiAssistantChat({ initialPrompt, onBack, dragControls, handleToggleFullScreen, isFullScreen }: AiAssistantChatProps) {

  return (
    <div className="flex flex-col h-full bg-[#1d2025] text-white rounded-xl overflow-hidden">
        {/* Main Header */}
        <div className="flex-shrink-0 h-11 border-b border-white/10 flex items-center justify-between px-2 pr-3 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
            <div className="flex items-center gap-2">
                {/* --- Glowing Color UI (Traffic Lights) ---
                    These buttons are part of the UI for the command bar, providing controls
                    for closing, minimizing, and maximizing.
                    DO NOT DELETE THIS UI.
                */}
                <div className="flex gap-1.5 p-2">
                    <button onClick={onBack} aria-label="Close" className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-black/60 hover:text-black">
                        <X size={10} strokeWidth={4} />
                    </button>
                    <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center text-black/60 hover:text-black">
                        <Minus size={10} strokeWidth={4} />
                    </div>
                    <button onClick={handleToggleFullScreen} aria-label={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'} className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-black/60 hover:text-black">
                         {isFullScreen ? <Shrink size={8} strokeWidth={3} /> : <Expand size={8} strokeWidth={3} />}
                    </button>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                <Button variant="outline" className="bg-gray-700/50 border-white/10 h-8 text-sm">
                    Select a model <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="bg-gray-700/50 border-white/10 h-8 text-sm">Eject</Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400"><Settings size={18}/></Button>
            </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 min-h-0">
            <LeftSidebar />
            <div className="flex-1 flex flex-col">
                <ChatHeader dragControls={dragControls} />
                <ChatBody />
                <ChatInput />
                 <div className="text-xs text-gray-500 px-4 py-1 border-t border-white/10 flex justify-between">
                    <span>LM Studio 0.3.30</span>
                    <span className="font-mono">RAM: 0 GB | CPU: 0 %</span>
                </div>
            </div>
        </div>
    </div>
  );
}


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
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '../ui/badge';
import { PixelMonsterLogo } from '../logo/PixelMonsterLogo';

interface AiAssistantChatProps {
  initialPrompt: string;
  onBack: () => void;
  dragControls: any;
}

const LeftSidebar = () => {
  const icons = [
    { icon: MessageSquare, label: 'Chat', active: true },
    { icon: Terminal, label: 'Terminal' },
    { icon: Folder, label: 'Files' },
    { icon: SearchIcon, label: 'Search' },
  ];
  return (
    <div className="w-16 bg-black/20 flex flex-col items-center py-4 gap-4 border-r border-white/10" onPointerDown={(e) => e.stopPropagation()}>
      {icons.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-lg ${item.active ? 'bg-yellow-400/80 text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          aria-label={item.label}
        >
          <item.icon className="h-6 w-6" />
        </Button>
      ))}
    </div>
  );
};

const ChatHeader = ({dragControls}: {dragControls: any}) => (
  <div className="flex-shrink-0 h-12 border-b border-white/10 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400"><ChevronLeft /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400"><ChevronRight /></Button>
    </div>
    <div className="flex-1 flex items-center justify-center">
        <div className="bg-white/10 px-4 py-1.5 rounded-md text-base flex items-center gap-2 border-b-2 border-white/50">
            <span>Unnamed Chat</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400"><MoreHorizontal size={18}/></Button>
        </div>
    </div>
    <div className="w-16"></div>
  </div>
);

const ChatBody = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <PixelMonsterLogo className="h-20 w-20" />
        <div className="font-mono text-5xl mt-4 text-green-400/50 tracking-widest relative">
            <span className="absolute inset-0 opacity-30 filter blur-sm">LM STUDIO</span>
            LM STUDIO
        </div>
    </div>
);

const ChatInput = () => (
    <div className="p-4">
        <div className="bg-gray-800/50 rounded-xl p-3 border border-white/10 shadow-lg">
            <Textarea
                placeholder="Send a message to the model..."
                className="bg-transparent border-none focus-visible:ring-0 text-base text-white placeholder:text-gray-400 resize-none min-h-[48px]"
                rows={2}
            />
            <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-white/10 hover:text-white"><Paperclip size={18}/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-white/10 hover:text-white"><Sparkles size={18}/></Button>
                    <Badge variant="outline" className="bg-blue-900/50 border-blue-500/50 text-blue-300 py-1 px-3">rag-v1 <X size={14} className="ml-1.5 cursor-pointer" /></Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" className="h-9 bg-white/20 text-white">User (⌘U)</Button>
                    <Button variant="secondary" className="h-9 bg-white/20 text-white">Insert (⌘I)</Button>
                    <Button size="icon" className="h-9 w-9 bg-gray-600 hover:bg-gray-500"><ArrowUp size={20}/></Button>
                </div>
            </div>
        </div>
    </div>
);


export default function AiAssistantChat({ initialPrompt, onBack, dragControls }: AiAssistantChatProps) {

  return (
    <div className="flex flex-col h-full bg-[#1d2025] text-white rounded-xl overflow-hidden">
        {/* Main Header */}
        <div className="flex-shrink-0 h-12 border-b border-white/10 flex items-center justify-between px-3 pr-4 cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
            <div className="flex items-center gap-2">
                {/* Traffic light buttons */}
                <div className="flex gap-2 p-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-red-500"></div>
                    <div className="h-3.5 w-3.5 rounded-full bg-yellow-500"></div>
                    <div className="h-3.5 w-3.5 rounded-full bg-green-500"></div>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                <Button variant="outline" className="bg-gray-700/50 border-white/10 h-9 text-base">
                    Select a model to load <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="bg-gray-700/50 border-white/10 h-9 text-base">Eject</Button>
                 <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400"><Settings size={20}/></Button>
            </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 min-h-0">
            <LeftSidebar />
            <div className="flex-1 flex flex-col">
                <ChatHeader dragControls={dragControls} />
                <ChatBody />
                <ChatInput />
                 <div className="text-sm text-gray-500 px-4 py-1.5 border-t border-white/10 flex justify-between">
                    <span>LM Studio 0.3.30 (Build 2)</span>
                    <span className="font-mono">RAM: 0 GB | CPU: 0.00 %</span>
                </div>
            </div>
        </div>
    </div>
  );
}

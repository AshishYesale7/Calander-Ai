
'use client';

import React, { useState, useEffect } from 'react';
import { CommandDialog } from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Folder, Zap, Bot, Settings, ChevronDown, Expand, Shrink } from 'lucide-react';
import ChatTab from './tabs/ChatTab';
import FilesTab from './tabs/FilesTab';
import AutomationTab from './tabs/AutomationTab';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '@/context/AuthContext';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // Other props will be added later
}

export function CommandPalette({
  isOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState('Gemini Flash');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const aiModels = ['Gemini Pro', 'Gemini Flash', 'Gemini Nano'];

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange} isFullScreen={isFullScreen}>
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-2 border-b border-border/30 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <CalendarAiLogo />
                    <span className="font-semibold text-primary">Calendar.ai</span>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 text-xs frosted-glass">
                                <Bot className="mr-2 h-4 w-4" /> {selectedModel} <ChevronDown className="ml-1.5 h-3 w-3" />
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullScreen(!isFullScreen)}>
                        {isFullScreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4"/>Chat</TabsTrigger>
                    <TabsTrigger value="files"><Folder className="mr-2 h-4 w-4"/>Files</TabsTrigger>
                    <TabsTrigger value="automation"><Zap className="mr-2 h-4 w-4"/>Automation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="flex-1 min-h-0">
                    <ChatTab />
                </TabsContent>
                <TabsContent value="files" className="flex-1 min-h-0">
                    <FilesTab />
                </TabsContent>
                <TabsContent value="automation" className="flex-1 min-h-0">
                    <AutomationTab />
                </TabsContent>
            </Tabs>
        </div>
    </CommandDialog>
  );
}

// Update the CommandDialog component to accept the isFullScreen prop
const CommandDialogContent = Dialog.Content as any; // Temporary type assertion

const UpdatedCommandDialog = ({ children, isFullScreen, ...props }: { children: React.ReactNode, isFullScreen?: boolean } & Dialog.DialogProps) => (
  <Dialog.Root {...props}>
    <CommandDialogContent 
        className={isFullScreen ? "w-full h-full max-w-full sm:max-w-full sm:rounded-none" : "sm:max-w-2xl"}
    >
        {children}
    </CommandDialogContent>
  </Dialog.Root>
);

// Redefine CommandDialog to use the updated version
const CustomCommandDialog = UpdatedCommandDialog as typeof CommandDialogPrimitive;
export { CustomCommandDialog as CommandDialog };


'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Target,
  Brain,
  Eye,
  Newspaper,
  Lightbulb,
  ClipboardCheck,
  Search,
  Moon,
  Sun,
  Settings,
  Palette,
  UserCircle,
  Expand,
  Shrink,
  PlusCircle,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import AiAssistantChat from './AiAssistantChat';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/career-goals', label: 'Career Goals', icon: Target },
  { href: '/skills', label: 'Skills', icon: Brain },
  { href: '/career-vision', label: 'Career Vision', icon: Eye },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/resources', label: 'Resources', icon: Lightbulb },
  { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export function CommandPalette({
  isOpen,
  onOpenChange,
  setIsCustomizeModalOpen,
  setIsProfileModalOpen,
  setIsSettingsModalOpen,
  handleToggleFullScreen,
  isFullScreen,
}: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<('commandList' | 'aiChat')[]>(['commandList']);
  const [hasMatchingItems, setHasMatchingItems] = useState(true);
  const activePage = pages[pages.length - 1];

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearch('');
        setPages(['commandList']);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (search.trim().length > 0) {
           setPages(p => [...p, 'aiChat']);
        }
      }
    },
    [search]
  );
  
  const groups = useMemo(() => {
    return [
      {
        heading: 'Navigation',
        items: menuItems,
      },
      {
        heading: 'Quick Actions',
        items: [
            { id: 'newEvent', label: 'Add New Event', icon: PlusCircle, action: () => runCommand(() => router.push('/dashboard?action=newEvent')) },
            { id: 'newGoal', label: 'Add New Goal', icon: PlusCircle, action: () => runCommand(() => router.push('/career-goals?action=newGoal')) },
            { id: 'newSkill', label: 'Add New Skill', icon: PlusCircle, action: () => runCommand(() => router.push('/skills?action=newSkill')) },
            { id: 'newBookmark', label: 'Add Bookmark', icon: PlusCircle, action: () => runCommand(() => router.push('/resources?action=newBookmark')) },
            { id: 'newList', label: 'New Task List', icon: PlusCircle, action: () => runCommand(() => router.push('/tasks?action=newList')) },
        ]
      },
      {
        heading: 'Actions',
        items: [
            { id: 'toggleTheme', label: 'Toggle Theme', icon: theme === 'dark' ? Sun : Moon, action: () => runCommand(() => setTheme(theme === 'light' ? 'dark' : 'light')) },
            { id: 'settings', label: 'Settings', icon: Settings, action: () => runCommand(() => setIsSettingsModalOpen(true)) },
            { id: 'customizeTheme', label: 'Customize Theme', icon: Palette, action: () => runCommand(() => setIsCustomizeModalOpen(true)) },
            { id: 'viewProfile', label: 'View Profile', icon: UserCircle, action: () => runCommand(() => setIsProfileModalOpen(true)) },
            { id: 'toggleFullscreen', label: isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen', icon: isFullScreen ? Shrink : Expand, action: () => runCommand(handleToggleFullScreen) },
        ]
      },
    ]
  }, [runCommand, router, theme, isFullScreen, setTheme, setIsSettingsModalOpen, setIsCustomizeModalOpen, setIsProfileModalOpen, handleToggleFullScreen]);
  
  const filteredGroups = useMemo(() => {
    if (!search) return groups;
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
      }))
      .filter(group => group.items.length > 0);
  }, [search, groups]);

  useEffect(() => {
    setHasMatchingItems(filteredGroups.length > 0);
  }, [filteredGroups]);
  
  const isAiMode = !hasMatchingItems && search.trim().length > 0;

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange} isAiMode={isAiMode}>
      {activePage === 'commandList' ? (
        <>
          <CommandInput 
            placeholder="Ask AI or type a command..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={onKeyDown}
            isAiMode={isAiMode}
          />
          <CommandList>
            <CommandEmpty>
                <div className="flex items-center justify-center p-6 gap-2">
                    <CalendarAiLogo className="h-6 w-6 animate-pulse" />
                    <span className="text-muted-foreground text-base">Ask AI anything...</span>
                </div>
            </CommandEmpty>
            {filteredGroups.map((group) => (
                <React.Fragment key={group.heading}>
                    <CommandGroup heading={group.heading}>
                    {group.items.map(({ id, href, label, icon: Icon, action }) => (
                        <CommandItem key={id || href} onSelect={action || (() => runCommand(() => router.push(href!)))}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{label}</span>
                        </CommandItem>
                    ))}
                    </CommandGroup>
                    <CommandSeparator />
                </React.Fragment>
            ))}
          </CommandList>
        </>
      ) : (
         <AiAssistantChat initialPrompt={search} onBack={() => setPages(p => p.slice(0, -1))} />
      )}
    </CommandDialog>
  );
}


'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
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
  const activePage = pages[pages.length - 1];

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  // Reset to command list view when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearch('');
        setPages(['commandList']);
      }, 200); // Delay to prevent UI flicker
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // When user hits Enter, switch to the AI chat interface
        if (search.trim().length > 0) {
           setPages(p => [...p, 'aiChat']);
        }
      }
    },
    [search]
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      {activePage === 'commandList' ? (
        <>
          <CommandInput 
            placeholder="Ask AI or type a command..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={onKeyDown}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {menuItems.map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} onSelect={() => runCommand(() => router.push(href))}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
                <CommandItem onSelect={() => runCommand(() => router.push('/dashboard?action=newEvent'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-accent" />
                    <span>Add New Event</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/career-goals?action=newGoal'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-accent" />
                    <span>Add New Goal</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/skills?action=newSkill'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-accent" />
                    <span>Add New Skill</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/resources?action=newBookmark'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-accent" />
                    <span>Add Bookmark</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push('/tasks?action=newList'))}>
                    <PlusCircle className="mr-2 h-4 w-4 text-accent" />
                    <span>New Task List</span>
                </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand(() => setTheme(theme === 'light' ? 'dark' : 'light'))}>
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>Toggle Theme</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setIsSettingsModalOpen(true))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setIsCustomizeModalOpen(true))}>
                <Palette className="mr-2 h-4 w-4" />
                <span>Customize Theme</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setIsProfileModalOpen(true))}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(handleToggleFullScreen)}>
                {isFullScreen ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                <span>{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </>
      ) : (
         <AiAssistantChat initialPrompt={search} onBack={() => setPages(p => p.slice(0, -1))} />
      )}
    </CommandDialog>
  );
}

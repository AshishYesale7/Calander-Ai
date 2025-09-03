
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  Bot,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { createEventFromPrompt, type CreateEventInput } from '@/ai/flows/create-event-flow';
import { saveTimelineEvent } from '@/services/timelineService';
import type { TimelineEvent } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTimezone } from '@/hooks/use-timezone';


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
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { timezone } = useTimezone();

  useEffect(() => {
    // Reset state when the dialog closes
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearch('');
        setIsCreatingEvent(false);
      }, 300); // delay to allow for closing animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  const handleCreateEvent = async () => {
    if (!search.trim() || !user || isCreatingEvent) return;
    setIsCreatingEvent(true);
    
    try {
        const input: CreateEventInput = { prompt: search, apiKey, timezone };
        const result = await createEventFromPrompt(input);
        
        const newEvent: TimelineEvent = {
            id: `ai-${Date.now()}`,
            title: result.title,
            date: new Date(result.date),
            endDate: result.endDate ? new Date(result.endDate) : undefined,
            notes: result.notes,
            isAllDay: result.isAllDay,
            type: 'ai_suggestion',
            isDeletable: true,
            status: 'pending',
            priority: 'None',
            location: result.location,
            reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
        };
        
        const { icon, ...data } = newEvent;
        const payload = { ...data, date: data.date.toISOString(), endDate: data.endDate ? data.endDate.toISOString() : null };
        await saveTimelineEvent(user.uid, payload, { syncToGoogle: false, timezone });

        toast({
            title: "Event Created with AI",
            description: `"${result.title}" has been added to your timeline.`
        });
        
        // A full navigation is more reliable for state updates than router.refresh() here
        router.push('/dashboard');
        // We close the dialog after the navigation is initiated
        onOpenChange(false);
        
    } catch (error) {
        console.error("AI Event Creation Error:", error);
        toast({
            title: "AI Error",
            description: "Could not create event. The AI might have been unable to understand the request.",
            variant: "destructive"
        });
    } finally {
        setIsCreatingEvent(false);
    }
  };


  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search or generate an event..."
        value={search}
        onValueChange={setSearch} 
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {search.trim().length > 2 && (
            <CommandGroup heading="AI Actions">
                 <CommandItem
                    onSelect={handleCreateEvent}
                    disabled={isCreatingEvent}
                    className="cursor-pointer"
                >
                    {isCreatingEvent ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2"/>
                          <span>Creating event...</span>
                        </>
                    ) : (
                        <>
                            <Bot className="mr-2 h-4 w-4 text-accent" />
                            <span>Generate event for: "{search}"</span>
                        </>
                    )}
                </CommandItem>
            </CommandGroup>
        )}

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
        <CommandSeparator />
        <CommandGroup heading="External Links">
          <CommandItem onSelect={() => runCommand(() => window.open('https://google.com', '_blank'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Google</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.open('https://duckduckgo.com', '_blank'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search DuckDuckGo</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

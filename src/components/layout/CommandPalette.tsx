
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Moon,
  Sun,
  Settings,
  Palette,
  UserCircle,
  Expand,
  Shrink,
  PlusCircle,
  Download,
  ExternalLink,
  Trophy,
  AtSign,
  User,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import AiAssistantChat from './AiAssistantChat';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { useAuth } from '@/context/AuthContext';
import { usePlugin } from '@/hooks/use-plugin';
import { allPlugins } from '@/data/plugins';
import { getInstalledPlugins, saveInstalledPlugins, getUserProfile, searchUsers, type SearchedUser } from '@/services/userService';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { LoadingSpinner } from '../ui/LoadingSpinner';


const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/career-goals', label: 'Career Goals', icon: Target },
  { href: '/skills', label: 'Skills', icon: Brain },
  { href: '/career-vision', label: 'Career Vision', icon: Eye },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/resources', label: 'Resources', icon: Lightbulb },
  { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export function CommandPalette({
  isOpen,
  onOpenChange,
  setIsCustomizeModalOpen,
  setIsSettingsModalOpen,
  handleToggleFullScreen,
  isFullScreen,
}: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const { setActivePlugin } = usePlugin();
  
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<('commandList' | 'aiChat')[]>(['commandList']);
  const activePage = pages[pages.length - 1];
  
  const [userProfile, setUserProfile] = useState<{username?: string} | null>(null);
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());

  // New state for user search
  const [userSearchResults, setUserSearchResults] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const isUserSearchMode = search.startsWith('@');
  

  useEffect(() => {
    if (user && isOpen) {
      getUserProfile(user.uid).then(setUserProfile);
      getInstalledPlugins(user.uid).then(plugins => {
        if(plugins) setInstalledPlugins(new Set(plugins));
      });
    }
  }, [user, isOpen]);
  
  useEffect(() => {
    if (isUserSearchMode) {
      const searchQuery = search.substring(1);
      if (searchQuery.length > 1) {
        setIsSearchingUsers(true);
        const debounceTimer = setTimeout(() => {
          searchUsers(searchQuery).then(results => {
            setUserSearchResults(results);
            setIsSearchingUsers(false);
          });
        }, 300);
        return () => clearTimeout(debounceTimer);
      } else {
        setUserSearchResults([]);
      }
    } else {
        setUserSearchResults([]);
    }
  }, [search, isUserSearchMode]);


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
  
  const handlePluginInstall = (pluginName: string) => {
    if (!user) return;
    const newSet = new Set(installedPlugins).add(pluginName);
    setInstalledPlugins(newSet);
    saveInstalledPlugins(user.uid, Array.from(newSet));
  };
  
  const handleOpenPlugin = (plugin: (typeof allPlugins)[0]) => {
     runCommand(() => {
        router.push('/extension');
        setTimeout(() => setActivePlugin(plugin), 100);
    });
  };

  const groups = useMemo(() => {
    const profileItem = userProfile?.username
      ? { id: 'viewProfile', label: 'View Profile', icon: UserCircle, action: () => runCommand(() => router.push(`/profile/${userProfile.username}`)) }
      : null;

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
            profileItem,
            { id: 'toggleFullscreen', label: isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen', icon: isFullScreen ? Shrink : Expand, action: () => runCommand(handleToggleFullScreen) },
        ].filter(Boolean)
      },
      {
        heading: 'Plugins',
        items: allPlugins.map(plugin => {
            const isInstalled = installedPlugins.has(plugin.name);
            const LogoComponent = plugin.logo;
            const action = isInstalled
                ? () => handleOpenPlugin(plugin)
                : () => handlePluginInstall(plugin.name);

            return {
                id: `plugin-${plugin.name}`,
                label: plugin.name,
                icon: typeof LogoComponent === 'string' ? () => <Image src={LogoComponent} alt={plugin.name} width={16} height={16} /> : LogoComponent,
                action: action,
                actionLabel: isInstalled ? 'Open' : 'Install',
                actionIcon: isInstalled ? ExternalLink : Download,
            };
        })
      }
    ]
  }, [runCommand, router, theme, isFullScreen, setTheme, setIsSettingsModalOpen, setIsCustomizeModalOpen, handleToggleFullScreen, user, installedPlugins, userProfile, handleOpenPlugin, handlePluginInstall]);
  
  const filteredGroups = useMemo(() => {
    if (!search || isUserSearchMode) return groups;
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
      }))
      .filter(group => group.items.length > 0);
  }, [search, groups, isUserSearchMode]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
      const hasVisibleCommands = filteredGroups.reduce((acc, group) => acc + group.items.length, 0) > 0;
      
      if (e.key === "Enter") {
        if (search.trim().length > 0 && !isUserSearchMode && !hasVisibleCommands) {
            e.preventDefault();
            setPages(p => [...p, 'aiChat']);
        }
      }
    },
    [search, filteredGroups, isUserSearchMode]
  );
  
  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      {activePage === 'commandList' ? (
        <>
          <CommandInput 
            placeholder="Type a command or @ to search users..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={onKeyDown}
          />
          <CommandList>
            {isUserSearchMode ? (
              <>
                {isSearchingUsers && <div className="p-4 flex items-center justify-center text-sm text-muted-foreground"><LoadingSpinner size="sm" className="mr-2"/>Searching users...</div>}
                {!isSearchingUsers && userSearchResults.length === 0 && search.length > 1 && <CommandEmpty>No users found.</CommandEmpty>}
                <CommandGroup heading="Users">
                  {userSearchResults.map(u => (
                    <CommandItem key={u.uid} onSelect={() => runCommand(() => router.push(`/profile/${u.username}`))}>
                        <Avatar className="mr-3 h-6 w-6">
                            <AvatarImage src={u.photoURL || undefined} />
                            <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium">{u.displayName}</span>
                            <span className="text-xs text-muted-foreground">@{u.username}</span>
                        </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandEmpty>
                    {search.trim().length > 0 ? (
                        <div className="flex items-center justify-center p-6 gap-2 text-base text-muted-foreground">
                            <CalendarAiLogo className="h-6 w-6" />
                            <span>Press Enter to ask AI anything...</span>
                        </div>
                    ) : (
                       <div className="py-6 text-center text-sm">No results found.</div>
                    )}
                </CommandEmpty>
                {filteredGroups.map((group, groupIndex) => (
                    <React.Fragment key={group.heading}>
                        <CommandGroup heading={group.heading}>
                        {group.items.map(({ id, href, label, icon: Icon, action, actionLabel, actionIcon: ActionIcon }) => (
                            <CommandItem key={id || href} onSelect={action || (() => runCommand(() => router.push(href!)))}>
                              <Icon className="mr-2 h-4 w-4" />
                              <span>{label}</span>
                              {actionLabel && ActionIcon && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if(action) action();
                                    }}
                                    className="ml-auto flex items-center gap-1.5 text-xs bg-muted/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-0.5"
                                  >
                                    <ActionIcon className="h-3 w-3" />
                                    {actionLabel}
                                  </button>
                              )}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                        {filteredGroups.indexOf(group) < filteredGroups.length - 1 && groupIndex < filteredGroups.length -1 && <CommandSeparator />}
                    </React.Fragment>
                ))}
              </>
            )}
          </CommandList>
        </>
      ) : (
         <AiAssistantChat initialPrompt={search} onBack={() => setPages(p => p.slice(0, -1))} />
      )}
    </CommandDialog>
  );
}

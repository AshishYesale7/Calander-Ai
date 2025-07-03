
'use client';

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
  Search,
  Moon,
  Sun,
  Settings,
  Palette,
  UserCircle,
  Expand,
  Shrink,
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

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

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
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

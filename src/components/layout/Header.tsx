
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, UserCircle, LogOut, Settings, Sun, Moon, Palette, Expand, Shrink, FileText, Crown, ClipboardCheck, Clock, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from '@/hooks/use-theme';
import { useMemo, useState, useEffect, useRef } from 'react';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { SidebarTrigger } from '../ui/sidebar';
import NotificationPanel from './NotificationPanel';
import Image from 'next/image';
import { allPlugins } from '@/data/plugins';
import { getInstalledPlugins } from '@/services/userService';
import { getStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { Code } from 'lucide-react';
import { usePlugin } from '@/hooks/use-plugin';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Menu }, 
  { href: '/career-goals', label: 'Career Goals', icon: Menu },
  { href: '/skills', label: 'Skills', icon: Menu },
  { href: '/career-vision', label: 'Career Vision', icon: Menu },
  { href: '/news', label: 'News', icon: Menu },
  { href: '/resources', label: 'Resources', icon: Menu },
  { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/subscription', label: 'Subscription', icon: Crown },
];

const ExtensionIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" {...props}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <path d="M7.5 4.5C7.5 3.11929 8.61929 2 10 2C11.3807 2 12.5 3.11929 12.5 4.5V6H13.5C14.8978 6 15.5967 6 16.1481 6.22836C16.8831 6.53284 17.4672 7.11687 17.7716 7.85195C18 8.40326 18 9.10218 18 10.5H19.5C20.8807 10.5 22 11.6193 22 13C22 14.3807 20.8807 15.5 19.5 15.5H18V17.2C18 18.8802 18 19.7202 17.673 20.362C17.3854 20.9265 16.9265 21.3854 16.362 21.673C15.7202 22 14.8802 22 13.2 22H12.5V20.25C12.5 19.0074 11.4926 18 10.25 18C9.00736 18 8 19.0074 8 20.25V22H6.8C5.11984 22 4.27976 22 3.63803 21.673C3.07354 21.3854 2.6146 20.9265 2.32698 20.362C2 19.7202 2 18.8802 2 17.2V15.5H3.5C4.88071 15.5 6 14.3807 6 13C6 11.6193 4.88071 10.5 3.5 10.5H2C2 9.10218 2 8.40326 2.22836 7.85195C2.53284 7.11687 3.11687 6.53284 3.85195 6.22836C4.40326 6 5.10218 6 6.5 6H7.5V4.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </g>
    </svg>
);


interface HeaderProps {
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsLegalModalOpen: (open: boolean) => void;
  setIsTimezoneModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export default function Header({
  setIsCustomizeModalOpen,
  setIsProfileModalOpen,
  setIsSettingsModalOpen,
  setIsLegalModalOpen,
  setIsTimezoneModalOpen,
  handleToggleFullScreen,
  isFullScreen,
}: HeaderProps) {
  const { user, subscription } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { setActivePlugin } = usePlugin();
  const [installedPluginNames, setInstalledPluginNames] = useState<Set<string>>(new Set());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  useEffect(() => {
    if (user) {
        getInstalledPlugins(user.uid).then(names => setInstalledPluginNames(new Set(names)));
        getStreakData(user.uid).then(setStreakData);
    }
  }, [user]);

  const installedPlugins = useMemo(() => {
    return allPlugins.filter(p => installedPluginNames.has(p.name));
  }, [installedPluginNames]);

  const daysLeftInTrial = useMemo(() => {
    if (subscription?.status !== 'trial' || !subscription.endDate) return null;
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (endDate < now) return 0;
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [subscription]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
    }
    setIsPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
        setIsPopoverOpen(false);
    }, 200); // 200ms delay
  };

  const handlePluginClick = (plugin: (typeof allPlugins)[0]) => {
      setIsPopoverOpen(false);
      if (pathname !== '/extension') {
          router.push('/extension');
          // Give the router a moment to navigate before opening the plugin
          setTimeout(() => setActivePlugin(plugin), 100);
      } else {
          setActivePlugin(plugin);
      }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="hidden md:flex" />
            <div className="h-6 w-px bg-border hidden md:block" />
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground frosted-glass flex flex-col">
                    <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-6">
                    <Link href="/dashboard" className="text-center">
                        <div className="flex items-center justify-center gap-2">
                        <CalendarAiLogo />
                        <SheetTitle asChild>
                            <h1 className="font-headline text-2xl font-semibold text-white">Calendar.ai</h1>
                        </SheetTitle>
                        </div>
                    </Link>
                    </div>
                    <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                    {navItems.map((item) => (
                        <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                        {item.label}
                        </Link>
                    ))}
                    </nav>
                    <div className="mt-auto p-4">
                    {subscription?.status === 'trial' && typeof daysLeftInTrial === 'number' && daysLeftInTrial >= 0 && (
                        <div className="text-center p-2 mx-2 mb-2 rounded-md bg-accent/10 border border-accent/20">
                        <p className="text-sm font-semibold text-accent">{daysLeftInTrial} days left in your trial</p>
                        <Button size="sm" className="mt-2 w-full h-8 text-xs bg-accent hover:bg-accent/90" onClick={() => router.push('/subscription')}>Upgrade Now</Button>
                        </div>
                    )}
                    <div className="border-t border-sidebar-border -mx-4 mb-4" />
                    <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start gap-3 mb-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>
                    </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {streakData && (
             <Button variant="ghost" size="sm" asChild className="h-8">
               <Link href="/leaderboard" className="flex items-center gap-1 text-orange-400">
                  <Flame className="h-5 w-5" />
                  <span className="font-bold text-sm">{streakData.currentStreak}</span>
                  <span className="sr-only">day streak</span>
               </Link>
            </Button>
          )}

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <Button variant="ghost" size="icon">
                        <ExtensionIcon className="h-5 w-5" />
                        <span className="sr-only">Extensions</span>
                    </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="w-64 frosted-glass">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Installed Plugins</h4>
                    <div className="space-y-2">
                        {installedPlugins.length > 0 ? (
                           installedPlugins.map(plugin => (
                               <button 
                                   key={plugin.name}
                                   onClick={() => handlePluginClick(plugin)}
                                   className="w-full flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted"
                                >
                                   {plugin.logo && plugin.logo.startsWith('https://worldvectorlogo.com') ? (
                                        <Image src={plugin.logo} alt={`${plugin.name} logo`} width={20} height={20} />
                                    ) : (
                                        <Code className="h-5 w-5 text-accent" />
                                    )}
                                   <span>{plugin.name}</span>
                               </button>
                           ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No plugins installed.</p>
                        )}
                    </div>
                     <Button variant="outline" className="w-full" asChild>
                        <Link href="/extension">Manage Plugins</Link>
                    </Button>
                </div>
              </PopoverContent>
          </Popover>
          
          <NotificationPanel />
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || 'User'} />
                    <AvatarFallback>
                      {user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle size={20} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 frosted-glass">
                <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => setIsCustomizeModalOpen(true)}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Customize Theme</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setIsTimezoneModalOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Date & Time Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFullScreen}>
                  {isFullScreen ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                  <span>{isFullScreen ? 'Exit Fullscreen' : 'Go Fullscreen'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsLegalModalOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Terms & Policies</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
    </>
  );
}

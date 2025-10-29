
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, UserCircle, LogOut, Settings, Sun, Moon, Palette, Expand, Shrink, FileText, Crown, ClipboardCheck, Clock, Trophy, Flame, MessageSquare, UserPlus, Users, LogIn, XCircle } from 'lucide-react';
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
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/use-theme';
import { useMemo, useState, useEffect, useRef } from 'react';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import NotificationPanel from './NotificationPanel';
import { allPlugins } from '@/data/plugins';
import { getInstalledPlugins, getUserProfile } from '@/services/userService';
import { useStreak } from '@/context/StreakContext';
import { usePlugin } from '@/hooks/use-plugin';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { WidgetIcon } from '../logo/WidgetIcon';
import { useIsMobile } from '@/hooks/use-mobile';
import { widgetList } from './widget-previews';
import StreakPopoverContent from './StreakPopoverContent';
import ExtensionsPopoverContent from './ExtensionsPopoverContent';

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

interface HeaderProps {
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsLegalModalOpen: (open: boolean) => void;
  setIsTimezoneModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
  hiddenWidgets: Set<string>;
  handleToggleWidget: (id: string) => void;
}

export default function Header({
  setIsCustomizeModalOpen,
  setIsSettingsModalOpen,
  setIsLegalModalOpen,
  setIsTimezoneModalOpen,
  handleToggleFullScreen,
  isFullScreen,
  isEditMode,
  setIsEditMode,
  hiddenWidgets,
  handleToggleWidget,
}: HeaderProps) {
  const { user, subscription, isSubscribed, knownUsers, removeKnownUser, switchUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { setActivePlugin } = usePlugin();
  const { state: sidebarState } = useSidebar();
  const isMobile = useIsMobile();
  const [installedPluginNames, setInstalledPluginNames] = useState<Set<string>>(new Set());
  const [isStreakPopoverOpen, setIsStreakPopoverOpen] = useState(false);
  const [isExtensionsPopoverOpen, setIsExtensionsPopoverOpen] = useState(false);
  const [isWidgetPopoverOpen, setIsWidgetPopoverOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { streakData } = useStreak();
  const [userProfile, setUserProfile] = useState<{username?: string} | null>(null);

  useEffect(() => {
    if (user) {
        getInstalledPlugins(user.uid).then(names => setInstalledPluginNames(new Set(names)));
        getUserProfile(user.uid).then(setUserProfile);
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

  const handleSignOut = async (switchToEmail?: string | null) => {
    try {
      await signOut(auth);
      if (switchToEmail) {
          switchUser(switchToEmail);
      } else {
          router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleAddAccount = async () => {
    try {
      await signOut(auth);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out for Add Account:', error);
    }
  };
  
  const handleSwitchAccount = (email: string | null) => {
    if (email) {
      switchUser(email);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    removeKnownUser(uid);
  };

  const handleMouseEnter = (popover: 'streak' | 'extensions' | 'widget') => {
    if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
    }
    if (popover === 'streak') setIsStreakPopoverOpen(true);
    if (popover === 'extensions') setIsExtensionsPopoverOpen(true);
    if (popover === 'widget') setIsWidgetPopoverOpen(true);
  };

  const handleMouseLeave = (popover: 'streak' | 'extensions' | 'widget') => {
    hoverTimeoutRef.current = setTimeout(() => {
        if (popover === 'streak') setIsStreakPopoverOpen(false);
        if (popover === 'extensions') setIsExtensionsPopoverOpen(false);
        if (popover === 'widget') setIsWidgetPopoverOpen(false);
    }, 1000); // 1000ms delay
  };

  const handlePluginClick = (plugin: (typeof allPlugins)[0]) => {
      setIsExtensionsPopoverOpen(false);
      if (pathname !== '/extension') {
          router.push('/extension');
          setTimeout(() => setActivePlugin(plugin), 100);
      } else {
          setActivePlugin(plugin);
      }
  };
  
  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-black/50 px-4 backdrop-blur-md transition-all duration-300",
        !isMobile && sidebarState === 'expanded' && "md:ml-64",
        !isMobile && sidebarState === 'collapsed' && "md:ml-12"
      )}>
        <div className="flex items-center gap-2">
            {!isMobile && <SidebarTrigger />}
            {!isMobile && <div className="h-6 w-px bg-border hidden md:block" />}
            
            {isMobile && (
              <Sheet>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
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
            )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {isEditMode && (
              <Button
                className="done-button bg-green-500 hover:bg-green-600 text-white"
                onClick={() => setIsEditMode(false)}
              >
                Done
              </Button>
          )}

          {streakData && isSubscribed && user?.userType !== 'professional' && (
              <Popover open={isStreakPopoverOpen} onOpenChange={setIsStreakPopoverOpen}>
                <PopoverTrigger asChild>
                    <div onMouseEnter={() => handleMouseEnter('streak')} onMouseLeave={() => handleMouseLeave('streak')}>
                        <Button asChild variant="ghost" size="sm" className="h-8">
                            <Link href="/leaderboard" className="flex items-center gap-1 text-orange-400">
                                <Flame className="h-5 w-5" />
                                <span className="font-bold text-sm">{streakData.currentStreak}</span>
                                <span className="sr-only">day streak</span>
                            </Link>
                        </Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent onMouseEnter={() => handleMouseEnter('streak')} onMouseLeave={() => handleMouseLeave('streak')} className="w-80 frosted-glass p-0 overflow-hidden" sideOffset={10}>
                   <StreakPopoverContent streakData={streakData} />
                </PopoverContent>
              </Popover>
          )}

          {isSubscribed && (
            <>
              <Popover open={isExtensionsPopoverOpen} onOpenChange={setIsExtensionsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div onMouseEnter={() => handleMouseEnter('extensions')} onMouseLeave={() => handleMouseLeave('extensions')}>
                        <Button variant="ghost" size="icon">
                            <Code className="h-5 w-5" />
                            <span className="sr-only">Extensions</span>
                        </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent onMouseEnter={() => handleMouseEnter('extensions')} onMouseLeave={() => handleMouseLeave('extensions')} className="w-64 frosted-glass">
                      <ExtensionsPopoverContent 
                        installedPlugins={installedPlugins}
                        onPluginClick={handlePluginClick}
                      />
                  </PopoverContent>
              </Popover>

               <Popover open={isWidgetPopoverOpen} onOpenChange={setIsWidgetPopoverOpen}>
                <PopoverTrigger asChild>
                  <div onMouseEnter={() => handleMouseEnter('widget')} onMouseLeave={() => handleMouseLeave('widget')}>
                    <Button variant="ghost" size="icon">
                      <WidgetIcon />
                      <span className="sr-only">Widgets</span>
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent onMouseEnter={() => handleMouseEnter('widget')} onMouseLeave={() => handleMouseLeave('widget')} className="w-80 frosted-glass">
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Available Widgets</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {widgetList.map(widget => (
                                <div key={widget.id} className="p-2 border border-border/50 bg-background/50 rounded-md">
                                    <p className="text-sm font-semibold truncate">{widget.name}</p>
                                    <div className="mt-2 h-16 w-full bg-muted/30 rounded flex items-center justify-center">
                                        {widget.preview}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
              </Popover>
              
              <NotificationPanel />
            </>
          )}

          <Button variant="ghost" size="icon" className="hidden md:flex">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Toggle Chat</span>
          </Button>

          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                    <AvatarFallback>
                      {user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle size={20} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 frosted-glass">
                <DropdownMenuLabel className="flex items-start gap-3">
                   <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <div className="min-w-0">
                       <p className="font-semibold truncate">{user?.displayName}</p>
                       <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                   </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                    {knownUsers.filter(u => u.uid !== user?.uid).map(knownUser => (
                        <DropdownMenuItem key={knownUser.uid} onSelect={(e) => { e.preventDefault(); handleSwitchAccount(knownUser.email); }}>
                            <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={knownUser.photoURL || undefined} />
                                <AvatarFallback>{knownUser.displayName?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="truncate flex-1">{knownUser.displayName || knownUser.email}</span>
                            <button
                                onClick={(e) => handleRemoveAccount(e, knownUser.uid)}
                                className="p-1 text-muted-foreground hover:text-destructive z-10"
                                aria-label={`Remove ${knownUser.displayName || knownUser.email}`}
                            >
                                <XCircle className="h-4 w-4" />
                            </button>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onSelect={handleAddAccount}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Add Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSignOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out of all accounts</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCustomizeModalOpen(true)}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Customize Theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsTimezoneModalOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Date & Time Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => userProfile?.username && router.push(`/profile/${userProfile.username}`)}
                  disabled={!userProfile?.username}
                >
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
                <DropdownMenuItem onSelect={() => handleSignOut(null)}>
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

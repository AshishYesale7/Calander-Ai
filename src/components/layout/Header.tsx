
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
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/use-theme';
import { useMemo, useState, useEffect, useRef } from 'react';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { SidebarTrigger, useSidebar } from '../ui/sidebar';
import NotificationPanel from './NotificationPanel';
import Image from 'next/image';
import { allPlugins } from '@/data/plugins';
import { getInstalledPlugins, getUserProfile } from '@/services/userService';
import { useStreak } from '@/context/StreakContext';
import type { StreakData } from '@/types';
import { Code } from 'lucide-react';
import { usePlugin } from '@/hooks/use-plugin';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, toDate, isToday as dfnsIsToday } from 'date-fns';
import ContributionGraphCard from '../extensions/codefolio/ContributionGraphCard';
import { useChat } from '@/context/ChatContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { WidgetIcon } from '../logo/WidgetIcon';
import { useIsMobile } from '@/hooks/use-mobile';


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

const DailyFlameIcon = ({ isComplete }: { isComplete: boolean }) => (
    <svg height="28px" width="28px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 388.219 388.219" xmlSpace="preserve">
        <g style={{ filter: isComplete ? 'none' : 'grayscale(80%) opacity(60%)' }}>
            <path style={{fill: '#FF793B'}} d="M160.109,182.619c0.8,6.8-6,11.6-12,8c-22-12.8-32.8-36.4-47.2-56.8c-23.2,36.8-40.8,72.4-40.8,110.4 c0,77.2,54.8,136,132,136s136-58.8,136-136c0-96.8-101.2-113.6-100-236C187.309,37.019,148.909,101.419,160.109,182.619z"></path>
            <path style={{fill: '#C6490F'}} d="M192.109,388.219c-81.2,0-140-60.4-140-144c0-42,20.4-80,42-114.8c1.6-2.4,4-3.6,6.4-3.6 c2.8,0,5.2,1.2,6.8,3.2c3.6,4.8,6.8,10,10,15.2c10,15.6,19.6,30.4,34.8,39.2l0,0c-11.6-82.8,27.6-151.2,71.2-182 c2.4-1.6,5.6-2,8.4-0.4c2.8,1.2,4.4,4,4.4,7.2c-0.8,62,26.4,96,52.4,128.4c23.6,29.2,47.6,59.2,47.6,107.6 C336.109,326.219,274.109,388.219,192.109,388.219z M101.309,148.619c-18,29.6-33.2,61.6-33.2,95.6c0,74,52,128,124,128 c72.8,0,128-55.2,128-128c0-42.8-20.4-68-44-97.6c-24.4-30.4-51.6-64.4-55.6-122c-34.4,31.2-62,88.4-52.4,156.8l0,0 c0.8,6.4-2,12.4-7.2,15.6c-5.2,3.2-11.6,3.2-16.8,0c-18.4-10.8-29.2-28-40-44.4C102.909,151.419,102.109,150.219,101.309,148.619z"></path>
            <path style={{fill: '#FF793B'}} d="M278.109,304.219c14-21.6,22-47.6,22-76"></path>
            <path style={{fill: '#C6490F'}} d="M278.109,312.219c-1.6,0-3.2-0.4-4.4-1.2c-3.6-2.4-4.8-7.2-2.4-11.2c13.6-20.8,20.8-45.6,20.8-71.6 c0-4.4,3.6-8,8-8s8,3.6,8,8c0,29.2-8,56.8-23.2,80.4C283.309,311.019,280.909,312.219,278.109,312.219z"></path>
            <path style={{fill: '#FF793B'}} d="M253.709,332.219c2.8-2.4,6-5.2,8.4-8"></path>
            <path style={{fill: '#C6490F'}} d="M253.709,340.219c-2.4,0-4.4-0.8-6-2.8c-2.8-3.2-2.4-8.4,0.8-11.2c2.4-2.4,5.6-4.8,7.6-7.2 c2.8-3.2,8-3.6,11.2-0.8c3.2,2.8,3.6,8,0.8,11.2c-2.8,3.2-6.4,6.4-9.2,8.8C257.309,339.419,255.709,340.219,253.709,340.219z"></path>
        </g>
    </svg>
);

const TrophyFlameIcon = ({ isComplete, className }: { isComplete: boolean, className?: string }) => (
    <svg height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" className={className}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <g style={{ filter: isComplete ? 'none' : 'grayscale(100%)' }}>
                <path style={{fill:'#971D2E'}} d="M34.595,462.184c0,27.51,22.307,49.816,49.816,49.816h343.178v-33.211L34.595,462.184z"></path>
                <path style={{fill:'#BE2428'}} d="M427.589,412.368v66.422H84.411c-27.51,0-49.816-7.439-49.816-16.605 c0-27.51,22.307-49.816,49.816-49.816H427.589z"></path>
                <path style={{fill:'#FFD46E'}} d="M427.589,412.368V512c27.51,0,49.816-22.307,49.816-49.816 C477.405,434.674,455.099,412.368,427.589,412.368z"></path>
                <path style={{fill:'#FFE9B7'}} d="M427.589,412.368c9.166,0,16.605,22.307,16.605,49.816c0,27.51-7.439,49.816-16.605,49.816 c-27.51,0-49.816-22.307-49.816-49.816C377.773,434.674,400.08,412.368,427.589,412.368z"></path>
                <path style={{fill:'#EC5123'}} d="M401.939,205.099L353.562,60.355l-18,11.037l-77.99,340.964 c84.876-0.841,153.412-69.898,153.412-154.973C410.984,239.04,407.796,221.439,401.939,205.099z"></path>
                <path style={{fill:'#F27524'}} d="M370.666,205.099c4.594,16.34,7.107,33.941,7.107,52.285c0,84.931-53.669,153.899-120.201,154.973 c-0.52,0.011-1.052,0.011-1.572,0.011c-85.595,0-154.984-69.388-154.984-154.984c0-18.343,3.188-35.945,9.044-52.285l48.377-144.744 l37.772,23.17L256,8.303l59.791,75.222l19.771-12.133L370.666,205.099z"></path>
                <path style={{fill:'#FFD46E'}} d="M325.488,202.475L256,115.053v230.893c48.831,0,88.562-39.731,88.562-88.562 C344.562,237.192,337.953,218.195,325.488,202.475z"></path>
                <path style={{fill:'#FFE9B7'}} d="M299.429,202.475c7.793,15.72,11.923,34.716,11.923,54.909c0,48.831-24.831,88.562-55.351,88.562 c-48.831,0-88.562-39.731-88.562-88.562c0-20.192,6.609-39.189,19.118-54.953L256,115.053L299.429,202.475z"></path>
                <g> <circle style={{fill:'#EC5123'}} cx="444.195" cy="257.384" r="8.303"></circle> <circle style={{fill:'#EC5123'}} cx="315.791" cy="131.371" r="8.303"></circle> </g>
                <g> <circle style={{fill:'#F27524'}} cx="158.438" cy="8.303" r="8.303"></circle> <circle style={{fill:'#F27524'}} cx="67.805" cy="257.384" r="8.303"></circle> <circle style={{fill:'#F27524'}} cx="67.805" cy="224.173" r="8.303"></circle> </g>
                <g> <circle style={{fill:'#FFD46E'}} cx="256" cy="224.173" r="8.303"></circle> <circle style={{fill:'#FFD46E'}} cx="289.211" cy="257.384" r="8.303"></circle> </g>
            </g>
        </g>
    </svg>
);

const STREAK_GOAL_SECONDS = 300; // 5 minutes

interface HeaderProps {
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsLegalModalOpen: (open: boolean) => void;
  setIsTimezoneModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export default function Header({
  setIsCustomizeModalOpen,
  setIsSettingsModalOpen,
  setIsLegalModalOpen,
  setIsTimezoneModalOpen,
  handleToggleFullScreen,
  isFullScreen,
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
  const { isChatSidebarOpen, setIsChatSidebarOpen, chattingWith, ongoingCall, ongoingAudioCall, isPipMode } = useChat();


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

  const weekDays = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, []);

  const weekDaysWithStatus = useMemo(() => {
      if (!streakData) {
          return weekDays.map(day => ({
              dayChar: format(day, 'E').charAt(0),
              isCompleted: false,
          }));
      }
      const completedDaysSet = new Set(streakData.completedDays || []);
      return weekDays.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          if (dfnsIsToday(day)) {
              return {
                  dayChar: format(day, 'E').charAt(0),
                  isCompleted: streakData.todayStreakCompleted,
              };
          }
          return {
              dayChar: format(day, 'E').charAt(0),
              isCompleted: completedDaysSet.has(dayStr),
          };
      });
  }, [weekDays, streakData]);


  const progressPercent = useMemo(() => {
      if (!streakData) return 0;
      return Math.min(100, (streakData.timeSpentToday / STREAK_GOAL_SECONDS) * 100);
  }, [streakData]);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isCallViewActive = (ongoingCall || ongoingAudioCall) && !isPipMode;
  const showMobileSidebarToggle = isMobile && !isCallViewActive;
  const showDesktopSidebarToggle = !isMobile && !isCallViewActive;

  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-black/50 px-4 backdrop-blur-md transition-all duration-300",
        !isMobile && sidebarState === 'expanded' && !isCallViewActive && "md:ml-64",
        !isMobile && sidebarState === 'collapsed' && !isCallViewActive && "md:ml-12"
      )}>
        <div className="flex items-center gap-2">
            {showDesktopSidebarToggle && <SidebarTrigger />}
            {showDesktopSidebarToggle && <div className="h-6 w-px bg-border hidden md:block" />}
            
            {showMobileSidebarToggle && (
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
          
          {streakData && isSubscribed && (
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
                    <div className="relative">
                         {streakData && (
                            <TrophyFlameIcon 
                                isComplete={streakData.todayStreakCompleted} 
                                className="absolute top-2 right-2 h-24 w-24 opacity-30 transform -rotate-12 z-0"
                            />
                        )}
                        <div className="p-4 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Daily Goal
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 h-4">
                                {streakData.insight?.text || "Keep your streak alive!"}
                                </p>
                            </div>

                            <div className="mt-4 p-4 bg-background/50 rounded-xl space-y-4">
                                <div className="flex justify-around">
                                    {weekDaysWithStatus.map(({ dayChar, isCompleted }, index) => (
                                        <div key={index} className="flex flex-col items-center gap-2">
                                            <span className="text-xs font-semibold text-muted-foreground">{dayChar}</span>
                                            <div className="h-7 w-7 rounded-full flex items-center justify-center transition-all">
                                                <DailyFlameIcon isComplete={isCompleted} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2">
                                    <div className="relative h-2 w-full bg-muted/50 rounded-full">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                        >
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3 w-3 rounded-full bg-white border-2 border-accent"></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-accent mt-2 font-mono">
                                        {formatTime(streakData.timeSpentToday || 0)} / {formatTime(STREAK_GOAL_SECONDS)} min
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 bg-background/50 rounded-b-lg">
                            <ContributionGraphCard />
                        </div>
                    </div>
                </PopoverContent>
              </Popover>
          )}

          {isSubscribed && (
            <>
              <Popover open={isExtensionsPopoverOpen} onOpenChange={setIsExtensionsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div onMouseEnter={() => handleMouseEnter('extensions')} onMouseLeave={() => handleMouseLeave('extensions')}>
                        <Button variant="ghost" size="icon">
                            <ExtensionIcon className="h-5 w-5" />
                            <span className="sr-only">Extensions</span>
                        </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent onMouseEnter={() => handleMouseEnter('extensions')} onMouseLeave={() => handleMouseLeave('extensions')} className="w-64 frosted-glass">
                    <div className="space-y-4">
                        <h4 className="font-medium leading-none">Installed Plugins</h4>
                        <div className="space-y-2">
                            {installedPlugins.length > 0 ? (
                               installedPlugins.map(plugin => {
                                  const LogoComponent = plugin.logo;
                                  return (
                                     <button 
                                         key={plugin.name}
                                         onClick={() => handlePluginClick(plugin)}
                                         className="w-full flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted"
                                      >
                                         {typeof LogoComponent === 'string' ? (
                                              <Image src={LogoComponent} alt={`${plugin.name} logo`} width={20} height={20} />
                                          ) : (
                                              <LogoComponent className="h-5 w-5" />
                                          )}
                                         <span>{plugin.name}</span>
                                     </button>
                                  )
                               })
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

              <Popover open={isWidgetPopoverOpen} onOpenChange={setIsWidgetPopoverOpen}>
                <PopoverTrigger asChild>
                  <div onMouseEnter={() => handleMouseEnter('widget')} onMouseLeave={() => handleMouseLeave('widget')}>
                    <Button variant="ghost" size="icon">
                      <WidgetIcon />
                      <span className="sr-only">Widget</span>
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent onMouseEnter={() => handleMouseEnter('widget')} onMouseLeave={() => handleMouseLeave('widget')} className="w-64 frosted-glass">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Widgets</h4>
                    <p className="text-sm text-muted-foreground">No widgets available yet.</p>
                  </div>
                </PopoverContent>
              </Popover>
              
              <NotificationPanel />
            </>
          )}

          <Button variant="ghost" size="icon" onClick={() => setIsChatSidebarOpen(prev => !prev)} className="hidden md:flex">
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

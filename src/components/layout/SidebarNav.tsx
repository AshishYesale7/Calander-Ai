
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  Brain,
  Eye,
  Newspaper,
  Lightbulb,
  LogOut,
  Settings,
  UserCircle,
  Moon,
  Sun,
  Palette,
  Expand,
  Shrink,
  FileText,
  Crown,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { CalendarAiLogo } from '../logo/CalendarAiLogo';
import { Sidebar, useSidebar } from '../ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/career-goals', label: 'Career Goals', icon: Target },
  { href: '/skills', label: 'Skills', icon: Brain },
  { href: '/career-vision', label: 'Career Vision', icon: Eye },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/resources', label: 'Resources', icon: Lightbulb },
  { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
  { href: '/subscription', label: 'Subscription', icon: Crown },
];

interface SidebarNavProps {
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsLegalModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export default function SidebarNav({
  setIsCustomizeModalOpen,
  setIsProfileModalOpen,
  setIsSettingsModalOpen,
  setIsLegalModalOpen,
  handleToggleFullScreen,
  isFullScreen,
}: SidebarNavProps) {
  const pathname = usePathname();
  const { user, subscription } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { state: sidebarState } = useSidebar();

  const daysLeftInTrial = useMemo(() => {
    if (subscription?.status !== 'trial' || !subscription.endDate) return null;
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (endDate < now) return 0; // Trial has expired
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
  
  return (
    <Sidebar collapsible="icon">
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="text-center">
            <div className={cn(
              "flex items-center justify-center gap-2",
              sidebarState === 'collapsed' && 'w-8'
            )}>
              <CalendarAiLogo />
              {sidebarState === 'expanded' && (
                <h1 className="font-headline text-2xl font-semibold text-white">Calendar.ai</h1>
              )}
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                pathname === item.href
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground',
                sidebarState === 'collapsed' && 'justify-center'
              )}
              title={sidebarState === 'collapsed' ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarState === 'expanded' && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          {sidebarState === 'expanded' && subscription?.status === 'trial' && typeof daysLeftInTrial === 'number' && daysLeftInTrial >= 0 && (
            <div className="text-center p-2 mx-2 mb-2 rounded-md bg-accent/10 border border-accent/20">
              <p className="text-sm font-semibold text-accent">{daysLeftInTrial} days left in trial</p>
              <Button size="sm" className="mt-2 w-full h-8 text-xs bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => router.push('/subscription')}>Upgrade</Button>
            </div>
          )}
          <div className="border-t border-sidebar-border -mx-4 mb-4" />
          <Button variant="ghost" onClick={toggleTheme} className={cn("w-full justify-start gap-3 mb-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", sidebarState === 'collapsed' && 'justify-center')}>
            {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {sidebarState === 'expanded' && <span>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</span>}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", sidebarState === 'collapsed' && 'justify-center')}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || 'User'} />
                  <AvatarFallback>
                    {user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle size={20} />}
                  </AvatarFallback>
                </Avatar>
                {sidebarState === 'expanded' && <span className="truncate">{user?.displayName || user?.email}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 frosted-glass">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCustomizeModalOpen(true)}>
                <Palette className="mr-2 h-4 w-4" />
                <span>Customize Theme</span>
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
    </Sidebar>
  );
}

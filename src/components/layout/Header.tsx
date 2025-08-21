
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, UserCircle, LogOut, Settings, Sun, Moon, Palette, Expand, Shrink, FileText, Crown, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
import { useSidebar } from '../ui/sidebar';
import { SidebarTrigger } from '../ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Menu }, 
  { href: '/career-goals', label: 'Career Goals', icon: Menu },
  { href: '/skills', label: 'Skills', icon: Menu },
  { href: '/career-vision', label: 'Career Vision', icon: Menu },
  { href: '/news', label: 'News', icon: Menu },
  { href: '/resources', label: 'Resources', icon: Menu },
  { href: '/tasks', label: 'Tasks', icon: ClipboardCheck },
  { href: '/subscription', label: 'Subscription', icon: Crown },
];

interface HeaderProps {
  setIsCustomizeModalOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsLegalModalOpen: (open: boolean) => void;
  handleToggleFullScreen: () => void;
  isFullScreen: boolean;
}

export default function Header({
  setIsCustomizeModalOpen,
  setIsProfileModalOpen,
  setIsSettingsModalOpen,
  setIsLegalModalOpen,
  handleToggleFullScreen,
  isFullScreen,
}: HeaderProps) {
  const { user, subscription } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { state: sidebarState } = useSidebar();

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
  
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md md:justify-end">
        <div className="flex items-center gap-4 md:hidden">
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
        </div>
        
        <div className="flex items-center gap-4">
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

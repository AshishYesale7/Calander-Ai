
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import SidebarNav from '@/components/layout/SidebarNav';
import Header from '@/components/layout/Header'; // For mobile header
import { TodaysPlanModal } from '@/components/timeline/TodaysPlanModal';
import { Preloader } from '@/components/ui/Preloader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { Command, PanelLeft } from 'lucide-react';
import CustomizeThemeModal from '@/components/layout/CustomizeThemeModal';
import ProfileModal from '@/components/layout/ProfileModal';
import SettingsModal from '@/components/layout/SettingsModal';
import LegalModal from '@/components/layout/LegalModal';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';

function AppContent({ children }: { children: ReactNode }) {
  const { user, loading, isSubscribed } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Lifted state for modals
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else if (!isSubscribed && pathname !== '/subscription') {
        router.push('/subscription');
      }
    }
  }, [user, loading, isSubscribed, router, pathname]);

  // Logic to show modal once per session, ONLY on the dashboard
  useEffect(() => {
    if (!loading && user && isSubscribed && pathname === '/dashboard') {
      const hasSeenModal = sessionStorage.getItem('seenTodaysPlanModal');
      if (!hasSeenModal) {
        setIsPlanModalOpen(true);
        sessionStorage.setItem('seenTodaysPlanModal', 'true');
      }
    }
  }, [user, loading, isSubscribed, pathname]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fullscreen effect
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const { isMobile, state: sidebarState } = useSidebar();

  if (loading || !user || (!isSubscribed && pathname !== '/subscription')) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ backgroundColor: '#15161f' }}>
        <Preloader />
      </div>
    );
  }

  const modalProps = {
    setIsCustomizeModalOpen,
    setIsProfileModalOpen,
    setIsSettingsModalOpen,
    setIsLegalModalOpen,
    handleToggleFullScreen,
    isFullScreen,
  };
  
  const mainContentPadding = isMobile ? '0' : sidebarState === 'expanded' ? '64' : '16';

  return (
    <>
      <div className="flex min-h-screen">
        <SidebarNav {...modalProps} />
        <div className={`flex flex-1 flex-col md:pl-${mainContentPadding}`}> {/* Adjusted pl for md screens and up */}
          <Header {...modalProps} />
          <main className="flex-1 p-6 pb-24 overflow-auto"> {/* Added bottom padding to avoid overlap */}
            {children}
          </main>
        </div>
      </div>
      <TodaysPlanModal isOpen={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onOpenChange={setIsCommandPaletteOpen}
        {...modalProps}
      />
      {/* Mobile Spotlight Trigger (Dynamic Island) */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-border/30 bg-background/50 px-3 py-2 shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 md:hidden"
        aria-label="Open command palette"
      >
        <Command className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Render Modals Here */}
      <CustomizeThemeModal isOpen={isCustomizeModalOpen} onOpenChange={setIsCustomizeModalOpen} />
      <ProfileModal isOpen={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
      <SettingsModal isOpen={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen} />
      <LegalModal isOpen={isLegalModalOpen} onOpenChange={setIsLegalModalOpen} />
    </>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  // We wrap the content in the provider so that `useSidebar` can be used within AppContent
  return (
    <SidebarProvider>
      <AppContent>{children}</AppContent>
    </SidebarProvider>
  )
}


'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PluginProvider } from '@/context/PluginContext';
import { StreakProvider } from '@/context/StreakContext';
import ChatProviderWrapper from '@/context/ChatProviderWrapper';
import AppContent from '@/components/layout/AppContent';
import { useAuth } from '@/context/AuthContext';


export default function AppLayout({ children }: { children: ReactNode }) {
  const { setOnboardingCompleted } = useAuth();
  
  return (
    <SidebarProvider>
        <PluginProvider>
            <StreakProvider>
                <ChatProviderWrapper>
                    <AppContent onFinishOnboarding={() => setOnboardingCompleted(true)}>
                        {children}
                    </AppContent>
                </ChatProviderWrapper>
            </StreakProvider>
        </PluginProvider>
    </SidebarProvider>
  )
}

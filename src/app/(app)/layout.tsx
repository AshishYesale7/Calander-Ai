
'use client';

import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PluginProvider } from '@/context/PluginContext';
import { StreakProvider } from '@/context/StreakContext';
import ChatProviderWrapper from '@/context/ChatProviderWrapper';
import AppContent from '@/components/layout/AppContent';
import { useAuth } from '@/context/AuthContext';


export default function AppLayout({ children }: { children: ReactNode }) {
  const { setOnboardingCompleted } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  const handleToggleWidget = useCallback((id: string) => {
    setHiddenWidgets(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }, []);
  
  return (
    <SidebarProvider>
        <PluginProvider>
            <StreakProvider>
                <ChatProviderWrapper>
                    <AppContent 
                      onFinishOnboarding={() => setOnboardingCompleted(true)}
                      isEditMode={isEditMode}
                      setIsEditMode={setIsEditMode}
                      hiddenWidgets={hiddenWidgets}
                      handleToggleWidget={handleToggleWidget}
                    >
                        {children}
                    </AppContent>
                </ChatProviderWrapper>
            </StreakProvider>
        </PluginProvider>
    </SidebarProvider>
  )
}

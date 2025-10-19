
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useApiKey } from '@/hooks/use-api-key';
import { useTimezone } from '@/hooks/use-timezone';
import { useToast } from '@/hooks/use-toast';
import type { TimelineEvent } from '@/types';
import { useRouter } from 'next/navigation';
import { CommandListContent } from './CommandPalette';
import { saveTimelineEvent } from '@/services/timelineService';
import { Command } from '@/components/ui/command';

interface AiCommandPaletteProps {
  onOpenChange: (isOpen: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  modalProps: any; // Simplified for brevity
  navBarPosition: { x: number; y: number };
  isPaletteAbove: boolean;
}

export default function AiCommandPalette({
  onOpenChange,
  search,
  setSearch,
  modalProps,
  navBarPosition,
  isPaletteAbove,
}: AiCommandPaletteProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { apiKey } = useApiKey();
  const { timezone } = useTimezone();
  const { toast } = useToast();

  const handleCommandSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const handleEventCreation = async (newEventData: Partial<TimelineEvent>) => {
    if (!user) return;
    const newEvent: TimelineEvent = {
        id: `ai-${Date.now()}`,
        title: newEventData.title || 'Untitled Event',
        date: newEventData.date || new Date(),
        type: 'ai_suggestion',
        isDeletable: true,
        status: 'pending',
        priority: 'None',
        reminder: { enabled: true, earlyReminder: '1_day', repeat: 'none' },
        ...newEventData,
    };
    
    const { icon, ...data } = newEvent;
    const payload = { ...data, date: data.date.toISOString(), endDate: data.endDate ? data.endDate.toISOString() : null };
    await saveTimelineEvent(user.uid, payload, { syncToGoogle: false, timezone });
    toast({
        title: "Event Created by AI",
        description: `"${newEvent.title}" has been added to your timeline.`,
    });
    onOpenChange(false);
  };

  const paletteY = isPaletteAbove ? navBarPosition.y - 450 - 10 : navBarPosition.y + 60 + 10;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: isPaletteAbove ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isPaletteAbove ? 20 : -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed z-30 w-[468px] h-[450px] bg-transparent"
      style={{
        top: isPaletteAbove ? navBarPosition.y - 450 - 10 : navBarPosition.y + 48 + 10,
        left: '50%',
        x: '-50%',
      }}
    >
        <div className="bottom-nav-glow open">
            <span className="shine"></span><span className="shine shine-bottom"></span>
            <span className="glow"></span><span className="glow glow-bottom"></span>
            <span className="glow glow-bright"></span><span className="glow glow-bright glow-bottom"></span>
            <div className="inner !p-0">
              <Command>
                <CommandListContent
                    search={search}
                    onSelectCommand={handleCommandSelect}
                    onEventCreation={handleEventCreation}
                    {...modalProps}
                />
              </Command>
            </div>
        </div>
    </motion.div>
  );
}

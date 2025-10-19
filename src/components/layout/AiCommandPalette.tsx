
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Command } from '@/components/ui/command';
import { CommandListContent } from './CommandPalette';

interface AiCommandPaletteProps {
  onOpenChange: (isOpen: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  modalProps: any; // Simplified for brevity
  navBarPosition: { x: number; y: number };
  isPaletteAbove: boolean;
  gap: number;
  paletteHeight: number;
}

export default function AiCommandPalette({
  onOpenChange,
  search,
  setSearch,
  modalProps,
  navBarPosition,
  isPaletteAbove,
  gap,
  paletteHeight,
}: AiCommandPaletteProps) {

  const paletteY = isPaletteAbove
    ? navBarPosition.y - paletteHeight - gap
    : navBarPosition.y + 48 + gap;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: isPaletteAbove ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isPaletteAbove ? 20 : -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed z-30 w-[468px] h-[450px] bg-transparent"
      style={{
        top: paletteY,
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
                    onSelectCommand={(callback) => {
                      onOpenChange(false);
                      callback();
                    }}
                    onEventCreation={() => {}} // Placeholder
                    {...modalProps}
                />
              </Command>
            </div>
        </div>
    </motion.div>
  );
}


'use client';

import { useContext } from 'react';
import { PluginContext } from '@/context/PluginContext';

export const usePlugin = () => {
  const context = useContext(PluginContext);
  if (context === undefined) {
    throw new Error('usePlugin must be used within a PluginProvider');
  }
  return context;
};

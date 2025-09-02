
'use client';

import { useContext } from 'react';
import { TimezoneContext } from '@/context/TimezoneContext';

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

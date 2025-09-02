
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

const TIMEZONE_STORAGE_KEY = 'futuresight-user-timezone';

interface TimezoneContextType {
  timezone: string;
  setTimezone: (tz: string) => void;
  isMounted: boolean;
}

export const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

const getInitialTimezone = (): string => {
  if (typeof window === 'undefined') {
    return 'UTC'; // Default for server-side rendering
  }
  try {
    const storedTz = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (storedTz) {
      return JSON.parse(storedTz);
    }
    // If no stored timezone, detect from browser
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    console.error(`Error reading from localStorage key “${TIMEZONE_STORAGE_KEY}”:`, error);
    return 'UTC';
  }
};

export const TimezoneProvider = ({ children }: { children: ReactNode }) => {
  const [timezone, setTimezoneState] = useState<string>(getInitialTimezone);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setTimezone = useCallback((tz: string) => {
    try {
      if (tz) {
        localStorage.setItem(TIMEZONE_STORAGE_KEY, JSON.stringify(tz));
        setTimezoneState(tz);
        toast({
            title: "Timezone Updated",
            description: `Your timezone has been set to ${tz}.`,
        });
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${TIMEZONE_STORAGE_KEY}”:`, error);
      toast({
        title: "Error",
        description: "Could not save your timezone setting.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  // On initial mount, ensure state is aligned with browser's detected timezone if nothing is stored
  useEffect(() => {
      if (isMounted) {
          const storedTz = localStorage.getItem(TIMEZONE_STORAGE_KEY);
          if (!storedTz) {
              const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
              setTimezoneState(detectedTz);
          }
      }
  }, [isMounted]);

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone, isMounted }}>
      {children}
    </TimezoneContext.Provider>
  );
};

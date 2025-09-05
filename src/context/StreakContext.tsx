
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { usePathname } from 'next/navigation';

interface StreakContextType {
  streakData: StreakData | null;
  setStreakData: Dispatch<SetStateAction<StreakData | null>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // This effect fetches the initial data. It no longer creates it.
  useEffect(() => {
    const fetchStreakData = async () => {
        if (user && pathname !== '/subscription') {
            setIsLoading(true);
            try {
                const data = await getStreakData(user.uid);
                setStreakData(data); // This will be null if user is new
            } catch (error) {
                console.error("Error fetching streak data:", error);
                setStreakData(null);
            } finally {
                setIsLoading(false);
            }
        } else {
            // No user or on subscription page, so not loading and no data.
            setIsLoading(false);
            setStreakData(null);
        }
    };

    fetchStreakData();
  }, [user, pathname]);
  

  return (
    <StreakContext.Provider value={{ streakData, setStreakData, isLoading, setIsLoading }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = (): StreakContextType => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};

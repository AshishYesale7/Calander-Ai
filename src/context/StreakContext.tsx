
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { usePathname } from 'next/navigation';

interface StreakContextType {
  streakData: StreakData | null;
  isLoading: boolean;
}

export const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const incrementStreakOnRefresh = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const existingStreakData = await getStreakData(userId);
      let newStreak = 1;
      let longestStreak = 1;

      if (existingStreakData) {
          newStreak = (existingStreakData.currentStreak || 0) + 1;
          longestStreak = Math.max(existingStreakData.longestStreak || 0, newStreak);
      }

      const updatePayload: Partial<StreakData> = {
          currentStreak: newStreak,
          longestStreak: longestStreak,
          lastActivityDate: new Date(),
      };
      
      await updateStreakData(userId, updatePayload);
      // After updating, fetch the latest data to set the state
      const finalData = await getStreakData(userId);
      setStreakData(finalData);

    } catch (error) {
      console.error("Error incrementing streak on refresh:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (user && pathname !== '/subscription') {
      incrementStreakOnRefresh(user.uid);
    } else {
        setIsLoading(false);
    }
  }, [user, pathname, incrementStreakOnRefresh]);


  return (
    <StreakContext.Provider value={{ streakData, isLoading }}>
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


'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getStreakData, updateStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { usePathname } from 'next/navigation';
import { useStreakTracker } from '@/hooks/useStreakTracker';

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

  // This effect fetches the initial data or creates it for a new user
  useEffect(() => {
    const initializeStreak = async () => {
        if (user && pathname !== '/subscription') {
            setIsLoading(true);
            try {
                let data = await getStreakData(user.uid);
                if (!data) {
                    // First time user, create a new streak record
                    const newStreakData: StreakData = {
                        currentStreak: 0,
                        longestStreak: 0,
                        lastActivityDate: new Date(),
                        timeSpentToday: 0,
                        todayStreakCompleted: false,
                    };
                    await updateStreakData(user.uid, newStreakData);
                    data = newStreakData;
                }
                setStreakData(data);
            } catch (error) {
                console.error("Error initializing streak data:", error);
                setStreakData(null);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            setStreakData(null);
        }
    };

    initializeStreak();
  }, [user, pathname]);
  
  // Initialize the tracker hook, which contains the setInterval logic
  useStreakTracker();

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

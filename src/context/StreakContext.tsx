
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';

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

  // This effect fetches the initial data when the component mounts or the user changes.
  useEffect(() => {
    const fetchStreakData = async () => {
        if (user) {
            setIsLoading(true);
            try {
                // Always get the latest from Firestore on load.
                const data = await getStreakData(user.uid);
                setStreakData(data);
            } catch (error) {
                console.error("Error fetching streak data:", error);
                setStreakData(null);
            } finally {
                setIsLoading(false);
            }
        } else {
            // No user, so reset state
            setIsLoading(false);
            setStreakData(null);
        }
    };

    fetchStreakData();
  }, [user]);
  

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

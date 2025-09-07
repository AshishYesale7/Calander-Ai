
'use client';

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getStreakData } from '@/services/streakService';
import type { StreakData } from '@/types';
import { onSnapshot, type Timestamp } from 'firebase/firestore';
import { getStreakDocRef } from '@/services/streakService';


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
    if (user) {
        setIsLoading(true);
        const streakDocRef = getStreakDocRef(user.uid);
        
        // Set up a real-time listener
        const unsubscribe = onSnapshot(streakDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const processedData: StreakData = {
                    currentStreak: data.currentStreak || 0,
                    longestStreak: data.longestStreak || 0,
                    lastActivityDate: data.lastActivityDate ? (data.lastActivityDate as Timestamp).toDate() : new Date(),
                    timeSpentToday: data.timeSpentToday || 0,
                    timeSpentTotal: data.timeSpentTotal || 0,
                    todayStreakCompleted: data.todayStreakCompleted || false,
                    insight: data.insight || undefined,
                    completedDays: data.completedDays || [],
                };
                setStreakData(processedData);
            } else {
                // If the document doesn't exist, it means it's a new user.
                // The getStreakData function will create the document on the server.
                getStreakData(user.uid).then(setStreakData);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to streak data:", error);
            setIsLoading(false);
            setStreakData(null);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    } else {
        // No user, so reset state
        setIsLoading(false);
        setStreakData(null);
    }
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

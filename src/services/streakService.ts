
'use server';
import { db } from '@/lib/firebase';
import type { StreakData, LeaderboardUser } from '@/types';
import { collection, doc, getDoc, setDoc, Timestamp, getDocs, query, orderBy, limit, updateDoc, increment } from 'firebase/firestore';
import { getUserProfile } from './userService';

const getStreakDocRef = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return doc(db, 'streaks', userId);
};

export const getStreakData = async (userId: string): Promise<StreakData> => {
  const streakDocRef = getStreakDocRef(userId);
  try {
    const docSnap = await getDoc(streakDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastActivityDate: data.lastActivityDate ? (data.lastActivityDate as Timestamp).toDate() : new Date(),
        timeSpentToday: data.timeSpentToday || 0,
        timeSpentTotal: data.timeSpentTotal || 0,
        todayStreakCompleted: data.todayStreakCompleted || false,
        insight: data.insight || undefined,
        completedDays: data.completedDays || [],
      };
    } else {
      const newStreakData: StreakData = {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          timeSpentToday: 0,
          timeSpentTotal: 0,
          todayStreakCompleted: false,
          completedDays: [],
      };
      await setDoc(streakDocRef, { 
        ...newStreakData,
        lastActivityDate: Timestamp.fromDate(newStreakData.lastActivityDate)
      });
      return newStreakData;
    }
  } catch (error) {
    console.error("Failed to get streak data from Firestore:", error);
    throw new Error("Could not retrieve streak data.");
  }
};

export const updateStreakData = async (userId: string, data: Partial<StreakData>): Promise<void> => {
  const streakDocRef = getStreakDocRef(userId);
  
  const dataToSave: { [key: string]: any } = { ...data };
  
  if (data.lastActivityDate) {
      dataToSave.lastActivityDate = Timestamp.fromDate(data.lastActivityDate);
  }
  
  try {
    await setDoc(streakDocRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Failed to update streak data in Firestore:", error);
    throw new Error("Could not update streak data.");
  }
};

/**
 * Atomically increments the total time spent for a user.
 */
export const addTimeToTotal = async (userId: string, timeToAdd: number): Promise<void> => {
    if (!userId || timeToAdd <= 0) return;
    const streakDocRef = getStreakDocRef(userId);
    try {
        await updateDoc(streakDocRef, {
            timeSpentTotal: increment(timeToAdd)
        });
    } catch (error) {
        // If the document doesn't exist, it might be a new user. Create it.
        const docSnap = await getDoc(streakDocRef);
        if (!docSnap.exists()) {
             await updateStreakData(userId, { timeSpentTotal: timeToAdd });
        } else {
            console.error(`Failed to increment time for user ${userId}:`, error);
        }
    }
};

export const getLeaderboardData = async (): Promise<LeaderboardUser[]> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }

    const streaksCollectionRef = collection(db, 'streaks');
    
    const q = query(streaksCollectionRef, orderBy('timeSpentTotal', 'desc'), limit(50));
    
    try {
        const streakSnapshot = await getDocs(q);
        
        const leaderboardPromises = streakSnapshot.docs.map(async (streakDoc) => {
            const streakData = streakDoc.data() as Partial<StreakData>;
            const userId = streakDoc.id;
            
            const userProfile = await getUserProfile(userId);
            
            const timeSpentForRank = (streakData.timeSpentTotal || 0);
            
            if (userProfile) {
                return {
                    id: userId,
                    displayName: userProfile.displayName || 'Anonymous User',
                    photoURL: userProfile.photoURL,
                    currentStreak: streakData.currentStreak || 0,
                    longestStreak: streakData.longestStreak || 0,
                    timeSpentTotal: timeSpentForRank,
                    statusEmoji: userProfile.statusEmoji,
                    countryCode: userProfile.countryCode,
                };
            }
            return {
                id: userId,
                displayName: 'Anonymous User',
                photoURL: undefined,
                currentStreak: streakData.currentStreak || 0,
                longestStreak: streakData.longestStreak || 0,
                timeSpentTotal: timeSpentForRank,
                statusEmoji: undefined,
                countryCode: undefined,
            };
        });
        
        const leaderboard = (await Promise.all(leaderboardPromises)).filter(u => u !== null) as LeaderboardUser[];
        
        return leaderboard.sort((a,b) => b.timeSpentTotal - a.timeSpentTotal);

    } catch (error) {
        console.error("Failed to get leaderboard data from Firestore:", error);
        return [];
    }
};

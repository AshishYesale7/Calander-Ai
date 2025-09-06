
'use server';
import { db } from '@/lib/firebase';
import type { StreakData, LeaderboardUser } from '@/types';
import { collection, doc, getDoc, setDoc, Timestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getUserProfile } from './userService';

const getStreakDocRef = (userId: string) => {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  return doc(db, 'streaks', userId);
};

export const getStreakData = async (userId: string): Promise<StreakData | null> => {
  const streakDocRef = getStreakDocRef(userId);
  try {
    const docSnap = await getDoc(streakDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastActivityDate: (data.lastActivityDate as Timestamp).toDate(),
        completedDays: data.completedDays || [],
        timeSpentTotal: data.timeSpentTotal || 0,
      } as StreakData;
    }
    return null;
  } catch (error) {
    console.error("Failed to get streak data from Firestore:", error);
    throw new Error("Could not retrieve streak data.");
  }
};

export const updateStreakData = async (userId: string, data: Partial<StreakData>): Promise<void> => {
  const streakDocRef = getStreakDocRef(userId);
  
  const dataToSave: any = { ...data };
  if (data.lastActivityDate) {
      dataToSave.lastActivityDate = Timestamp.fromDate(data.lastActivityDate);
  }
  
  if (data.insight) {
    dataToSave.insight = {
        text: data.insight.text,
        date: data.insight.date,
        lastUpdatedStreak: data.insight.lastUpdatedStreak
    };
  }

  if (data.completedDays) {
      dataToSave.completedDays = data.completedDays;
  }
  
  if (data.timeSpentTotal !== undefined) {
      dataToSave.timeSpentTotal = data.timeSpentTotal;
  }

  try {
    await setDoc(streakDocRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Failed to update streak data in Firestore:", error);
    throw new Error("Could not update streak data.");
  }
};

export const getLeaderboardData = async (): Promise<LeaderboardUser[]> => {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }

    const streaksCollectionRef = collection(db, 'streaks');
    
    // The leaderboard is now ranked by the cumulative 'timeSpentTotal'
    const q = query(streaksCollectionRef, orderBy('timeSpentTotal', 'desc'), limit(50));
    
    try {
        const streakSnapshot = await getDocs(q);
        
        const leaderboardPromises = streakSnapshot.docs.map(async (streakDoc) => {
            const streakData = streakDoc.data();
            const userId = streakDoc.id;
            
            const userProfile = await getUserProfile(userId);
            
            // Use timeSpentTotal for the leaderboard display
            const timeSpentForRank = (streakData.timeSpentTotal || 0) + (streakData.timeSpentToday || 0);
            
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
            };
        });
        
        const leaderboard = (await Promise.all(leaderboardPromises)).filter(u => u !== null) as LeaderboardUser[];
        
        // Final sort on the combined data just in case
        return leaderboard.sort((a,b) => b.timeSpentTotal - a.timeSpentTotal);

    } catch (error) {
        console.error("Failed to get leaderboard data from Firestore:", error);
        return [];
    }
};

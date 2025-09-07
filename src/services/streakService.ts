
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
      // Ensure all fields are correctly typed, providing defaults for new fields
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
      // If the document does not exist, this is a new user for streak tracking.
      // Create and save a new default streak record for them.
      const newStreakData: StreakData = {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
          timeSpentToday: 0,
          timeSpentTotal: 0,
          todayStreakCompleted: false,
          completedDays: [],
      };
      await updateStreakData(userId, newStreakData); // Save the new record
      return newStreakData; // Return the newly created data
    }
  } catch (error) {
    console.error("Failed to get streak data from Firestore:", error);
    throw new Error("Could not retrieve streak data.");
  }
};

export const updateStreakData = async (userId: string, data: Partial<StreakData>): Promise<void> => {
  const streakDocRef = getStreakDocRef(userId);
  
  // Create a mutable copy to avoid modifying the original object
  const dataToSave: { [key: string]: any } = { ...data };
  
  // Convert any Date objects to Firestore Timestamps before saving
  if (data.lastActivityDate) {
      dataToSave.lastActivityDate = Timestamp.fromDate(data.lastActivityDate);
  }
  
  try {
    // Using merge: true ensures we only update the fields provided
    // and don't overwrite the entire document.
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
            const streakData = streakDoc.data() as Partial<StreakData>;
            const userId = streakDoc.id;
            
            const userProfile = await getUserProfile(userId);
            
            // The XP for ranking should be the total time up to the current point.
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
            // Return a default object if profile doesn't exist, though it should.
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
        
        // Sort again on the client side to ensure the final calculated XP is ranked correctly.
        return leaderboard.sort((a,b) => b.timeSpentTotal - a.timeSpentTotal);

    } catch (error) {
        console.error("Failed to get leaderboard data from Firestore:", error);
        return [];
    }
};

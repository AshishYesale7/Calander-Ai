
'use server';
import { db } from '@/lib/firebase';
import type { StreakData, LeaderboardUser } from '@/types';
import { collection, doc, getDoc, setDoc, Timestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

  try {
    // Using merge: true ensures we only update the provided fields
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
    const usersCollectionRef = collection(db, 'users');
    
    // Query streaks collection, order by currentStreak descending, and limit to top 50
    const q = query(streaksCollectionRef, orderBy('currentStreak', 'desc'), limit(50));
    
    try {
        const streakSnapshot = await getDocs(q);
        
        const leaderboard: LeaderboardUser[] = [];
        
        for (const streakDoc of streakSnapshot.docs) {
            const streakData = streakDoc.data() as Omit<StreakData, 'lastActivityDate'>;
            const userId = streakDoc.id;
            
            const userDocRef = doc(usersCollectionRef, userId);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                leaderboard.push({
                    id: userId,
                    displayName: userData.displayName || 'Anonymous User',
                    photoURL: userData.photoURL,
                    currentStreak: streakData.currentStreak,
                    longestStreak: streakData.longestStreak,
                });
            }
        }
        
        return leaderboard;
    } catch (error) {
        console.error("Failed to get leaderboard data from Firestore:", error);
        throw new Error("Could not retrieve leaderboard data.");
    }
};

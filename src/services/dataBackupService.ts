
'use server';

import { db } from '@/lib/firebase';
import type { CareerGoal, Skill, CareerVisionHistoryItem, TrackedKeyword, ResourceLink, TimelineEvent, UserPreferences, StreakData } from '@/types';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// Import all necessary service functions
import { getCareerGoals, saveCareerGoal } from './careerGoalsService';
import { getSkills, saveSkill } from './skillsService';
import { getCareerVisionHistory, saveCareerVision } from './careerVisionService';
import { getTrackedKeywords, saveTrackedKeyword } from './deadlineTrackerService';
import { getBookmarkedResources, saveBookmarkedResource } from './resourcesService';
import { getTimelineEvents, saveTimelineEvent } from './timelineService';
import { getStreakData, updateStreakData } from './streakService';
import { getUserProfile, saveUserPreferences } from './userService';

// Define the structure of the backup file
interface UserDataBackup {
    profile: Partial<UserPreferences>; 
    careerGoals: CareerGoal[];
    skills: Skill[];
    careerVisions: CareerVisionHistoryItem[];
    trackedKeywords: TrackedKeyword[];
    resources: ResourceLink[];
    timelineEvents: TimelineEvent[];
    streakData: StreakData | null;
}

/**
 * Gathers all user data from various services and prepares it for export.
 */
export const exportUserData = async (userId: string): Promise<UserDataBackup> => {
    const [
        profileData,
        careerGoals,
        skills,
        careerVisions,
        trackedKeywords,
        resources,
        timelineEvents,
        streakData,
    ] = await Promise.all([
        getUserProfile(userId),
        getCareerGoals(userId),
        getSkills(userId),
        getCareerVisionHistory(userId),
        getTrackedKeywords(userId),
        getBookmarkedResources(userId),
        getTimelineEvents(userId),
        getStreakData(userId),
    ]);
    
    // Explicitly remove the uid from the profile object before exporting.
    const { uid, ...profile } = profileData || {};

    // Filter out non-native timeline events to avoid syncing issues
    const nativeTimelineEvents = timelineEvents.filter(event => !event.googleEventId);

    return {
        profile: profile || {},
        careerGoals,
        skills,
        careerVisions,
        trackedKeywords,
        resources,
        timelineEvents: nativeTimelineEvents,
        streakData,
    };
};

/**
 * Imports user data from a backup object and saves it to Firestore.
 * This will overwrite existing data.
 */
export const importUserData = async (userId: string, data: UserDataBackup): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized.");

    // --- Clear existing data before import ---
    const collectionsToClear = [
        'careerGoals', 'skills', 'careerVisions', 
        'trackedKeywords', 'resources', 'timelineEvents'
    ];
    
    const clearBatch = writeBatch(db);
    for (const collectionName of collectionsToClear) {
        const collectionRef = collection(db, 'users', userId, collectionName);
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach(doc => clearBatch.delete(doc.ref));
    }
    await clearBatch.commit();
    
    const importPromises = [];

    // Selectively import only the weekly routine from preferences, not the whole profile
    if (data.profile && data.profile.routine) {
        importPromises.push(saveUserPreferences(userId, { routine: data.profile.routine }));
    }

    // Import Career Goals
    if (data.careerGoals) {
        data.careerGoals.forEach(goal => {
            const goalToSave = { ...goal, deadline: goal.deadline ? new Date(goal.deadline).toISOString() : null };
            importPromises.push(saveCareerGoal(userId, goalToSave));
        });
    }

    // Import Skills
    if (data.skills) {
        data.skills.forEach(skill => {
            const skillToSave = { ...skill, lastUpdated: new Date(skill.lastUpdated).toISOString() };
            importPromises.push(saveSkill(userId, skillToSave));
        });
    }

    // Import Career Visions
    if (data.careerVisions) {
        data.careerVisions.forEach(vision => {
            importPromises.push(saveCareerVision(userId, vision.prompt, vision.plan));
        });
    }

    // Import Tracked Keywords (News)
    if (data.trackedKeywords) {
        data.trackedKeywords.forEach(keyword => {
            importPromises.push(saveTrackedKeyword(userId, keyword.keyword, keyword.deadlines, keyword.summary));
        });
    }

    // Import Resources
    if (data.resources) {
        data.resources.forEach(resource => {
            importPromises.push(saveBookmarkedResource(userId, resource));
        });
    }
    
    // Import Timeline Events
    if (data.timelineEvents) {
        data.timelineEvents.forEach(event => {
             const eventToSave = {
                ...event,
                date: new Date(event.date).toISOString(),
                endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
                deletedAt: event.deletedAt ? new Date(event.deletedAt).toISOString() : null,
            };
            // Sync to Google is false by default for imports to prevent conflicts
            importPromises.push(saveTimelineEvent(userId, eventToSave as any, { syncToGoogle: false, timezone: 'UTC' }));
        });
    }

    // Import Streak Data
    if (data.streakData) {
        const streakToSave = { ...data.streakData, lastActivityDate: new Date(data.streakData.lastActivityDate) };
        importPromises.push(updateStreakData(userId, streakToSave));
    }

    await Promise.all(importPromises);
};


/**
 * Deletes all user-generated content from subcollections and resets specific user document fields,
 * but preserves the user account and subscription status.
 */
export async function formatUserData(userId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");

    const batch = writeBatch(db);

    const collectionsToClear = [
        'activityLogs',
        'careerGoals',
        'careerVisions',
        'dailyPlans',
        'fcmTokens',
        'notifications',
        'resources',
        'skills',
        'timelineEvents',
        'trackedKeywords',
    ];

    // 1. Delete all documents in subcollections
    for (const collectionName of collectionsToClear) {
        const collectionRef = collection(db, 'users', userId, collectionName);
        const snapshot = await getDocs(collectionRef);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }

    // 2. Delete the separate streak document
    const streakDocRef = doc(db, 'streaks', userId);
    batch.delete(streakDocRef);

    // 3. Reset fields on the main user document
    const userDocRef = doc(db, 'users', userId);
    batch.update(userDocRef, {
        bio: '',
        'socials.github': '',
        'socials.linkedin': '',
        'socials.twitter': '',
        statusEmoji: null,
        countryCode: null,
        coverPhotoURL: null,
        geminiApiKey: null,
        installedPlugins: [],
        'preferences.routine': [],
        codingUsernames: {},
    });

    await batch.commit();
}

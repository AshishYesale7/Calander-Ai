
'use server';

import { db } from '@/lib/firebase';
import type { CareerGoal, Skill, CareerVisionHistoryItem, TrackedKeyword, ResourceLink, TimelineEvent, UserPreferences, StreakData } from '@/types';

// Import all necessary service functions
import { getCareerGoals, saveCareerGoal } from './careerGoalsService';
import { getSkills, saveSkill } from './skillsService';
import { getCareerVisionHistory, saveCareerVision } from './careerVisionService';
import { getTrackedKeywords, saveTrackedKeyword } from './deadlineTrackerService';
import { getBookmarkedResources, saveBookmarkedResource } from './resourcesService';
import { getTimelineEvents, saveTimelineEvent } from './timelineService';
import { getStreakData, updateStreakData } from './streakService';
import { getUserProfile, updateUserProfile } from './userService';

// Define the structure of the backup file
interface UserDataBackup {
    profile: any; // Using 'any' because getUserProfile returns a complex object
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
        profile,
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
    
    // Filter out non-native timeline events
    const nativeTimelineEvents = timelineEvents.filter(event => !event.googleEventId);

    return {
        profile,
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
    // We'll wrap these in Promise.all to run them concurrently.
    const importPromises = [];

    // Import Profile (excluding fields managed by other services)
    if (data.profile) {
        const { routine, ...profileData } = data.profile;
        importPromises.push(updateUserProfile(userId, profileData));
        if (routine) {
            importPromises.push(updateUserProfile(userId, { preferences: { routine } } as any));
        }
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
            // Assuming the user doesn't want to sync imported events to Google by default
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

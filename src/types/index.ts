

'use server';

import type { LucideIcon } from 'lucide-react';
import type { GenerateCareerVisionOutput } from '@/ai/flows/career-vision-flow';
import type { GenerateAvatarOutput } from '@/components/profile/CustomizeAvatarModal';

export interface SocialLinks {
    github?: string;
    linkedin?: string;
    twitter?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  coverPhotoURL: string | null;
  bio: string;
  socials: SocialLinks | null;
  statusEmoji: string | null;
  countryCode: string | null;
  followersCount: number;
  followingCount: number;
  routine: RoutineItem[];
  onboardingCompleted: boolean;
  deletionStatus?: 'PENDING_DELETION' | 'DELETED';
  deletionScheduledAt?: string; // Add this to track when the deletion is scheduled
  userType?: 'student' | 'professional' | null; // New field for user role
}


export interface RoutineItem {
  id: string;
  activity: string;
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  days: number[];    // Array of numbers 0-6 (Sun-Sat)
}

export interface UserPreferences {
  routine: RoutineItem[];
}

export type EarlyReminder = 'none' | 'on_day' | '1_day' | '2_days' | '1_week';
export type RepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface EventReminder {
  enabled: boolean;
  earlyReminder: EarlyReminder;
  repeat: RepeatFrequency;
  repeatEndDate?: string | null;
}


export interface TimelineEvent {
  id: string;
  date: Date; // Start date and time
  endDate?: Date; // End date and time, optional
  title: string;
  type: 'exam' | 'deadline' | 'goal' | 'project' | 'application' | 'custom' | 'ai_suggestion';
  notes?: string;
  url?: string; // Main URL for the event
  tags?: string; // Space-separated list of tags, e.g., "#internship #dsa"
  location?: string;
  priority?: 'None' | 'Low' | 'Medium' | 'High';
  imageUrl?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'missed';
  icon?: LucideIcon | React.ElementType;
  isDeletable?: boolean;
  isAllDay?: boolean; // Flag for all-day events
  color?: string; // Optional custom color for the event
  reminder: EventReminder; // Updated reminder settings
  googleEventId?: string; // ID of the event in Google Calendar
  microsoftEventId?: string; // ID of the event in Microsoft Calendar
  googleTaskId?: string; // ID of the event in Google Tasks
  deletedAt?: Date; // For soft deletes
  links?: { title: string; url: string }[];
}

export interface AppNotification {
  id: string;
  type: 'new_follower' | 'event_reminder' | 'system_alert';
  message: string;
  link?: string; // e.g., to a user profile or event
  imageUrl?: string | null; // URL of the user/event image
  isRead: boolean;
  createdAt: Date;
}


export interface CareerGoal {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  deadline?: Date;
}

export interface Skill {
  id: string;
  name: string;
  category: 'DSA' | 'OS' | 'DBMS' | 'AI' | 'WebDev' | 'MobileDev' | 'Other';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  lastUpdated: Date;
  learningResources?: { title: string; url: string }[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedDate: Date;
  imageUrl?: string;
  tags?: string[];
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'book' | 'course' | 'tool' | 'article' | 'community' | 'website' | 'other';
  isAiRecommended?: boolean;
}

export interface TodaysPlan {
  schedule: { time: string; activity: string }[];
  microGoals: string[];
}

export interface DailyPlanScheduleItem {
  id: string;
  time: string;
  activity: string;
  status: 'pending' | 'completed' | 'missed';
}

export interface DailyPlan {
  schedule: DailyPlanScheduleItem[];
  microGoals: string[];
  reminders: string[];
  motivationalQuote: string;
}

export interface RawCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDateTime: string; 
  endDateTime: string; 
  htmlLink?: string;
}

export interface RawGoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string; 
  status: 'needsAction' | 'completed';
  link?: string;
  updated: string;
}

export interface RawGmailMessage {
  id: string;
  subject: string;
  snippet: string;
  internalDate: string; 
  link?: string;
}

export interface GmailLabel {
  id: string;
  name: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

export interface ActionableInsight {
  id:string; 
  googleEventId?: string; 
  googleTaskId?: string; 
  title: string;
  date: string; 
  endDate?: string; 
  isAllDay?: boolean; 
  summary: string;
  source: 'google_calendar' | 'gmail' | 'google_tasks';
  originalLink?: string;
}

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'trial';

export interface UserSubscription {
  plan?: 'monthly' | 'yearly';
  status: SubscriptionStatus;
  endDate: Date;
  razorpaySubscriptionId?: string;
}

export interface CareerVisionHistoryItem {
  id: string;
  prompt: string;
  plan: GenerateCareerVisionOutput;
  createdAt: Date;
}

export interface SourceLink {
    title: string;
    url: string;
}

export interface DeadlineItem {
    date: string; 
    title: string;
    description: string;
    category: 'Exam' | 'Internship' | 'Job' | 'Other';
    sourceLinks?: SourceLink[];
}

export interface TrackedKeyword {
    id: string;
    keyword: string;
    deadlines: DeadlineItem[];
    createdAt: Date;
    summary?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  type: 'message'; // Differentiator
  isDeleted?: boolean; // For soft deletes for everyone
  isEdited?: boolean;
  deletedFor?: string[]; // Array of user IDs for whom the message is deleted
}

export type CallStatus = 'ringing' | 'answered' | 'declined' | 'ended';
export type CallType = 'video' | 'audio';

export interface CallData {
  id: string;
  callerId: string;
  callerName: string;
  callerPhotoURL: string | null;
  receiverId: string;
  status: CallStatus;
  callType: CallType; 
  createdAt: any;
  ringingAt?: any; // Add ringingAt timestamp
  endedAt?: any;
  duration?: number; // in seconds
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  type: 'call'; // Differentiator
  timestamp: Date;
  
  // For mute status on the shared signaling document
  callerMutedAudio?: boolean;
  callerMutedVideo?: boolean;
  receiverMutedAudio?: boolean;
  receiverMutedVideo?: boolean;

  // For duplicated user-specific history records
  otherUser?: {
    uid: string;
    displayName: string;
    photoURL: string | null;
  };
}


export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    timeSpentToday: number;
    timeSpentTotal: number;
    todayStreakCompleted: boolean;
    insight?: {
        text: string;
        date: string; 
        lastUpdatedStreak: number;
    };
    completedDays: string[]; 
}

export interface LeaderboardUser {
    id: string;
    displayName: string;
    username: string;
    photoURL?: string | null;
    currentStreak: number;
    longestStreak: number;
    timeSpentTotal: number;
    statusEmoji?: string;
    countryCode?: string;
}

export interface UserDataBackup {
    profile: Partial<UserPreferences>;
    careerGoals: CareerGoal[];
    skills: Skill[];
    careerVisions: CareerVisionHistoryItem[];
    trackedKeywords: TrackedKeyword[];
    resources: ResourceLink[];
    timelineEvents: TimelineEvent[];
    streakData: StreakData | null;
}

export interface CodingActivity {
    date: Date;
    count: number;
}
export interface PlatformStats {
    id: string;
    name: 'LeetCode' | 'Codeforces' | 'HackerRank' | 'Other';
    username: string;
    problemsSolved: number;
    contests: number;
}
export interface ActivityLog {
  id: string;
  userId: string;
  type: 
    // Goals
    'goal_added' | 
    'goal_updated' | 
    'goal_completed' |
    'goal_deleted' |
    // Skills
    'skill_added' |
    'skill_updated' |
    'skill_deleted' |
    // Events
    'task_completed' |
    'event_created' |
    'event_deleted' |
    // Resources
    'resource_bookmarked' |
    'resource_deleted' |
    // AI
    'vision_generated' |
    'plan_generated' |
    // Autonomous Events
    'google_event_synced' |
    'google_task_synced' |
    'notification_sent' |
    // Plugin Events
    'codefolio_stats_fetched'
  ;
  timestamp: Date;
  details: {
    // Shared
    title?: string;
    id?: string;
    // Goal/Skill specific
    progress?: number;
    proficiency?: string;
    // Vision specific
    prompt?: string;
    // Codefolio specific
    platforms?: string[];
  }
}

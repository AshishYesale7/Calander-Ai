
'use server';

import type { LucideIcon } from 'lucide-react';
import type { GenerateCareerVisionOutput } from '@/ai/flows/career-vision-flow';

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
  googleTaskId?: string; // ID of the event in Google Tasks
  deletedAt?: Date; // For soft deletes
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

// Type for a single item in the AI-generated daily plan schedule
export interface DailyPlanScheduleItem {
  id: string;
  time: string;
  activity: string;
  status: 'pending' | 'completed' | 'missed';
}

// AI-Generated Daily Plan
export interface DailyPlan {
  schedule: DailyPlanScheduleItem[];
  microGoals: string[];
  reminders: string[];
  motivationalQuote: string;
}

// Types for Google Data Processing Flow
export interface RawCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601 format, should include time
  endDateTime: string; // ISO 8601 format, should include time
  htmlLink?: string;
}

export interface RawGoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string; // ISO 8601 date string, e.g., "2024-05-30T00:00:00.000Z"
  status: 'needsAction' | 'completed';
  link?: string;
  updated: string;
}

export interface RawGmailMessage {
  id: string;
  subject: string;
  snippet: string;
  internalDate: string; // epoch milliseconds string
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
  id:string; // e.g., 'cal:original_event_id' or 'task:original_task_id'
  googleEventId?: string; // The original, unmodified event ID from the Google Calendar API.
  googleTaskId?: string; // The original, unmodified task ID from the Google Tasks API.
  title: string;
  date: string; // ISO 8601 format, should include time (start time for events)
  endDate?: string; // ISO 8601 format, end time for events, optional
  isAllDay?: boolean; // Optional flag for all-day events
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
    date: string; // ISO 8601 format
    title: string;
    description: string;
    category: 'Exam' | 'Internship' | 'Job' | 'Other';
    sourceLinks?: SourceLink[];
}

// New type for storing tracked keywords
export interface TrackedKeyword {
    id: string;
    keyword: string;
    deadlines: DeadlineItem[];
    createdAt: Date;
    summary?: string;
}

// New type for conversational AI
export interface ChatMessage {
    role: 'user' | 'model' | 'tool';
    content: string;
}

// New types for Codefolio feature
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
  type: 'goal_completed' | 'task_completed';
  timestamp: Date;
  details: {
    title: string;
  }
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    timeSpentToday: number; // in seconds
    todayStreakCompleted: boolean;
    insight?: string; // AI-generated insight for the day
    completedDays: string[]; // Array of 'YYYY-MM-DD' strings
}

export interface LeaderboardUser {
    id: string;
    displayName: string;
    photoURL?: string;
    currentStreak: number;
    longestStreak: number;
    prevRank?: number;
}

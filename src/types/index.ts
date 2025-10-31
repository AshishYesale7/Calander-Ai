
import type { LucideIcon } from 'lucide-react';
import { z } from 'genkit';

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

export const GenerateCareerVisionOutputSchema = z.object({
  visionStatement: z.string().describe("A compelling, single-paragraph career vision statement based on the user's input."),
  keyStrengths: z.array(z.string()).describe("A list of 3-5 key strengths identified from the user's input."),
  developmentAreas: z.object({
    technical: z.array(z.string()).describe("A list of 3-5 key technical skills to develop (e.g., programming languages, frameworks, tools)."),
    soft: z.array(z.string()).describe("A list of 2-4 key soft skills to develop (e.g., communication, teamwork, leadership)."),
    hard: z.array(z.string()).describe("A list of 2-3 key hard skills (non-technical but tangible skills) to develop (e.g., project management, data analysis, public speaking).")
  }).describe("A breakdown of skills to develop, categorized into technical, soft, and hard skills."),
  roadmap: z.array(z.object({
    step: z.number().describe("The step number in the roadmap."),
    title: z.string().describe("A concise title for this step."),
    description: z.string().describe("A one-sentence description of what to do in this step."),
    duration: z.string().describe("An estimated duration for this step (e.g., '1-3 months', '6 weeks').")
  })).describe("A 3-5 step actionable roadmap to start working towards the vision."),
  suggestedResources: z.array(z.object({
    title: z.string().describe("The name of the resource."),
    url: z.string().describe("A direct URL to the resource."),
    description: z.string().describe("A brief, one-sentence explanation of why this resource is useful for the user's specific goals."),
    category: z.enum(['book', 'course', 'tool', 'article', 'community', 'website', 'other']).describe("The category of the resource.")
  })).describe("A list of 2-4 highly relevant online resources, like courses, communities, or tools. Ensure the links are specific and deep where possible."),
  diagramSuggestion: z.object({
      type: z.enum(['Flowchart', 'Mind Map', 'Timeline', 'Bar Chart']).describe("The type of diagram suggested. You must select 'Bar Chart'."),
      description: z.string().describe("A brief description of what the diagram should visualize to help the user understand their career path."),
      data: z.array(z.object({
          name: z.string().describe("The name of the data point, corresponding to a roadmap step title."),
          durationMonths: z.number().describe("The average estimated duration for the step, converted to months. E.g., '1-3 months' is 2, '6 weeks' is 1.5, '1 year' is 12."),
      })).describe("An array of data objects formatted for a bar chart. Each object represents a step in the roadmap."),
  }).describe("A suggestion for a diagram and its data to visualize the user's career plan.")
});
export type GenerateCareerVisionOutput = z.infer<typeof GenerateCareerVisionOutputSchema>;


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

// Conversational Agent Types
export const ConversationalAgentInputSchema = z.object({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  prompt: z.string().describe("The user's latest message."),
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});
export type ConversationalAgentInput = z.infer<typeof ConversationalAgentInputSchema>;

export const ConversationalAgentOutputSchema = z.object({
  response: z.string().describe("The AI's generated response."),
});
export type ConversationalAgentOutput = z.infer<typeof ConversationalAgentOutputSchema>;

// Conversational Event Flow Types
export const EventSchemaForConversation = z.object({
  title: z.string().describe("The concise title for the event."),
  date: z.string().datetime().describe("The start date and time of the event in ISO 8601 format."),
  endDate: z.string().datetime().optional().describe("The end date and time of the event in ISO 8601 format. If not specified by the user, infer a reasonable duration (e.g., 1 hour for meetings)."),
  notes: z.string().optional().describe("A brief summary or notes for the event, extracted from the user's prompt."),
  isAllDay: z.boolean().default(false).describe("Set to true if the user specifies an all-day event or provides no specific time."),
  location: z.string().optional().describe("The location of the event, if mentioned."),
  reminder: z.object({
    enabled: z.boolean().describe("Set to true if the user's prompt implies a reminder (e.g., 'remind me', 'don't forget'). Otherwise, false."),
  }).optional().describe("Reminder settings for the event.")
});

export const ConversationalEventInputSchema = z.object({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.string(),
  })).describe("The history of the conversation so far."),
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
  timezone: z.string().optional().describe("The IANA timezone name for the user, e.g., 'America/New_York'."),
});
export type ConversationalEventInput = z.infer<typeof ConversationalEventInputSchema>;


export const ConversationalEventOutputSchema = z.object({
    response: z.string().optional().describe("The AI's response to the user. This is used for asking clarifying questions or confirming the event creation."),
    event: EventSchemaForConversation.optional().describe("The structured calendar event object. This should only be provided when all necessary information has been gathered."),
});
export type ConversationalEventOutput = z.infer<typeof ConversationalEventOutputSchema>;

export const CreateEventOutputSchema = z.object({
  title: z.string().describe("The concise title for the event."),
  date: z.string().datetime().describe("The start date and time of the event in ISO 8601 format."),
  endDate: z.string().datetime().optional().describe("The end date and time of the event in ISO 8601 format. If not specified by the user, infer a reasonable duration (e.g., 1 hour for meetings)."),
  notes: z.string().optional().describe("A brief summary or notes for the event, extracted from the user's prompt."),
  isAllDay: z.boolean().default(false).describe("Set to true if the user specifies an all-day event or provides no specific time."),
  location: z.string().optional().describe("The location of the event, if mentioned."),
  reminder: z.object({
    enabled: z.boolean().describe("Set to true if the user's prompt implies a reminder (e.g., 'remind me', 'don't forget'). Otherwise, false."),
  }).optional().describe("Reminder settings for the event.")
});
export type CreateEventOutput = z.infer<typeof CreateEventOutputSchema>;

// New Daily Briefing Flow Types
export const GenerateDailyBriefingOutputSchema = z.object({
  briefing: z.string().describe("A concise, single-paragraph summary of the user's day, highlighting key events and emails."),
});
export type GenerateDailyBriefingOutput = z.infer<typeof GenerateDailyBriefingOutputSchema>;


// New Summarizer Flow Types
export const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().describe("The block of text to be summarized."),
  apiKey: z.string().optional().nullable().describe("Optional user-provided Gemini API key."),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

export const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe("A concise, one-paragraph summary of the provided text, focusing on key points and takeaways."),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

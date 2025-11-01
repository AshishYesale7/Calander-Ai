// Webapp Context Service for AI Orb
// Provides access to Gmail, Calendar, Tasks, and other webapp data

import { getTimelineEvents } from './timelineService';
import { getCareerGoals } from './careerGoalsService';
import { getUserSkills } from './skillsService';
import { getBookmarkedResources } from './resourcesService';
import { getGoogleCalendarEvents } from './googleCalendarService';
import { getGoogleTasks } from './googleTasksService';
import { getGoogleGmailMessages } from './googleGmailService';

export interface WebappContext {
  user: {
    uid: string;
    displayName: string;
    email: string;
  };
  calendar: {
    events: CalendarEvent[];
    upcomingEvents: CalendarEvent[];
    todaysEvents: CalendarEvent[];
  };
  emails: {
    important: EmailSummary[];
    recent: EmailSummary[];
    unread: EmailSummary[];
  };
  tasks: {
    pending: Task[];
    completed: Task[];
    overdue: Task[];
  };
  goals: {
    active: Goal[];
    completed: Goal[];
    progress: GoalProgress[];
  };
  skills: {
    current: Skill[];
    learning: Skill[];
    planned: Skill[];
  };
  resources: {
    bookmarked: Resource[];
    recent: Resource[];
  };
  activity: {
    recentActions: ActivityLog[];
    streakData: StreakData;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  source: 'google' | 'local';
}

export interface EmailSummary {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  receivedAt: string;
  isImportant: boolean;
  isUnread: boolean;
  labels: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  source: 'google' | 'local';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  category: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface GoalProgress {
  goalId: string;
  currentProgress: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  lastPracticed?: string;
  targetProficiency?: number;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'video' | 'course' | 'book' | 'tool';
  category: string;
  addedAt: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: any;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: string;
  weeklyGoal: number;
  weeklyProgress: number;
}

class WebappContextService {
  private contextCache: WebappContext | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getFullContext(userId: string, forceRefresh = false): Promise<WebappContext> {
    const now = Date.now();
    
    if (!forceRefresh && this.contextCache && now < this.cacheExpiry) {
      return this.contextCache;
    }

    try {
      const [
        events,
        goals,
        skills,
        resources,
        googleEvents,
        googleTasks,
        importantEmails
      ] = await Promise.allSettled([
        this.getCalendarData(userId),
        this.getGoalsData(userId),
        this.getSkillsData(userId),
        this.getResourcesData(userId),
        this.getGoogleCalendarData(userId),
        this.getGoogleTasksData(userId),
        this.getEmailData(userId)
      ]);

      const context: WebappContext = {
        user: {
          uid: userId,
          displayName: 'User', // This should come from auth context
          email: 'user@example.com' // This should come from auth context
        },
        calendar: this.extractValue(events, { events: [], upcomingEvents: [], todaysEvents: [] }),
        emails: this.extractValue(importantEmails, { important: [], recent: [], unread: [] }),
        tasks: this.extractValue(googleTasks, { pending: [], completed: [], overdue: [] }),
        goals: this.extractValue(goals, { active: [], completed: [], progress: [] }),
        skills: this.extractValue(skills, { current: [], learning: [], planned: [] }),
        resources: this.extractValue(resources, { bookmarked: [], recent: [] }),
        activity: {
          recentActions: [],
          streakData: {
            currentStreak: 0,
            longestStreak: 0,
            lastActivity: new Date().toISOString(),
            weeklyGoal: 7,
            weeklyProgress: 0
          }
        }
      };

      // Merge Google Calendar events with local events
      if (this.extractValue(googleEvents, []).length > 0) {
        context.calendar.events = [
          ...context.calendar.events,
          ...this.extractValue(googleEvents, [])
        ];
      }

      this.contextCache = context;
      this.cacheExpiry = now + this.CACHE_DURATION;

      return context;
    } catch (error) {
      console.error('Failed to get webapp context:', error);
      throw error;
    }
  }

  private extractValue<T>(result: PromiseSettledResult<T>, defaultValue: T): T {
    return result.status === 'fulfilled' ? result.value : defaultValue;
  }

  private async getCalendarData(userId: string) {
    try {
      const events = await getTimelineEvents(userId);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const calendarEvents: CalendarEvent[] = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.notes,
        startTime: event.date.toISOString(),
        endTime: event.endDate ? event.endDate.toISOString() : event.date.toISOString(),
        location: event.location,
        isAllDay: event.isAllDay || false,
        source: 'local' as const
      }));

      const todaysEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= today && eventDate < tomorrow;
      });

      const upcomingEvents = calendarEvents
        .filter(event => new Date(event.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 10);

      return {
        events: calendarEvents,
        upcomingEvents,
        todaysEvents
      };
    } catch (error) {
      console.error('Failed to get calendar data:', error);
      return { events: [], upcomingEvents: [], todaysEvents: [] };
    }
  }

  private async getGoogleCalendarData(userId: string) {
    try {
      const events = await getGoogleCalendarEvents(userId);
      return events.map((event: any) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        location: event.location,
        attendees: event.attendees?.map((a: any) => a.email) || [],
        isAllDay: !!event.start?.date,
        source: 'google' as const
      }));
    } catch (error) {
      console.error('Failed to get Google Calendar data:', error);
      return [];
    }
  }

  private async getGoogleTasksData(userId: string) {
    try {
      const tasks = await getGoogleTasks(userId);
      const now = new Date();

      const taskList: Task[] = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.notes,
        dueDate: task.due,
        completed: task.status === 'completed',
        priority: 'medium' as const, // Google Tasks doesn't have priority
        source: 'google' as const
      }));

      const pending = taskList.filter(task => !task.completed);
      const completed = taskList.filter(task => task.completed);
      const overdue = pending.filter(task => 
        task.dueDate && new Date(task.dueDate) < now
      );

      return { pending, completed, overdue };
    } catch (error) {
      console.error('Failed to get Google Tasks data:', error);
      return { pending: [], completed: [], overdue: [] };
    }
  }

  private async getEmailData(userId: string) {
    try {
      const { emails } = await getGoogleGmailMessages(userId);
      
      const emailSummaries: EmailSummary[] = emails.map((email: any) => ({
        id: email.id,
        subject: email.subject || 'No Subject',
        sender: email.from || 'Unknown Sender',
        snippet: email.snippet || '',
        receivedAt: email.date || new Date().toISOString(),
        isImportant: email.isImportant || false,
        isUnread: email.isUnread || false,
        labels: email.labels || []
      }));

      const important = emailSummaries.filter(email => email.isImportant);
      const recent = emailSummaries.slice(0, 10);
      const unread = emailSummaries.filter(email => email.isUnread);

      return { important, recent, unread };
    } catch (error) {
      console.error('Failed to get email data:', error);
      return { important: [], recent: [], unread: [] };
    }
  }

  private async getGoalsData(userId: string) {
    try {
      const goals = await getCareerGoals(userId);
      
      const goalList: Goal[] = goals.map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description || '',
        targetDate: goal.targetDate,
        progress: goal.progress || 0,
        category: goal.category || 'General',
        milestones: goal.milestones || []
      }));

      const active = goalList.filter(goal => goal.progress < 100);
      const completed = goalList.filter(goal => goal.progress >= 100);
      const progress: GoalProgress[] = goalList.map(goal => ({
        goalId: goal.id,
        currentProgress: goal.progress,
        weeklyProgress: 0, // This would need to be calculated
        monthlyProgress: 0 // This would need to be calculated
      }));

      return { active, completed, progress };
    } catch (error) {
      console.error('Failed to get goals data:', error);
      return { active: [], completed: [], progress: [] };
    }
  }

  private async getSkillsData(userId: string) {
    try {
      const skills = await getUserSkills(userId);
      
      const skillList: Skill[] = skills.map((skill: any) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category || 'General',
        proficiency: skill.proficiency || 0,
        lastPracticed: skill.lastPracticed,
        targetProficiency: skill.targetProficiency
      }));

      const current = skillList.filter(skill => skill.proficiency > 0);
      const learning = skillList.filter(skill => 
        skill.proficiency > 0 && skill.proficiency < (skill.targetProficiency || 100)
      );
      const planned = skillList.filter(skill => skill.proficiency === 0);

      return { current, learning, planned };
    } catch (error) {
      console.error('Failed to get skills data:', error);
      return { current: [], learning: [], planned: [] };
    }
  }

  private async getResourcesData(userId: string) {
    try {
      const resources = await getBookmarkedResources(userId);
      
      const resourceList: Resource[] = resources.map((resource: any) => ({
        id: resource.id,
        title: resource.title,
        url: resource.url,
        type: resource.type || 'article',
        category: resource.category || 'General',
        addedAt: resource.addedAt || new Date().toISOString(),
        notes: resource.notes
      }));

      const bookmarked = resourceList; // All resources are considered bookmarked
      const recent = resourceList
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 10);

      return { bookmarked, recent };
    } catch (error) {
      console.error('Failed to get resources data:', error);
      return { bookmarked: [], recent: [] };
    }
  }

  // Get specific context for AI operations
  async getContextForAI(userId: string, contextType?: 'calendar' | 'email' | 'tasks' | 'goals' | 'skills'): Promise<any> {
    const fullContext = await this.getFullContext(userId);

    if (!contextType) {
      return this.summarizeContext(fullContext);
    }

    switch (contextType) {
      case 'calendar':
        return fullContext.calendar;
      case 'email':
        return fullContext.emails;
      case 'tasks':
        return fullContext.tasks;
      case 'goals':
        return fullContext.goals;
      case 'skills':
        return fullContext.skills;
      default:
        return this.summarizeContext(fullContext);
    }
  }

  private summarizeContext(context: WebappContext) {
    return {
      summary: {
        totalEvents: context.calendar.events.length,
        todaysEvents: context.calendar.todaysEvents.length,
        upcomingEvents: context.calendar.upcomingEvents.length,
        unreadEmails: context.emails.unread.length,
        importantEmails: context.emails.important.length,
        pendingTasks: context.tasks.pending.length,
        overdueTasks: context.tasks.overdue.length,
        activeGoals: context.goals.active.length,
        completedGoals: context.goals.completed.length,
        currentSkills: context.skills.current.length,
        learningSkills: context.skills.learning.length,
        currentStreak: context.activity.streakData.currentStreak
      },
      recentActivity: {
        todaysEvents: context.calendar.todaysEvents.slice(0, 3),
        upcomingEvents: context.calendar.upcomingEvents.slice(0, 3),
        importantEmails: context.emails.important.slice(0, 3),
        pendingTasks: context.tasks.pending.slice(0, 5),
        activeGoals: context.goals.active.slice(0, 3)
      }
    };
  }

  // Clear cache
  clearCache() {
    this.contextCache = null;
    this.cacheExpiry = 0;
  }

  // Get context for specific page/component
  async getPageContext(userId: string, pageName: string): Promise<any> {
    const fullContext = await this.getFullContext(userId);

    switch (pageName) {
      case 'dashboard':
        return {
          todaysEvents: fullContext.calendar.todaysEvents,
          upcomingEvents: fullContext.calendar.upcomingEvents.slice(0, 5),
          importantEmails: fullContext.emails.important.slice(0, 3),
          pendingTasks: fullContext.tasks.pending.slice(0, 5),
          streakData: fullContext.activity.streakData
        };
      case 'calendar':
        return fullContext.calendar;
      case 'goals':
        return fullContext.goals;
      case 'skills':
        return fullContext.skills;
      case 'resources':
        return fullContext.resources;
      default:
        return this.summarizeContext(fullContext);
    }
  }
}

export const webappContextService = new WebappContextService();
export default webappContextService;

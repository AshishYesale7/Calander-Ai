# FutureSight Technical Architecture

## System Architecture Overview

FutureSight follows a modern, cloud-native architecture built on serverless principles with AI-first design patterns.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15 + React 18 + TypeScript                       │
│  ├── SSR/SSG for landing pages                             │
│  ├── Client-side routing for app                           │
│  ├── Progressive Web App features                          │
│  └── Real-time UI updates                                  │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                        │
│  ├── Authentication endpoints                              │
│  ├── Google API integrations                               │
│  ├── AI processing endpoints                               │
│  └── Database operations                                   │
├─────────────────────────────────────────────────────────────┤
│                    AI/ML Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Google Genkit Framework                                   │
│  ├── Gemini Pro for complex reasoning                      │
│  ├── Gemini Flash for quick responses                      │
│  ├── Structured prompt engineering                         │
│  └── Context management                                    │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Firebase Ecosystem                                        │
│  ├── Firestore (NoSQL Database)                           │
│  ├── Authentication (Multi-provider)                       │
│  ├── Cloud Messaging (Push notifications)                  │
│  └── Storage (File/media storage)                         │
├─────────────────────────────────────────────────────────────┤
│                    External Integrations                   │
├─────────────────────────────────────────────────────────────┤
│  Google Workspace APIs                                     │
│  ├── Calendar API                                         │
│  ├── Tasks API                                            │
│  ├── Gmail API                                            │
│  └── OAuth 2.0 authentication                             │
├─────────────────────────────────────────────────────────────┤
│                    Payment & Analytics                     │
├─────────────────────────────────────────────────────────────┤
│  ├── Razorpay (Payment processing)                        │
│  ├── Vercel Speed Insights                                │
│  └── Custom analytics                                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components Hierarchy

```
App
├── LandingPage (/)
│   ├── StarryBackground
│   ├── FeatureShowcase
│   ├── GravityWellBackground
│   └── PricingCard
├── AuthLayout (/auth)
│   ├── SignIn
│   ├── SignUp
│   └── OTPVerification
└── AppLayout (/app)
    ├── Sidebar
    │   ├── Navigation
    │   ├── UserProfile
    │   └── CommandPalette
    ├── Dashboard
    │   ├── TimelineView
    │   ├── CalendarView
    │   ├── DayPlanCard
    │   └── ImportantEmails
    ├── CareerGoals
    │   ├── GoalList
    │   ├── ProgressTracker
    │   └── GoalForm
    ├── Skills
    │   ├── SkillGrid
    │   ├── ProficiencyLevels
    │   └── LearningPath
    ├── CareerVision
    │   ├── VisionForm
    │   ├── AIAnalysis
    │   └── RoadmapGenerator
    ├── News
    │   ├── PersonalizedFeed
    │   ├── OpportunityTracker
    │   └── NewsFilters
    ├── Resources
    │   ├── BookmarkManager
    │   ├── AIRecommendations
    │   └── ResourceCategories
    ├── Extensions
    │   ├── ExtensionMarketplace
    │   ├── CodefolioAlly
    │   └── ExtensionManager
    └── Profile
        ├── UserStats
        ├── SocialLinks
        └── SettingsPanel
```

## Data Models & Database Schema

### Firestore Collections Structure

```typescript
// Users Collection
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  subscription: {
    plan: 'free' | 'monthly' | 'yearly';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Timestamp;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailSync: boolean;
    backgroundImage?: string;
    glassEffect: number;
  };
  stats: {
    streak: number;
    totalTimeSpent: number;
    xp: number;
    level: number;
  };
}

// Events Collection
interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  type: 'exam' | 'deadline' | 'goal' | 'task' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: 'manual' | 'google_calendar' | 'google_tasks' | 'ai_generated';
  googleEventId?: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Goals Collection
interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'career' | 'education' | 'skill' | 'personal';
  targetDate: Timestamp;
  progress: number; // 0-100
  milestones: Milestone[];
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Skills Collection
interface Skill {
  id: string;
  userId: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'domain';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetProficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  resources: string[];
  practiceTime: number; // hours
  certifications: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Career Vision Collection
interface CareerVision {
  id: string;
  userId: string;
  vision: string;
  strengths: string[];
  developmentAreas: string[];
  roadmap: RoadmapStep[];
  generatedAt: Timestamp;
  updatedAt: Timestamp;
}
```

## AI Integration Architecture

### Genkit Workflow Structure

```typescript
// AI Flows Definition
const dailyPlanFlow = defineFlow(
  {
    name: 'generateDailyPlan',
    inputSchema: z.object({
      userId: z.string(),
      date: z.string(),
      existingEvents: z.array(EventSchema),
      goals: z.array(GoalSchema),
      preferences: UserPreferencesSchema,
    }),
    outputSchema: z.object({
      schedule: z.array(ScheduleItemSchema),
      microGoals: z.array(z.string()),
      motivationalQuote: z.string(),
      focusAreas: z.array(z.string()),
    }),
  },
  async (input) => {
    // AI processing logic
    const prompt = `Generate a personalized daily plan for ${input.date}...`;
    const response = await generate({
      model: geminiPro,
      prompt: prompt,
      config: { temperature: 0.7 },
    });
    return parseAIResponse(response);
  }
);

const careerVisionFlow = defineFlow(
  {
    name: 'generateCareerVision',
    inputSchema: z.object({
      userId: z.string(),
      aspirations: z.string(),
      currentSkills: z.array(z.string()),
      experience: z.string(),
    }),
    outputSchema: CareerVisionSchema,
  },
  async (input) => {
    // Multi-step AI analysis
    const visionAnalysis = await analyzeCareerAspirations(input);
    const skillGapAnalysis = await analyzeSkillGaps(input);
    const roadmapGeneration = await generateRoadmap(visionAnalysis, skillGapAnalysis);
    
    return {
      vision: visionAnalysis.vision,
      strengths: visionAnalysis.strengths,
      developmentAreas: skillGapAnalysis.gaps,
      roadmap: roadmapGeneration.steps,
    };
  }
);
```

### AI Prompt Engineering

```typescript
// Structured Prompt Templates
const DAILY_PLAN_PROMPT = `
You are an AI career planning assistant. Generate a personalized daily plan based on:

CONTEXT:
- Date: {date}
- User Goals: {goals}
- Existing Events: {events}
- User Preferences: {preferences}

REQUIREMENTS:
1. Create a realistic 8-12 hour schedule
2. Balance work/study time with breaks
3. Align activities with long-term goals
4. Include 3-5 specific micro-goals
5. Provide a motivational quote
6. Suggest 2-3 focus areas

OUTPUT FORMAT:
{
  "schedule": [
    {
      "time": "09:00",
      "duration": 60,
      "activity": "Deep work on project X",
      "type": "focus"
    }
  ],
  "microGoals": ["Complete module 1", "Review notes"],
  "motivationalQuote": "Success is the sum of small efforts...",
  "focusAreas": ["Algorithm practice", "Portfolio development"]
}
`;
```

## State Management

### Context Providers Architecture

```typescript
// Global State Structure
interface AppState {
  user: User | null;
  events: Event[];
  goals: Goal[];
  skills: Skill[];
  careerVision: CareerVision | null;
  notifications: Notification[];
  preferences: UserPreferences;
  loading: LoadingStates;
  errors: ErrorStates;
}

// Context Providers
const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};
```

## API Design

### RESTful API Endpoints

```typescript
// Authentication
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
POST /api/auth/verify-otp

// User Management
GET /api/user/profile
PUT /api/user/profile
POST /api/user/preferences

// Events & Calendar
GET /api/events
POST /api/events
PUT /api/events/:id
DELETE /api/events/:id
POST /api/events/sync-google

// Goals & Skills
GET /api/goals
POST /api/goals
PUT /api/goals/:id
DELETE /api/goals/:id

GET /api/skills
POST /api/skills
PUT /api/skills/:id

// AI Services
POST /api/ai/daily-plan
POST /api/ai/career-vision
POST /api/ai/analyze-emails
POST /api/ai/suggest-resources

// Google Integrations
GET /api/google/auth
GET /api/google/calendar
GET /api/google/tasks
POST /api/google/calendar/webhook

// Extensions
GET /api/extensions
POST /api/extensions/install
DELETE /api/extensions/:id
GET /api/extensions/codefolio/:username
```

## Security Architecture

### Authentication Flow

```typescript
// Multi-Provider Authentication
const authMethods = {
  email: FirebaseAuth.signInWithEmailAndPassword,
  google: FirebaseAuth.signInWithPopup(googleProvider),
  phone: FirebaseAuth.signInWithPhoneNumber,
};

// JWT Token Validation
const validateToken = async (token: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Role-Based Access Control
const checkPermissions = (user: User, resource: string, action: string) => {
  const permissions = getUserPermissions(user);
  return permissions.includes(`${resource}:${action}`);
};
```

### Data Privacy & Security

```typescript
// Email Content Filtering
const filterSensitiveContent = (emailContent: string) => {
  const sensitivePatterns = [
    /\b\d{6}\b/, // OTP patterns
    /password/i,
    /verification code/i,
    /security alert/i,
  ];
  
  return sensitivePatterns.some(pattern => pattern.test(emailContent));
};

// Data Encryption
const encryptSensitiveData = (data: any) => {
  return encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY);
};
```

## Performance Optimization

### Caching Strategy

```typescript
// API Response Caching
const cache = new Map();

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  
  // TTL cleanup
  setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5 minutes
  
  return data;
};

// Component-Level Optimization
const MemoizedComponent = React.memo(({ data }) => {
  return useMemo(() => {
    return <ExpensiveComponent data={data} />;
  }, [data]);
});
```

### Database Optimization

```typescript
// Firestore Query Optimization
const getEventsOptimized = async (userId: string, startDate: Date, endDate: Date) => {
  return firestore
    .collection('events')
    .where('userId', '==', userId)
    .where('startDate', '>=', startDate)
    .where('startDate', '<=', endDate)
    .orderBy('startDate')
    .limit(100)
    .get();
};

// Batch Operations
const batchUpdateEvents = async (events: Event[]) => {
  const batch = firestore.batch();
  
  events.forEach(event => {
    const ref = firestore.collection('events').doc(event.id);
    batch.update(ref, event);
  });
  
  return batch.commit();
};
```

## Deployment Architecture

### Build Process

```yaml
# Build Pipeline
build:
  - name: Install Dependencies
    run: npm ci
  
  - name: Type Check
    run: npm run typecheck
  
  - name: Lint
    run: npm run lint
  
  - name: Build Application
    run: npm run build
    env:
      NODE_ENV: production
  
  - name: Run Tests
    run: npm test
  
  - name: Deploy to Firebase
    run: firebase deploy
```

### Environment Configuration

```typescript
// Environment-specific configs
const config = {
  development: {
    apiUrl: 'http://localhost:9002',
    geminiModel: 'gemini-pro',
    logLevel: 'debug',
  },
  production: {
    apiUrl: process.env.NEXT_PUBLIC_BASE_URL,
    geminiModel: 'gemini-pro',
    logLevel: 'error',
  },
};
```

## Monitoring & Observability

### Error Tracking

```typescript
// Error Boundary with Reporting
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to external service
    console.error('Application Error:', error, errorInfo);
    
    // Report to monitoring service
    this.reportError(error, errorInfo);
  }
  
  reportError(error: Error, errorInfo: ErrorInfo) {
    // Implementation for error reporting
  }
}
```

### Performance Metrics

```typescript
// Performance Monitoring
const trackPerformance = (metricName: string, value: number) => {
  // Custom analytics
  analytics.track('performance_metric', {
    metric: metricName,
    value: value,
    timestamp: Date.now(),
  });
};

// API Response Time Tracking
const withPerformanceTracking = (handler: any) => {
  return async (req: any, res: any) => {
    const start = Date.now();
    
    try {
      await handler(req, res);
    } finally {
      const duration = Date.now() - start;
      trackPerformance(`api_${req.url}`, duration);
    }
  };
};
```

This technical architecture provides a comprehensive foundation for understanding how FutureSight is built, scaled, and maintained as a modern, AI-powered web application.
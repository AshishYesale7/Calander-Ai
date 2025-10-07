
# Calendar.ai Repository Comprehensive Explanation

## Project Overview

**Calendar.ai** is an intelligent, AI-powered career calendar and planning application designed specifically for college students and early-career professionals. It serves as a comprehensive digital assistant that helps users navigate the complexities of career development by transforming traditional calendar management into a proactive, AI-driven planning system.

### Core Purpose
The application addresses the overwhelming challenge faced by students who must juggle:
- Academic deadlines and exam preparation (GATE, GRE, CAT, etc.)
- Skill development and learning new technologies
- Internship and job opportunities
- Long-term career goal planning
- Daily time management and productivity

## Technology Stack

### Frontend Technologies
- **Next.js 15.3.3**: React framework for full-stack web applications with server-side rendering
- **React 18.3.1**: Component-based UI library
- **TypeScript 5**: Static type checking for enhanced code quality
- **Tailwind CSS 3.4.1**: Utility-first CSS framework for rapid UI development
- **Framer Motion 11.2.19**: Animation library for smooth interactions

### UI Components & Design
- **ShadCN UI**: Pre-built, accessible React components
- **Radix UI**: Low-level UI primitives for building design systems
- **Lucide React**: Comprehensive icon library
- **React Color**: Color picker components
- **Recharts**: Charting library for data visualization

### AI & Backend Technologies
- **Google Gemini AI (via Genkit)**: Core AI engine for intelligent features
- **Firebase Suite**:
  - **Authentication**: Multi-method user authentication (email, Google, phone)
  - **Firestore**: NoSQL database for user data storage
  - **Cloud Messaging**: Browser push notifications
  - **App Hosting**: Deployment platform
- **Google APIs**:
  - **Calendar API**: Sync with Google Calendar
  - **Tasks API**: Integrate Google Tasks
  - **Gmail API**: Email analysis and summarization

### Additional Tools & Libraries
- **Date-fns**: Modern date manipulation library
- **React Hook Form**: Form handling with validation
- **Zod**: TypeScript-first schema validation
- **CMDK**: Command palette implementation
- **Razorpay**: Payment processing for subscriptions

## Repository Structure

```
Calendar.ai/
├── .git/                          # Git version control
├── .vscode/                       # VS Code configuration
├── docs/                          # Documentation files
│   └── blueprint.md              # Original project blueprint
├── public/                        # Static assets
├── src/                          # Source code
│   ├── ai/                       # AI integration and utilities
│   ├── app/                      # Next.js App Router structure
│   │   ├── (app)/               # Protected app routes
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── career-goals/    # Goal tracking
│   │   │   ├── career-vision/   # AI career planning
│   │   │   ├── skills/          # Skill tracking
│   │   │   ├── news/            # Personalized news
│   │   │   ├── resources/       # Learning resources
│   │   │   ├── leaderboard/     # Gamification
│   │   │   ├── profile/         # User profiles
│   │   │   └── extensions/      # Plugin marketplace
│   │   ├── api/                 # API routes
│   │   ├── auth/                # Authentication pages
│   │   └── layout.tsx           # Root layout
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   ├── layout/              # Layout components
│   │   ├── landing/             # Landing page components
│   │   ├── dashboard/           # Dashboard-specific components
│   │   └── timeline/            # Timeline visualization
│   ├── context/                 # React context providers
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   ├── services/                # External service integrations
│   └── types/                   # TypeScript type definitions
├── package.json                  # Dependencies and scripts
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── apphosting.yaml              # Firebase App Hosting config
├── app.json                     # Heroku deployment config
└── Procfile                     # Process configuration
```

## Key Features & Architecture

### 1. AI-Powered Dashboard & Timeline
- **Multiple Views**: Calendar, day timetable, sliding timeline, and list views
- **Google Sync**: Automatic synchronization with Google Calendar and Tasks
- **Event Visualization**: Interactive timeline with milestone dots and detailed cards

### 2. Smart Daily Planning
- **AI-Generated Plans**: Personalized daily schedules created by Gemini AI
- **Micro-Goals**: AI breaks down long-term aspirations into daily actionable tasks
- **Context-Aware**: Considers past activities, current commitments, and future goals

### 3. Career Vision Planner
- **Natural Language Input**: Users describe aspirations in conversational format
- **Comprehensive Analysis**: AI generates vision statements, identifies strengths/weaknesses
- **Actionable Roadmaps**: Multi-step plans with specific milestones and deadlines
- **Resource Suggestions**: Curated learning materials based on career goals

### 4. Goal & Skill Tracking
- **Progress Monitoring**: Visual progress tracking with deadlines and milestones
- **Skill Proficiency**: Level-based skill tracking system
- **One-Click Integration**: Easy addition of AI-generated recommendations

### 5. Gamification & Social Features
- **Daily Streaks**: Habit-building through consistent engagement tracking
- **Leaderboard**: Community ranking based on time spent and XP earned
- **User Profiles**: Shareable profiles with bio, social links, and achievements
- **Follow System**: Social networking for motivation and accountability

### 6. Extension Marketplace
- **Plugin Architecture**: Modular extensions for specialized functionality
- **Codefolio Ally**: Flagship extension for competitive programmers
  - Unified dashboard for Codeforces, LeetCode, and CodeChef
  - Aggregated statistics and problem-solving streaks
  - Contest integration and automatic calendar addition
  - GitHub-style contribution graphs

### 7. Intelligent Integrations
- **Email Analysis**: AI-powered Gmail scanning for important, non-sensitive emails
- **Opportunity Tracking**: Automated discovery of relevant deadlines and opportunities
- **Smart Notifications**: Context-aware browser push notifications

### 8. Advanced User Experience
- **Multi-Auth Support**: Email/password, Google OAuth, and phone OTP
- **Customization**: Themes, backgrounds, and UI effects
- **Command Palette**: Keyboard-accessible navigation (Ctrl+K)
- **Mobile Responsive**: Optimized for all device sizes
- **Offline Capabilities**: Progressive Web App features

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Firebase project with enabled services
- Google Cloud project with APIs enabled
- Gemini AI API key

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AshishYesale7/Calendar.ai.git
   cd Calendar.ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment configuration**:
   Create a `.env` file with required variables (see Environment Variables section)

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:9002`

### Available Scripts
- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build production application
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run typecheck`: Type checking without emission
- `npm run genkit:dev`: Start Genkit AI development server
- `npm run genkit:watch`: Start Genkit with file watching

## Environment Variables

### Required Configuration
```env
# Google AI/Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Razorpay (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Application URL
NEXT_PUBLIC_BASE_URL=https://your-app-domain.com
```

## Deployment Options

### Firebase App Hosting (Recommended)
The application is pre-configured for Firebase App Hosting deployment:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Deploy: Follow Firebase App Hosting documentation

### Heroku Deployment
One-click deployment available using the Heroku button in the README, which automatically:
- Detects the `app.json` configuration
- Prompts for environment variables
- Builds and deploys the application

## Development Guidelines

### Code Architecture
- **Component-Based**: React components following single responsibility principle
- **Type Safety**: Comprehensive TypeScript usage throughout
- **State Management**: React Context for global state, local state for components
- **API Routes**: Next.js API routes for backend functionality
- **Error Boundaries**: Graceful error handling and user feedback

### Styling Conventions
- **Utility-First**: Tailwind CSS for rapid development
- **Component Library**: ShadCN UI for consistent design patterns
- **Responsive Design**: Mobile-first approach with breakpoint considerations
- **Accessibility**: ARIA labels and keyboard navigation support

### AI Integration Patterns
- **Genkit Framework**: Structured AI workflows and prompt management
- **Context Passing**: Proper context provision to AI models
- **Error Handling**: Graceful fallbacks for AI service failures
- **Rate Limiting**: Respect API quotas and implement appropriate delays

## Security Considerations

### Authentication & Authorization
- Firebase Authentication handles secure user management
- JWT tokens for API authentication
- Role-based access control for premium features

### Data Privacy
- Email analysis excludes sensitive content (OTPs, passwords)
- User data encryption in transit and at rest
- GDPR compliance for user data handling

### API Security
- Environment variable protection for sensitive keys
- CORS configuration for cross-origin requests
- Input validation and sanitization

## Contributing Guidelines

### Code Quality
- Follow TypeScript strict mode requirements
- Use ESLint and Prettier for code formatting
- Write descriptive commit messages
- Include JSDoc comments for complex functions

### Testing Approach
- Component testing with React Testing Library
- Integration testing for API routes
- End-to-end testing for critical user flows

### Pull Request Process
1. Fork the repository
2. Create feature branch from main
3. Implement changes with tests
4. Submit PR with clear description
5. Address review feedback
6. Ensure CI/CD passes

## Performance Optimizations

### Frontend Performance
- Next.js automatic code splitting
- Image optimization with Next.js Image component
- Lazy loading for non-critical components
- Service worker for caching strategies

### Backend Optimization
- Firebase Firestore query optimization
- API response caching where appropriate
- Background job processing for heavy operations
- Connection pooling for external APIs

## Monitoring & Analytics

### Application Monitoring
- Vercel Speed Insights integration
- Error boundary reporting
- Performance metric tracking
- User engagement analytics

### AI Usage Tracking
- Gemini API usage monitoring
- Model performance metrics
- User interaction patterns with AI features
- Cost optimization based on usage patterns

## Future Roadmap

### Planned Features
- Mobile applications (iOS/Android) - currently in development
- Advanced analytics dashboard
- Team collaboration features
- Third-party calendar integrations (Outlook, Apple Calendar)
- Enhanced AI capabilities with more specialized models

### Technical Improvements
- Progressive Web App enhancements
- Offline-first architecture
- Real-time collaboration
- Advanced caching strategies
- Performance optimizations

## Live Demo

The application is currently deployed and accessible at:
**http://futuresight-8ebba4468907.herokuapp.com**

This live prototype demonstrates all the key features and provides a comprehensive preview of the application's capabilities.

---

This repository represents a comprehensive solution for modern career planning, combining cutting-edge AI technology with intuitive user experience design to create a powerful tool for personal and professional development.

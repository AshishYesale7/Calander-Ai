
[![wakatime](https://wakatime.com/badge/github/AshishYesale7/Calander-Ai.svg)](https://wakatime.com/badge/github/AshishYesale7/Calander-Ai)
 



###  **Inspiration**

Managing time and communication has become harder as people juggle multiple calendars, emails, chats, and meetings. We noticed how much time goes into reading, summarizing, and following up manually — all just to stay organized.
The idea for **Calendar.ai** came from wanting an assistant that could understand this context and take care of the repetitive work — summarizing, extracting action items, and creating follow-ups — so people can focus on meaningful tasks instead of admin.

---

###  **What it does**

**Calendar.ai** brings calendar, email, and collaboration together into one workspace powered by Chrome’s built-in AI.
It automatically:

* Summarizes meetings, emails, and attachments.
* Extracts key action items, owners, and deadlines.
* Suggests follow-up drafts and calendar events.
* Transcribes short voice/video calls and saves searchable notes.
* Uses semantic search to surface relevant past context.
* Provides a conversational assistant for queries like “What are my pending tasks from yesterday?”

It’s designed to reduce friction between communication, context, and action.

---

###  **How we built it**

We built **Calendar.ai** as a modern web app using:

* **Chrome Built-in AI APIs:** Prompt, Writer, Summarizer, Rewriter, Proofreader, and Translator.
* **Frontend:** React + TypeScript + Chrome Extension Manifest V3.
* **Backend (for integrations):** Node.js + Firebase (for authentication, storage, and sync).
* **Data pipeline:** Built-in APIs handle summarization, rewriting, and translation directly on-device when possible; cloud fallback is used for authenticated integrations like Gmail and Drive.
* **UI/UX:** Minimal, workspace-style dashboard with chat, calendar, and document previews.
  
<img width="1318" height="364" alt="94947" src="https://github.com/user-attachments/assets/29b90108-2865-41b5-a615-0ef678cc643e" />

 

We focused on a hybrid AI model — client-side for privacy and responsiveness, cloud for collaboration and real-time sync.

---

###  **Challenges we ran into**

Some of the main challenges were:

* **Latency & performance:** Managing inference speed for local AI tasks without blocking the UI.
* **Model size limitations:** Keeping the app lightweight while still supporting multimodal input.
* **Sync complexity:** Maintaining real-time updates between local and cloud data (e.g., events and attachments).
* **Tooling maturity:** Some APIs are still early-stage, so documentation and debugging were limited.
* **Integration boundaries:** Managing Gmail, Drive, and Calendar APIs alongside Chrome’s AI stack cleanly.
* **User privacy:** Designing clear consent flows and preview-before-send logic.

---

###  **Accomplishments that we're proud of**

* Built a functioning **AI-driven meeting assistant** that creates structured actions directly from emails and meetings.
* Achieved **real-time summarization** and **follow-up generation** in-browser using built-in APIs.
* Created a clean, modern UI that blends chat, calendar, and task management naturally.
* Maintained **privacy-first architecture** with local inference and explicit user approval for cloud actions.
* Delivered a strong proof of concept ready for real user testing and future extension publishing.

---

###  **What we learned**

* Chrome’s built-in AI stack offers more flexibility than we expected — especially the ability to run tasks locally without cloud dependence.
* Balancing performance and accuracy on the client side requires design trade-offs.
* User trust and transparency are essential for AI adoption — showing “how” and “why” AI acts matters.
* Client-side AI opens new UX possibilities: instant feedback, offline productivity, and better privacy.

---

###  **What’s next for Calendar.ai**



Hoping to extend your web application to extension’s reach to even more users, including those on mobile devices (Android/iOS , desktop, Extension(This "Extension" will live in the user's browser and use Chrome's built-in AI APIs to intelligently capture context from whatever the user is doing on the web and feed it into their Calendar.ai.) )? Implement a hybrid AI strategy with either Firebase AI Logic or the Gemini Developer API.

Next, we plan to:


* Add **multi-calendar synchronization** (Google, Outlook, Apple).
* Integrate **file attachments and Gmail automation** for deeper workflow coverage.
* Expand to **team and “Clan” collaboration** features with shared AI timelines.
* Support **1-on-1 voice and video calls with live summaries**.
* Launch as a **Chrome Extension + PWA** for both desktop and mobile.
* Continue optimizing for **speed, privacy, and hybrid (local/cloud) AI execution.**



# Calendar.ai: Your AI-Powered Career Calendar

Welcome to Calendar.ai, an intelligent planning application designed to help ambitious students and young professionals navigate the complexities of career development. This isn't just a calendar; it's a proactive assistant that helps you manage your time, track your goals, and build a clear path to success with the help of powerful AI.

## 1. The Problem: Overcoming Student Overwhelm

For college students and an early-career individuals, the path forward is often a chaotic mix of academic deadlines, skill development, exam preparation, and long-term career aspirations. Juggling these competing priorities is a significant challenge. Key problems include:

*   **Information Overload:** Students are bombarded with information about exams (like GATE, GRE, CAT), internship opportunities, new technologies, and necessary skills (DSA, AI, WebDev), making it difficult to know what to focus on.
*   **Time Management Deficit:** Traditional calendars are passive. They show you *what* you have to do, but they don't help you figure out *how* to get it all done. Students struggle to balance classes, studying, projects, and personal growth, often leading to burnout or missed opportunities.
*   **Lack of a Cohesive Strategy:** It's easy to get lost in the day-to-day grind. Connecting daily tasks to long-term career goals is often an abstract concept, leaving students feeling directionless. They may track their goals in one place, their skills in another, and their deadlines in a third, with no unified view of their progress.
*   **Reactive vs. Proactive Planning:** Most planning happens in response to an impending deadline. Calendar.ai aims to solve this by providing predictive insights and structured plans. It analyzes your past activities, current commitments, and future goals to help you not just manage your present but actively build your future. By structuring a clear, AI-assisted plan, it turns the daunting task of career planning into a manageable, day-by-day journey.

Calendar.ai addresses this by creating a single, intelligent ecosystem where every task, every goal, and every learning resource is part of a larger, personalized career strategy.

## 2. The Solution: An Overview of Calendar.ai

Calendar.ai is a web application built with a modern tech stack, designed to be a student's central hub for all academic and career-related planning. It leverages Google's Gemini AI to provide intelligent, actionable insights that transform a simple calendar into a dynamic career co-pilot.

### Key Features:

*   **AI-Powered Dashboard & Timeline:** The core of the app. It syncs with your Google Calendar and Tasks to pull in existing events. It features multiple views:
    *   **Calendar View:** A traditional monthly calendar with dots indicating event days.
    *   **Maximized Weekly Planner:** A full-screen, multi-panel weekly planner with drag-and-drop event management, a sticky header for easy navigation, and accurate rendering for overlapping events.
    *   **Interactive Event Popovers:** Hover over any event to see a detailed popover with its full title, notes, and direct buttons to edit or delete the event.
*   **Smart Daily Plan:** At the start of each day, the AI generates a personalized plan, including a detailed schedule, achievable micro-goals based on your long-term aspirations, and critical reminders.
*   **Career Vision Planner:** A standout feature where you describe your passions and career aspirations in natural language. The AI then generates a comprehensive, multi-faceted career plan, including a vision statement, key strengths, development areas, an actionable multi-step roadmap, and suggested learning resources.
*   **Goal & Skill Tracking:** Dedicated sections to define and monitor your career goals (with progress trackers and deadlines) and to log the skills you're acquiring, complete with proficiency levels.
*   **Real-time Communication Suite:**
    *   **Chat, Audio & Video Calling:** A collapsible sidebar allows for one-on-one text chats, audio calls, and video calls with other users. The chat interface includes typing indicators, message timestamps, and call logs integrated directly into the conversation history.
    *   **Picture-in-Picture (PiP) Mode:** Video calls can be minimized to a draggable PiP window, allowing for seamless navigation while on a call.
    *   **WebRTC Integration:** Built with a peer-to-peer WebRTC architecture, using Firestore for signaling to ensure efficient and direct media streaming.
    *   **Optimized Mobile Experience:** The chat interface is fully optimized for mobile, with a keyboard-aware input bar and a full-screen conversation view.
*   **Gamified Motivation & Social Features:**
    *   **Daily Streak Goal:** Build a powerful habit by meeting your daily activity goal.
    *   **Competitive Leaderboard & Profiles:** See how you stack up against others on the leaderboard and connect with them via their public profiles.
    *   **Follow System:** Follow other users to build a community of motivated peers.
*   **Extension Marketplace :** A dedicated "Extensions" page serves as a marketplace for plugins that enhance the app's functionality. The flagship extension is **Codefolio Ally**, designed for competitive programmers.
*   **Intelligent Integrations & Data Management:**
    *   **Google Sync:** Seamlessly syncs with Google Calendar and Google Tasks.
    *   **Important Emails Card:** An AI-powered widget that scans your Gmail for important, non-sensitive emails and summarizes them on your dashboard.
    *   **Data Backup & Restore:** Export your entire account to a JSON file and import it later to restore your data.
*   **Advanced User Experience:**
    *   **Multi-Account Support:** Sign in with Email/Password, Google, or Phone. Includes a fast account-switching feature to easily move between known Google accounts.
    *   **Push Notifications:** Receive timely, native browser notifications for upcoming events and deadlines.
    *   **Extensive Customization:** Personalize the entire app's appearance, from themes and custom backgrounds to unique "frosted glass" UI effects.
    *   **Intelligent Command Palette:** A powerful, keyboard-accessible palette (Ctrl+K) for quick navigation, plugin management, user search (`@`), and conversational AI event creation.
    *   **Floating Desktop Navigation**: In full-screen mode on desktop, a floating navigation bar provides quick access to the command palette.

## 3. Link to Prototype

You can view and interact with the live prototype of the application here:

**[http://futuresight-8ebba4468907.herokuapp.com](http://futuresight-8ebba4468907.herokuapp.com)**

## 4. Technologies & Frameworks Used

This project utilizes a suite of modern technologies to deliver a robust, intelligent, and scalable experience:

### Google Technologies

*   **Google AI (Gemini Pro & Gemini Flash via Genkit):** The core intelligence of the application, used for generating career plans, daily schedules, parsing natural language, and summarizing content.
*   **Firebase:** Serves as the complete backend infrastructure.
    *   **Firebase Authentication:** Provides secure user management (Email, Google, Phone).
    *   **Firestore:** A scalable NoSQL database for all user data and real-time signaling.
    *   **Firebase Cloud Messaging:** Powers the native browser push notifications.
    *   **Firebase App Hosting:** The project is configured for seamless deployment on Firebase.
*   **Google Workspace APIs:**
    *   **Google Calendar API, Google Tasks API, Gmail API:** To sync a user's digital life into the app.
*   **Google Fonts:** Using 'Inter' for body text and 'Space Grotesk' for headlines.

### Core Tech Stack

*   **Next.js:** A React framework for building full-stack web applications with a focus on performance and developer experience.
*   **React:** A JavaScript library for building user interfaces with a component-based architecture.
*   **TypeScript:** A statically typed superset of JavaScript that adds type safety to the codebase.
*   **Genkit:** The open-source AI framework from Google used to build all generative AI features.
*   **WebRTC:** For peer-to-peer real-time video and audio communication.

### UI & Styling

*   **ShadCN UI:** A collection of beautifully designed, accessible, and reusable components.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **Lucide React:** A comprehensive library of clean and consistent icons.
*   **Framer Motion:** Used for animations and interactive elements.
*   **Date-fns:** A modern and lightweight library for date manipulation.

## 5. Getting Started

To get started with local development, first install the dependencies:

```bash
npm install
```

Next, create a `.env` file in the root of your project. You can see all the required variables in the "Environment Variables" section below.

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## 6. Environment Variables

To run this project, you will need to create a `.env` file and add the following variables. The `app.json` file in this repository also serves as a reference.

```
# Google AI/Gemini API Key
GEMINI_API_KEY=

# Google OAuth for Calendar/Gmail Sync (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# VAPID key for Firebase Cloud Messaging (Web Push)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Razorpay for Subscriptions (Optional)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PLAN_ID_MONTHLY=
RAZORPAY_PLAN_ID_YEARLY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# The public URL of your deployed application
# e.g., https://your-app-name.web.app
NEXT_PUBLIC_BASE_URL=
```

## 7. Deployment

### Firebase App Hosting

This application is pre-configured for deployment on **Firebase App Hosting**.

The `apphosting.yaml` file is already set up. To deploy your app, you will need to have the Firebase CLI installed and be logged into your Firebase account. You can then follow the [official Firebase App Hosting documentation](https://firebase.google.com/docs/app-hosting/deploy-nextjs) to get your site live.

### Heroku Deployment

You can also deploy this application to Heroku with a single click using the button below. Heroku will automatically detect the `app.json` file and guide you through setting up the required environment variables.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/AshishYesale7/Calendar.ai/tree/master)

## 8. Documentation

For comprehensive information about this repository, please refer to these detailed documentation files:

- **[Update Catalog](./src/updates-catalog.md)** - A summary of all recent features, enhancements, and bug fixes.
- **[Repository Summary](./REPOSITORY_SUMMARY.md)** - Quick overview and key highlights
- **[Repository Explanation](./REPOSITORY_EXPLANATION.md)** - Comprehensive project documentation
- **[Technical Architecture](./TECHNICAL_ARCHITECTURE.md)** - Detailed technical specifications and architecture diagrams

These documents provide in-depth coverage of the project's architecture, features, development guidelines, and deployment strategies.

 
---

## ✅ **Feature List: Encryption, Architecture & AI System**

### 🔐 **Encryption & Security**

* [x] AES-256-GCM encryption for all sensitive data
* [x] Field-level encryption for PII, tokens, and API keys
* [x] bcrypt password hashing (12 rounds)
* [x] Secure token generation with integrity verification
* [x] Key rotation and versioning support
* [x] Environment variable isolation for secrets
* [x] Token encryption before database storage
* [x] Automatic token refresh and expiry handling
* [x] Secure state parameter generation for OAuth2
* [x] User consent verification and revocation logic

---

### 🧱 **Database Architecture (Hybrid Model)**

* [x] Current: Firestore (NoSQL)
* [x] Added: PostgreSQL for structured & relational data
* [x] Redis for caching, session storage, and rate limiting
* [ ] Future: Elasticsearch for intelligent search
* [x] Migration path defined from Firestore → PostgreSQL
* [x] Analytics-ready schema with referential integrity
* [x] Cost optimization (40–60% savings projected)

---

### 🤖 **AI Provider & Model System**

* [x] Multi-LLM Provider System (6 supported: OpenAI, Anthropic, DeepSeek, Grok, Mistral, Perplexity)
* [x] Dual API Key support (User-managed or Pro-managed keys)
* [x] Smart Routing (auto-select provider based on subscription tier)
* [x] Token & usage tracking per provider
* [x] Global provider switching (webapp-wide)
* [x] Fallback mechanism for provider downtime

---

### 💳 **Subscription & Monetization**

* [x] Free Plan: Basic Gemini access (50K tokens/month)
* [x] Pro Plan ($20/mo): All providers with managed keys (5M tokens/month)
* [x] Enterprise Plan ($100/mo): Unlimited usage
* [x] Real-time usage analytics and cost tracking
* [x] Billing integration (Stripe/RevenueCat ready)

---

### 🔗 **MCP (Model Context Protocol) Integration**

* [x] OAuth2 Authentication: Google Calendar, Gmail, Notion, Slack, GitHub
* [x] API Key Authentication: Linear, others
* [x] Encrypted token storage (AES-256-GCM)
* [x] AI tool execution for connected services
* [x] Automatic connection status tracking

**Connected Services Examples:**

* “Create a calendar event” → Google Calendar
* “Search my emails” → Gmail
* “Create a Notion page” → Notion
* “Send Slack message” → Slack
* “Create GitHub issue” → GitHub

---

### 💬 **Advanced Chat Interface**

* [x] Multi-model response comparison
* [x] File integration (Local, Google Drive, OneDrive)
* [x] Persistent chat sessions with Firebase
* [x] Speed, cost, and token metrics per conversation
* [x] Rich markdown and code highlighting

---

### ⚙️ **Global Configuration & Performance**

* [x] User-level preference persistence
* [x] Fallback when APIs fail
* [x] Hybrid database migration plan
* [x] Redis-based caching for response optimization
* [ ] DataDog/New Relic integration for performance tracking

---

### 💰 **Expected Benefits**

* [x] 40–60% lower scaling cost
* [x] 10× faster query performance
* [x] Enterprise-grade encryption (AES-256-GCM)
* [x] Dual API key flexibility
* [x] Scalability to 100K+ users

---

## 📋 **Checklist: Missing & Pending Features**

| Area                     | Missing Feature                      | Priority  | Status |
| ------------------------ | ------------------------------------ | --------- | ------ |
| 🎤 Voice Integration     | Voice commands ("Hey Orb" trigger)   | 🔥 High   | ☐      |
|                          | Text-to-speech (TTS)                 | 🔥 High   | ☐      |
|                          | Voice-activated AI operations        | 🔥 High   | ☐      |
| 🔔 Notifications         | Integration with AI chat system      | 🔥 High   | ☐      |
|                          | AI-enhanced contextual notifications | 🟡 Medium | ☐      |
| 📱 Mobile & PWA          | Mobile-optimized responsive layout   | 🔥 High   | ☐      |
|                          | Touch gestures for upload/workflows  | 🟡 Medium | ☐      |
|                          | PWA manifest & service worker        | 🔥 High   | ☐      |
|                          | Offline capabilities                 | 🔥 High   | ☐      |
| 🔍 Search & Discovery    | Global AI-powered search             | 🔥 High   | ☐      |
|                          | Search across chats/files/workflows  | 🔥 High   | ☐      |
|                          | Smart suggestions & filters          | 🟡 Medium | ☐      |
| 👥 Collaboration         | Share chat/workflows                 | 🔥 High   | ☐      |
|                          | Real-time team collaboration         | 🔥 High   | ☐      |
|                          | Team workspace setup                 | 🟡 Medium | ☐      |
| 📊 Analytics Dashboard   | AI provider usage insights           | 🔥 High   | ☐      |
|                          | Cost & performance metrics           | 🔥 High   | ☐      |
|                          | Productivity and user analytics      | 🟡 Medium | ☐      |
| 🔐 Security Enhancements | Two-factor authentication            | 🔥 High   | ☐      |
|                          | Audit logs & access tracking         | 🔥 High   | ☐      |
|                          | Data retention & deletion policies   | 🟡 Medium | ☐      |
|                          | Role-based permissions               | 🔥 High   | ☐      |
| 🌍 Internationalization  | Multi-language support               | 🟡 Medium | ☐      |
|                          | RTL & localized responses            | 🟢 Low    | ☐      |
| ♿ Accessibility          | Screen reader (ARIA) support         | 🟡 Medium | ☐      |
|                          | Keyboard navigation                  | 🟡 Medium | ☐      |
|                          | High-contrast theme                  | 🟢 Low    | ☐      |
|                          | Voice navigation for accessibility   | 🟢 Low    | ☐      |
| 🔌 Plugin System         | Third-party plugin architecture      | 🔥 High   | ☐      |
|                          | Custom AI model integration          | 🔥 High   | ☐      |
|                          | Developer API for extensions         | 🔥 High   | ☐      |

---

### 🧩 **Most Critical Missing Features to Complete the AI Workspace**

1. **Voice Integration Layer** — natural interaction with voice wake word, TTS, and speech recognition.
2. **AI Notification Engine** — connect the event/notification system to the chat intelligence layer.
3. **PWA + Mobile Optimization** — offline-ready, mobile-first interface.
4. **Advanced Search & Analytics** — unify data discovery and performance insights.
5. **Team Collaboration System** — shared workflows, co-editing, permissions, audit logs.
6. **Plugin/Extension Architecture** — empower third-party developers and internal automation.

---
 

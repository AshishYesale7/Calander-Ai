
# FutureSight: Your AI-Powered Career Calendar

Welcome to FutureSight, an intelligent planning application designed to help ambitious students and young professionals navigate the complexities of career development. This isn't just a calendar; it's a proactive assistant that helps you manage your time, track your goals, and build a clear path to success with the help of powerful AI.

## 1. The Problem: Overcoming Student Overwhelm

For college students and early-career individuals, the path forward is often a chaotic mix of academic deadlines, skill development, exam preparation, and long-term career aspirations. Juggling these competing priorities is a significant challenge. Key problems include:

*   **Information Overload:** Students are bombarded with information about exams (like GATE, GRE, CAT), internship opportunities, new technologies, and necessary skills (DSA, AI, WebDev), making it difficult to know what to focus on.
*   **Time Management Deficit:** Traditional calendars are passive. They show you *what* you have to do, but they don't help you figure out *how* to get it all done. Students struggle to balance classes, studying, projects, and personal growth, often leading to burnout or missed opportunities.
*   **Lack of a Cohesive Strategy:** It's easy to get lost in the day-to-day grind. Connecting daily tasks to long-term career goals is often an abstract concept, leaving students feeling directionless. They may track their goals in one place, their skills in another, and their deadlines in a third, with no unified view of their progress.
*   **Reactive vs. Proactive Planning:** Most planning happens in response to an impending deadline. FutureSight aims to solve this by providing predictive insights and structured plans. It analyzes your past activities, current commitments, and future goals to help you not just manage your present but actively build your future. By structuring a clear, AI-assisted plan, it turns the daunting task of career planning into a manageable, day-by-day journey.

FutureSight addresses this by creating a single, intelligent ecosystem where every task, every goal, and every learning resource is part of a larger, personalized career strategy.

## 2. The Solution: An Overview of FutureSight

FutureSight is a web application built with a modern tech stack, designed to be a student's central hub for all academic and career-related planning. It leverages Google's Gemini AI to provide intelligent, actionable insights that transform a simple calendar into a dynamic career co-pilot.

### Key Features:

*   **AI-Powered Dashboard & Timeline:** The core of the app. It syncs with your Google Calendar and Tasks to pull in existing events. It features multiple views:
    *   **Calendar View:** A traditional monthly calendar with dots indicating event days.
    *   **Day Timetable View:** A detailed, hourly breakdown for any selected day, visualizing overlapping events.
    *   **Sliding Timeline View:** A chronological, vertical feed of upcoming and past events.
    *   **List View:** A simple, scannable list of all events.
*   **Smart Daily Plan:** At the start of each day, the AI generates a personalized plan, including a detailed schedule, achievable micro-goals based on your long-term aspirations, and critical reminders.
*   **Career Vision Planner:** A standout feature where you describe your passions and career aspirations in natural language. The AI then generates a comprehensive, multi-faceted career plan, including a vision statement, key strengths, development areas (technical, soft, and hard skills), an actionable multi-step roadmap, and suggested learning resources.
*   **Goal & Skill Tracking:** Dedicated sections to define and monitor your career goals (with progress trackers and deadlines) and to log the skills you're acquiring, complete with proficiency levels. Items from the AI-generated Career Vision can be added here with a single click.
*   **Intelligent Integrations:**
    *   **Google Sync:** Seamlessly syncs with Google Calendar and Google Tasks.
    *   **Important Emails Card:** An AI-powered widget that scans your Gmail for important, non-sensitive emails, summarizes them, and displays them on your dashboard to ensure you don't miss key information. It intelligently filters out OTPs, password resets, and other security-related emails.
*   **Personalized News & Resources:**
    *   A news feed that can be filtered by interests like "AI," "Internships," or "GATE" to keep you updated on relevant topics. Articles can be summarized by the AI.
    *   A resources page where you can bookmark your own learning materials and also receive AI-generated suggestions based on your unique goals and skills.
*   **Advanced User Experience:**
    *   **Multi-Method Authentication:** Secure sign-up and sign-in using email/password, Google, or phone number (OTP).
    *   **Push Notifications:** Receive timely, native browser notifications for upcoming events and deadlines so you never miss an important date.
    *   **Extensive Customization:** Personalize the entire app's appearance, from light/dark themes to custom background images, solid colors, and five unique "frosted glass" UI effects with granular controls.
    *   **Command Palette:** A powerful, keyboard-accessible palette (Ctrl+K) to quickly navigate the app, perform actions, and even create calendar events from natural language prompts (e.g., "Schedule a meeting with the team tomorrow at 2 PM").
    *   **Enhanced Trash Management:** A dedicated trash panel allows you to review recently deleted items. It features bulk actions to restore or permanently delete multiple items at once.

## 3. Link to Prototype

You can view and interact with the live prototype of the application here:

**[http://futuresight-8ebba4468907.herokuapp.com](http://futuresight-8ebba4468907.herokuapp.com)**

## 4. Technologies & Frameworks Used

This project utilizes a suite of modern technologies to deliver a robust, intelligent, and scalable experience:

### Google Technologies

*   **Google AI (Gemini Pro & Gemini Flash via Genkit):** The core intelligence of the application, used for generating career plans, daily schedules, parsing natural language, and summarizing content.
*   **Firebase:** Serves as the complete backend infrastructure.
    *   **Firebase Authentication:** Provides secure user management (Email, Google, Phone).
    *   **Firestore:** A scalable NoSQL database for all user data.
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

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/AshishYesale7/FutureSight/tree/master)

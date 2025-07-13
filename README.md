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

FutureSight is a web application built with Next.js, React, and Firebase, designed to be a student's central hub for all academic and career-related planning. It leverages Google's Gemini AI to provide intelligent, actionable insights that transform a simple calendar into a dynamic career co-pilot.

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
    *   **Extensive Customization:** Personalize the entire app's appearance, from light/dark themes to custom background images, solid colors, and five unique "frosted glass" UI effects with granular controls.
    *   **Command Palette:** A powerful, keyboard-accessible palette (Ctrl+K) to quickly navigate the app, perform actions, and even create calendar events from natural language prompts (e.g., "Schedule a meeting with the team tomorrow at 2 PM").

## 3. Link to Prototype

You can view and interact with the live prototype of the application here:

**[http://futuresight-8ebba4468907.herokuapp.com](http://futuresight-8ebba4468907.herokuapp.com)**

## 4. Google Technologies Used

This project extensively utilizes a suite of Google technologies to deliver a robust, intelligent, and scalable experience:

*   **Google AI (Gemini Pro & Gemini Flash):** The core intelligence of the application. Gemini models are used for:
    *   Generating comprehensive, long-form career vision plans.
    *   Creating structured daily plans by analyzing user data.
    *   Parsing natural language to create calendar events via the command palette.
    *   Summarizing news articles and important emails.
    *   Suggesting relevant learning resources based on user profiles.
*   **Firebase:** Serves as the complete backend infrastructure for the application.
    *   **Firebase Authentication:** Provides secure and flexible user management with support for email/password, Google Sign-In, and phone number (OTP) authentication.
    *   **Firestore:** A scalable NoSQL database used to store all user data, including timeline events, career goals, skills, custom themes, and user preferences.
    *   **Firebase App Hosting:** The project is configured for seamless deployment and hosting on Firebase's modern, secure infrastructure for web apps.
*   **Google Workspace APIs:** The application integrates with key Google services to unify a user's digital life.
    *   **Google Calendar API:** To sync events to and from the user's primary calendar.
    *   **Google Tasks API:** To fetch, display, and manage a user's to-do lists directly within the application.
    *   **Gmail API:** Used to read metadata and snippets from a user's inbox, which are then processed by the AI to identify and summarize important communications.
*   **Google Fonts:** The application's typography relies on Google Fonts, using 'Inter' for body text and 'Space Grotesk' for headlines to create a clean and modern aesthetic.

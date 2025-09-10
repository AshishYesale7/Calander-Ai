# FutureSight: Feature & Update Catalog

This document provides a comprehensive overview of all new features, enhancements, and bug fixes implemented in the FutureSight application.

---

## 1. Core Feature Enhancements

### 1.1. Calendar & Timeline Overhaul

The primary timeline and calendar views have been significantly upgraded for better usability and interactivity.

- **Maximized Weekly Planner:** The daily timetable can now be expanded into a full-screen weekly planner. This view provides a comprehensive overview of the entire week.
- **Accurate Event Rendering:** The layout logic has been completely re-engineered to accurately position events in their correct time slots, with robust handling for overlapping events to prevent visual glitches.
- **Sticky Headers & Scrolling:** The week view now features a "sticky" day header that stays visible while the user scrolls vertically through the 24-hour timeline, ensuring context is never lost. The vertical scrolling has also been fixed to be smooth and reliable.
- **Interactive Event Popovers:** Hovering over any event in the day or week view now displays a detailed popover with the full event title, notes, and one-click buttons to either **Edit** or **Delete** the event, streamlining schedule management.
- **All-Day Events Area:** A dedicated "All-day" section has been added to the top of the weekly planner, ensuring that all-day events are clearly visible and separated from the hourly schedule.
- **Full-Width Time Indicator:** The visual line indicating the current time now correctly spans the entire width of the weekly view, including the hour labels, for better readability.

### 1.2. Plugin System & Extension Marketplace

A modular plugin system has been introduced to extend the core functionality of FutureSight.

- **Marketplace UI (`/extension`):** A dedicated page now serves as a central hub for users to discover, install, and manage plugins.
- **Dynamic Installation & Persistence:** Users can install or uninstall plugins with a single click, and their selections are saved to their cloud profile.
- **Plugin Component Loading:** The system dynamically loads the main component of any active plugin into a full-screen view for an immersive experience.

### 1.3. Codefolio Ally Plugin

The flagship extension for competitive programmers and software engineering students.

- **Unified Dashboard:** Fetches and aggregates user statistics from Codeforces, LeetCode, and CodeChef.
- **Visualizations:** Includes a GitHub-style contribution graph and a weekly target tracker to encourage consistent practice.
- **Contest Integration:** Automatically fetches and allows one-click adding of upcoming Codeforces contests to the user's timeline.

### 1.4. User Profiles & Social Features

- **Public Profiles (`/profile/[username]`):** Every user has a dedicated, shareable profile page showing their bio, social links, and activity streak.
- **Follow System:** Users can follow and unfollow each other, with follower/following counts displayed on their profile.
- **Leaderboard Integration:** The leaderboard is now more interactive, with each user entry linking directly to their public profile.

---

## 2. UI/UX Improvements

### 2.1. Command Palette Overhaul

The command palette (`Ctrl+K`) has been transformed into a central navigation and action hub.

- **Full Plugin Integration:** Dynamically lists all plugins and allows for installation or opening directly from the palette.
- **User Search (`@`):** Instantly search for and navigate to any user's profile.
- **AI Fallback:** If a query doesn't match a command, it seamlessly transitions to a conversational AI assistant.

### 2.2. General UI & Theming

- **Collapsible Sidebar:** The main navigation sidebar is now collapsible to maximize content view, with its state saved per-device.
- **Header Popovers:** The streak and extensions icons in the header now feature rich popover menus for quick-look information, with an improved hover delay for better usability.
- **Advanced Theming:** Added new "glassmorphism" effects like "Grainy Frosted" and "Water Droplets" to the theme customizer.

---

## 3. Bug Fixes & Refinements

### 3.1. Calendar & Timeline Bug Fixes

- **Event Positioning:** Corrected a critical bug where timed events in the weekly view were not being placed in their correct hourly slots.
- **Layout & Scrolling:** Fixed issues in the weekly planner where the all-day events section was collapsed and vertical scrolling was disabled.
- **Runtime Errors:** Resolved multiple `isSameDay is not defined` and `isToday is not defined` errors by correcting the import statements in `DayTimetableView.tsx`, preventing component crashes.

### 3.2. User Search Functionality

- **Definitive Fix:** A dedicated `searchableIndex` field was added to user profiles in Firestore to enable efficient, case-insensitive searching via the command palette.

### 3.3. Plugin System Fixes

- **Layout & Import Errors:** Fixed a bug causing the Contribution Graph to be missing from the Codefolio dashboard and resolved an import error for the `usePlugin` hook.
- **Placeholder Correction:** Corrected a bug where uninstalled plugins incorrectly displayed the Bookshelf UI, now showing a generic "Under Construction" placeholder.

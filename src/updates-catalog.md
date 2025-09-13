# FutureSight: Feature & Update Catalog

This document provides a comprehensive overview of all new features, enhancements, and bug fixes implemented in the FutureSight application.

---

## 1. Core Feature Enhancements

### 1.1. Calendar & Timeline Overhaul

The primary timeline and calendar views have been significantly upgraded for better usability and interactivity.

- **Maximized Weekly Planner:** The daily timetable can now be expanded into a full-screen weekly planner. This view provides a comprehensive overview of the entire week.
- **Interactive Drag-and-Drop**: Events in the planner can now be interactively moved and resized.
  - **Drag to Move & Resize**: In both Day and Week views, you can now click and drag an event to change its time or drag the bottom handle to adjust its duration.
  - **Visual Feedback**: During drag operations, a semi-transparent "ghost" preview of the event appears, showing its new position and size in real-time.
  - **Sidebar Integration**: Tasks can be dragged from the sidebar directly onto the planner grid to create new events.
- **Accurate Event Rendering:** The layout logic has been completely re-engineered to accurately position events in their correct time slots, with robust handling for overlapping events to prevent visual glitches.
- **Sticky Headers & Scrolling:** The week view now features a "sticky" day header that stays visible while the user scrolls vertically through the 24-hour timeline, ensuring context is never lost.
- **Interactive Event Popovers:** Hovering over any event in the day or week view now displays a detailed popover with the full event title, notes, and one-click buttons to either **Edit** or **Delete** the event, streamlining schedule management.
- **All-Day Events Area:** A dedicated "All-day" section has been added to the top of the weekly planner, ensuring that all-day events are clearly visible and separated from the hourly schedule.

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

### 3.1. Planner Stability Fixes

- **Drag-and-Drop Logic**: Resolved a critical issue where drag-and-drop operations were not being correctly handled in the Day View, making events unmovable.
- **Missing Drag Previews**: Fixed a bug where the "ghost" preview was not appearing when dragging items from the sidebar onto the planner.
- **Planner Crash (AlertDialogTrigger)**: Corrected a runtime error caused by a missing `AlertDialogTrigger` import in `PlannerDayView.tsx`, which prevented the delete confirmation dialog from working.
- **Planner Crash (onDragOver)**: Fixed a crash in the Weekly View by correctly passing the `onDragOver` prop, which was previously named incorrectly.

### 3.2. General Stability

- **Event Positioning:** Corrected a critical bug where timed events in the weekly view were not being placed in their correct hourly slots.
- **User Search Functionality:** A dedicated `searchableIndex` field was added to user profiles in Firestore to enable efficient, case-insensitive searching via the command palette.
- **Plugin System Fixes:** Fixed layout and import errors related to the Codefolio Ally plugin and corrected a bug with placeholder UIs for uninstalled plugins.
# Calendar.ai: Feature & Update Catalog

This document provides a comprehensive overview of all new features, enhancements, and bug fixes implemented in the Calendar.ai application.

---

## 1. Core Feature Enhancements

### 1.1. Calendar & Planner Overhaul

The primary timeline and calendar views have been significantly upgraded for better usability and interactivity.

- **Maximized Weekly Planner:** The daily timetable can now be expanded into a full-screen, multi-panel weekly planner. This view provides a comprehensive overview of the entire week, alongside integrated tools.
- **Gmail Integration**: Within the maximized planner, users can now open a dedicated Gmail panel to view, summarize, and act on important emails without leaving their schedule.
- **Interactive Drag-and-Drop**: Events in the planner can now be interactively moved and resized.
  - **Drag to Move & Resize**: In both Day and Week views, you can now click and drag an event to change its time or drag the bottom handle to adjust its duration.
  - **Visual Feedback**: During drag operations, a semi-transparent "ghost" preview of the event appears, showing its new position and size in real-time.
  - **Sidebar Integration**: Tasks and emails can be dragged from the sidebars directly onto the planner grid to create new events.
- **Accurate Event Rendering:** The layout logic has been re-engineered to accurately position events, with robust handling for overlapping events to prevent visual glitches.
- **Sticky Headers & Scrolling:** The week view features a "sticky" day header that stays visible while scrolling vertically through the 24-hour timeline.
- **Interactive Event Popovers:** Hovering over any event in the day or week view now displays a detailed popover with one-click buttons to **Edit** or **Delete** the event.

### 1.2. Plugin System & Extension Marketplace

A modular plugin system has been introduced to extend the core functionality of Calendar.ai.

- **Marketplace UI (`/extension`):** A dedicated page now serves as a central hub for users to discover, install, and manage plugins.
- **Dynamic Installation & Persistence:** Users can install or uninstall plugins with a single click, and their selections are saved to their cloud profile.

### 1.3. User Profiles & Social Features

- **Public Profiles (`/profile/[username]`):** Every user has a dedicated, shareable profile page showing their bio, social links, and activity streak.
- **Follow System:** Users can follow and unfollow each other, with follower/following counts displayed on their profile.
- **Leaderboard Integration:** The leaderboard is now more interactive, with each user entry linking directly to their public profile.

### 1.4. Data Management

- **Import/Export Functionality**: Users can now export all their account data (goals, skills, events, etc.) to a single JSON file from the Settings menu.
- **Account Restore**: Users can import a previously exported backup file to fully restore their account state.

---

## 2. UI/UX Improvements

### 2.1. Command Palette Overhaul

The command palette (`Ctrl+K`) has been transformed into a central navigation and action hub.

- **Full Plugin Integration:** Dynamically lists all plugins and allows for installation or opening directly from the palette.
- **User Search (`@`):** Instantly search for and navigate to any user's profile.
- **AI Fallback:** If a query doesn't match a command, it seamlessly transitions to a conversational AI assistant.

### 2.2. General UI & Theming

- **Collapsible Sidebar:** The main navigation sidebar is now collapsible to maximize content view, with its state saved per-device.
- **Header Popovers:** The streak and extensions icons in the header now feature rich popover menus for quick-look information.

---

## 3. Backend & Stability

### 3.1. Activity Logging System

- **Comprehensive Tracking**: A new `activityLogService` has been integrated to capture a wide range of user actions, including adding goals, completing tasks, fetching coding stats, and generating AI plans.
- **Future Analytics**: This system lays the groundwork for future features like personalized insights and activity-based recommendations.

### 3.2. Bug Fixes & Refinements

- **Planner Stability Fixes**:
  - **Drag-and-Drop Logic**: Resolved critical issues where drag-and-drop operations were not being correctly handled in the Day and Week Views, making events unmovable.
  - **Missing Drag Previews**: Fixed a bug where the "ghost" preview was not appearing when dragging items from the sidebar onto the planner.
  - **Planner Crashes**: Corrected multiple runtime errors related to missing component imports (`AlertDialogTrigger`) and incorrect prop names (`onDragOver`), preventing component crashes.
- **General Stability**: Refined state management for drag-and-drop actions to prevent inconsistent states and improve reliability.
- **Event Positioning:** Corrected a bug where timed events in the weekly view were not being placed in their correct hourly slots.
- **User Search Functionality:** A dedicated `searchableIndex` field was added to user profiles in Firestore to enable efficient, case-insensitive searching.

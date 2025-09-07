
# FutureSight: Feature & Update Catalog

This document provides a comprehensive overview of all new features, enhancements, and bug fixes implemented in the FutureSight application since our last major architectural discussion.

---

## 1. Core Feature Enhancements

### 1.1. Plugin System & Extension Marketplace

A modular plugin system has been introduced to extend the core functionality of FutureSight.

- **Marketplace UI (`/extension`):** A dedicated page now serves as a central hub for users to discover, install, and manage plugins. It features a clean, grid-based layout that separates installed plugins from available ones in the marketplace.
- **Dynamic Installation:** Users can install or uninstall plugins with a single click. The UI provides immediate feedback, changing the action from "Install" to "Open" upon successful installation.
- **Plugin Persistence:** A user's list of installed plugins is now saved to their cloud profile, ensuring a consistent experience across all devices.
- **Plugin Component Loading:** The system is designed to dynamically load the main component of any active plugin into a full-screen view, providing an immersive, app-like experience for each extension.

### 1.2. Codefolio Ally Plugin

The flagship extension for competitive programmers and software engineering students.

- **Unified Dashboard:** Fetches and aggregates user statistics from Codeforces, LeetCode, and CodeChef into a single, cohesive dashboard.
- **Contribution Graph:** A GitHub-style contribution graph provides a year-long overview of daily coding submissions, offering a powerful visualization of consistency.
- **Weekly Target Tracker:** A visual chart helps users track their problem-solving progress for each day of the week, encouraging the formation of consistent coding habits.
- **Contest Integration:** The dashboard automatically fetches upcoming Codeforces contests, and users can add any contest directly to their timeline with a single click.

### 1.3. User Profiles & Social Features

Public user profiles have been introduced to foster a sense of community.

- **Public Profiles (`/profile/[username]`):** Every user now has a dedicated, shareable profile page that showcases their display name, bio, social links, and activity streak.
- **Follow System:** Users can now follow and unfollow each other. The profile page dynamically displays follower and following counts.
- **Leaderboard Integration:** The leaderboard is now more interactive, with each user entry linking directly to their public profile.

### 1.4. Enhanced Notification System

The notification system has been significantly upgraded to be more robust and informative.

- **Real-time In-App Notifications:** A new notification panel in the header provides real-time updates for important events like new followers.
- **Push Notifications:** The application can now request permission to send native browser push notifications for critical reminders and events.
- **Centralized Service:** A dedicated `notificationService` and `sendNotification` flow have been created to handle both in-app and push notifications, ensuring a consistent and scalable system.

---

## 2. UI/UX Improvements

### 2.1. Command Palette Overhaul

The command palette (`Ctrl+K`) has been transformed into a central navigation and action hub.

- **Full Plugin Integration:** The palette dynamically lists all available plugins. It intelligently displays "Open" for installed plugins and "Install" for uninstalled ones, allowing for seamless management.
- **User Search (`@`):** Typing `@` now activates a user search mode, immediately suggesting a list of all users in the database. This allows for quick navigation to any user's profile.
- **AI Fallback:** If a typed query doesn't match any built-in command, the palette now prompts the user to "Ask AI anything," seamlessly transitioning to a conversational AI assistant for event creation.

### 2.2. GSuite Dashboard Redesign

- **Google-Inspired UI:** The GSuite plugin dashboard has been completely redesigned to align with the clean, minimalist aesthetic of Google's services, featuring a two-column layout and Google's signature color palette.
- **Functional Mockup:** The dashboard now includes a "Recently Linked Files" section with mock data, providing a clear and functional representation of how the feature will work.

### 2.3. General UI & Theming

- **Collapsible Sidebar:** The main navigation sidebar is now collapsible, allowing users to maximize their content viewing area. Its state (expanded/collapsed) is saved per-device.
- **Header Popovers:** The streak counter and extensions button in the header now feature rich popover menus on hover, providing quick-look information without leaving the current page.
- **Advanced Theming:** The "Customize Theme" modal now includes options for new "glassmorphism" effects, including "Grainy Frosted" and "Water Droplets," with granular controls for blur, opacity, and other visual parameters.

---

## 3. Bug Fixes & Refinements

### 3.1. User Search Functionality

The user search feature in the command palette has been completely re-engineered to be robust and reliable.

- **Initial Bug:** The search was case-sensitive and did not return results unless the exact case was matched.
- **Faulty Attempts:** Several attempts to fix this with client-side logic or complex queries were unsuccessful.
- **Definitive Fix:** A dedicated `searchableIndex` field (containing lowercase versions of `displayName` and `username`) has been added to each user's profile in Firestore. The backend `searchUsers` function now uses a single, efficient, and case-insensitive query against this index. A lazy migration was also implemented in the `getUserProfile` function to ensure all existing users have this index created.

### 3.2. Codefolio Dashboard Layout

- **Missing Contribution Graph:** A bug that caused the Contribution Graph to be completely absent from the Codefolio dashboard has been fixed. The component's layout has been corrected to ensure all elements, including the graph, are displayed prominently.

### 3.3. Command Palette & Plugin Errors

- **`usePlugin` Import Error:** A build error caused by an incorrect import path for the `usePlugin` hook in the Command Palette has been resolved.
- **`e.stopPropagation` Runtime Error:** A runtime error that occurred when installing a plugin from the command palette has been fixed. The `handlePluginInstall` function was simplified to remove the unnecessary event parameter that was causing the crash.

### 3.4. Placeholder Plugin Correction

- **Incorrect UI:** A bug where all uninstalled plugins incorrectly displayed the `BookshelfDashboard` UI has been fixed. A new, generic `PlaceholderDashboard` component was created and is now correctly used for all plugins that do not have a full UI implementation.

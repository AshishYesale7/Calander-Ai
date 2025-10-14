# Calendar.ai: Feature & Update Catalog (July 21, 2024)

This document provides a comprehensive overview of all new features, enhancements, and bug fixes implemented in the Calendar.ai application.

---

## 1. New User Onboarding Flow

A guided, multi-step process was implemented to improve the experience for new users and ensure their profiles are set up correctly from the very beginning.

-   **Functionality:** Upon first sign-in, new users are now presented with a mandatory modal that walks them through profile creation and permission requests.
-   **Step 1 (Profile Setup):** Users set their display name, choose a unique `@username` (with real-time availability validation), and select a pre-designed 3D avatar. This step also includes a crucial check requiring users who sign up with only a phone number to link a Google account, ensuring access to all app features.
-   **Step 2 (Permissions):** The flow politely requests browser permissions for Notifications, Camera/Microphone, and Location to enable key features upfront.
-   **Step 3 (Confirmation):** A final welcome screen confirms the setup is complete and informs the user that their 30-day free trial has started.
-   **Backend Integration:** The `AuthContext` was updated to track an `onboardingCompleted` flag from the user's profile. The main app layout uses this flag to conditionally render the onboarding modal, ensuring it only appears for new users.

---

## 2. Real-time Communication Suite

The app's real-time features were significantly expanded from basic text chat to a full communication suite, including audio/video calls and a complete call history.

-   **Voice Calling:**
    -   **UI/UX:** A new, compact UI for audio calls appears as an overlay, allowing users to navigate the app while on a call. It features the user's avatar with a sound-wave visualization, mute controls, and an end-call button.
    -   **Backend:** The existing WebRTC and Firestore signaling backend was extended to support an `'audio'` call type.

-   **Unified Chat & Call History:**
    -   **UI/UX:** Call records (missed, incoming, outgoing) are now displayed directly within the `ChatPanel` message stream, interspersed chronologically with text messages. A new "Calls" tab was added to the chat sidebar to view a dedicated call log.
    -   **Backend:** `chatService.ts` was updated to fetch both chat messages and call documents from Firestore. The `ChatPanel` now merges and sorts these two data streams to create the unified history.

-   **Chat UI Enhancements:**
    -   **Message Timestamps & Date Separators:** Each chat bubble now includes a timestamp, and date separators are automatically added between messages sent on different days.
    -   **"Tailed" Message Bubbles & Optimized Avatars:** The UI was refined to group consecutive messages from the same user, showing the sender's avatar and a message "tail" only on the last message in a block.

-   **Contextual Menus & Message Deletion:**
    -   **Functionality:** Users can now right-click a message to "Copy" it. For messages they've sent, a "Delete" option is available.
    -   **Delete for Everyone:** When deleting a message, users can now choose to delete it just for themselves or for everyone, in which case the message is replaced with "This message was deleted."

---

## 3. User Profile & Account Management

-   **User Avatar Customization:** A "Customize Avatar" feature was implemented, allowing users to select from a gallery of pre-designed 3D avatars as their profile picture, providing a quick setup option without requiring a photo upload.
-   **Account Deletion & Anonymization:**
    -   **Functionality:** A "Delete My Account" feature was added to the settings panel.
    -   **Process:** This initiates a "soft delete" by anonymizing personal data and disabling the Firebase Auth user, providing a 30-day grace period. During this time, a user can sign back in to "reclaim" their account. After 30 days, a backend process is planned to permanently erase all user content.

---

## 4. Offline Mode & Stability Improvements

This was a major area of focus where several critical bugs related to the offline experience were resolved.

-   **UI Enhancement:** A small, animated "Reconnecting..." indicator bar now appears at the top of the screen when the internet connection is lost, providing clear and non-intrusive feedback.
-   **Bug Fixes:**
    -   **Toast Suppression:** We eliminated incorrect and confusing "Sync Error" popups by making the app's data-fetching logic intelligently detect network failures and handle them silently.
    -   **Offline Page Loading:** The long-standing issue of the browser's default error page appearing on refresh was definitively fixed. We created a static `public/offline.html` page and rewrote the service worker (`public/sw.js`) to reliably serve this page for any failed page navigation.

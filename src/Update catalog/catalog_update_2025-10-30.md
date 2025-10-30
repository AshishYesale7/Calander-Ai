---

# 🧾 **Technical Changelog – 2025-10-30**

> **Scope:** Covers all major updates since the implementation of Picture-in-Picture (PiP) mode — focusing on stability, UX, real-time features, account management, and offline reliability.

---

## 🧭 **1. Multi-Step Onboarding Flow**

### Overview

Introduced a **guided onboarding modal** for new users to streamline profile setup and permissions, ensuring consistent setup before entering the app.

### Key Features

* **Step 1 – Profile Setup**

  * Added input for display name and unique `@username` with **real-time validation** to prevent duplicates.
  * Integrated **3D avatar selection gallery** (male/female variants) for quick profile setup.
  * Enforced **Google account linking** for users registering via phone number only — ensuring complete account access.

* **Step 2 – Permissions**

  * Added sequential requests for browser permissions:

    * Notifications (push alerts)
    * Camera & Microphone (for video/voice calls)
    * Location (for contextual features)
  * Optimized UX to request these politely and sequentially.

* **Step 3 – Confirmation**

  * Displays a personalized welcome message confirming setup.
  * Starts a **30-day free trial** period for new accounts.

### Backend & Integration

* Updated `AuthContext` and user schema to include:

  ```ts
  onboardingCompleted: boolean
  ```
* Modified main layout to conditionally render the onboarding modal based on this flag.
* Persisted user progress in Firestore to prevent repeat onboarding sessions.

---

## 💬 **2. Real-Time Communication Suite**

### 2.1 Voice Calling (Audio)

#### UI/UX

* Introduced **compact floating call overlay**:

  * Displays user avatar + **sound-wave visualization** (reactive to voice input).
  * Includes mute/unmute toggle, end call, and minimal controls.
  * Remains accessible while navigating across app sections.

#### Backend

* Extended existing **WebRTC signaling + Firestore backend**:

  * Added `callType: 'audio'` parameter in call documents.
  * Configured peer connections to request **microphone only** (no video tracks).
  * Implemented bandwidth optimization for audio-only mode.

#### Notifications

* Implemented **incoming/outgoing call notifications** via Firestore listeners.
* Distinct tones and pop-ups for call acceptance/decline events.

---

### 2.2 Call Logs

#### UI

* Added dedicated **"Calls" tab** in sidebar navigation.
* Displays full history of:

  * Incoming, outgoing, and missed audio/video calls.
* Each entry shows:

  * Avatar, name, call type (audio/video), call status, and timestamp.

#### Backend

* Firestore `calls` collection enhancements:

  * Added `participantIds: string[]` for multi-user querying.
  * Persisted `duration` field, computed upon call termination.
* New `fetchUserCalls()` method in `chatService.ts` to efficiently query all related calls.

---

### 2.3 Call State & Reliability Fixes

* **Persistent State:**

  * Implemented `sessionStorage` to store `activeCallId`, enabling seamless recovery after reload.
* **Session Cleanup:**

  * Added `window.beforeunload` listener to safely end calls and update status.
* **Timeout Handling:**

  * Introduced 15-second timeout for unanswered outgoing calls to auto-cancel and notify caller.
* **Ghost Ringing Fix:**

  * Resolved issue where inactive calls remained “ringing” in Firestore.

---

## 💭 **3. Chat UI Enhancements & Unified History**

### 3.1 Integrated Message & Call Timeline

* Redesigned ChatPanel to display **messages and call logs** in a single chronological stream.
* Implemented new `CallLogItem` component rendering:

  * Iconography for call type (`PhoneIncoming`, `PhoneOutgoing`, `PhoneMissed`).
  * Duration & timestamp display inline.
* Merged Firestore queries for `messages` and `calls` → unified sort by timestamp for contextual continuity.

---

### 3.2 Visual & UX Refinements

* **Timestamps:**

  * Added precise timestamps (e.g., “10:42 PM”) to each message bubble.
* **Date Separators:**

  * Auto-inserted labeled dividers (e.g., “September 14, 2025”) for day transitions.
* **Message Bubble Styling:**

  * “Tailed” design — only last message in block has rounded tail; prior ones remain squared for cohesion.
* **Optimized Avatar Display:**

  * Displayed sender avatar only on final message in user block to minimize visual clutter.

---

### 3.3 Message Interactions

* Added **context menu** (right-click / long-press) for per-message actions:

  * `Copy Message`
  * `Delete Message`
* Implemented **“Delete for Everyone”**:

  * When deleting your own message:

    * Option to delete locally or globally.
    * Replaced message with `"This message was deleted"` placeholder in both chat views.
* All actions fully synced across Firestore listeners in real time.

---

## 👤 **4. Account Management & User Data Control**

### 4.1 Avatar Customization

* Added **3D avatar selection modal**:

  * Gallery of pre-rendered avatars for male/female profiles.
  * Simplifies setup and maintains privacy.
* Backend updates in `userService.ts`:

  * Saves selected avatar URL to user document.
  * Deletes old avatar from Firebase Storage to prevent orphaned files.

---

### 4.2 Account Deletion Workflow

#### Functionality

* Introduced **“Delete My Account”** under Settings.

#### Process

1. **Soft Delete:**

   * Anonymizes sensitive fields (`displayName`, `bio`, etc.).
   * Updates status → `PENDING_DELETION`.
   * Disables Firebase Auth user credentials.
2. **Grace Period:**

   * 30-day recovery window before permanent deletion.
3. **Reclamation:**

   * Added `reclaimUserAccount()` to restore anonymized data if user reauthenticates within grace period.
4. **Permanent Deletion (Future):**

   * Planned Cloud Function will periodically purge user data from all sub-collections after 30 days.

---

## 🌐 **5. Offline Experience & Service Worker Overhaul**

### 5.1 Offline Indicator UI

* Implemented **animated “Reconnecting…” banner**:

  * Appears at top center on connection loss.
  * Automatically fades out when connectivity is restored.
  * Compact design (slightly offset to left, refined through multiple iterations).

---

### 5.2 Offline Error Handling Improvements

* **Problem:** Verbose “Sync Error” & “Offline Mode” popups appeared even during normal disconnections.
* **Solution:**

  * Updated error logic in:

    * `ApiKeyContext.tsx`
    * Dashboard & data-fetching modules.
  * Filtered network errors (`TypeError: Failed to fetch`) to handle silently without triggering toast popups.

---

### 5.3 Custom Offline Page Implementation

#### Problem

* Browser displayed default “No Internet” error on reload when offline.

#### Fix Journey

* Created minimal, dependency-free `public/offline.html`.
* Rewrote `public/sw.js`:

  * Cached `offline.html` during `install` event.
  * Used fallback pattern in `fetch` event:

    ```js
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    ```
  * Ensures all navigation requests serve cached offline file during failures.
* Result: Seamless offline navigation experience and improved PWA compliance.

---

## 🧱 **6. Architectural & Codebase Enhancements**

* **Service Worker:** Fully rewritten with standardized cache strategy and versioning for reliability.
* **Error Handling:** Unified network failure handling across contexts and hooks.
* **Firestore Queries:** Modularized data fetching in `chatService.ts` for scalability.
* **Session Management:** Added global beforeunload safety and persistent reconnect logic for real-time events.
* **Code Cleanup:** Removed redundant SW logic and deprecated API calls.

---

## ⚡ **7. Overall Stability, UX & PWA Readiness**

* Offline-first design fully achieved with service worker fallback.
* Real-time reliability: calls and chats auto-recover after reloads or tab crashes.
* Onboarding, account management, and identity tools provide enterprise-level UX polish.
* Chat panel design now matches modern messaging app standards (WhatsApp/iMessage aesthetic).
* Significantly reduced runtime errors, unnecessary alerts, and user confusion in offline/unstable network scenarios.

---

## ✅ **8. Summary of Key Impact**

| Area                   | Before                                | After                                                |
| ---------------------- | ------------------------------------- | ---------------------------------------------------- |
| **Offline Behavior**   | Browser error pages, redundant toasts | Custom offline page + silent handling                |
| **Real-Time Calls**    | Video-only                            | Full audio/video support + logs                      |
| **Chat UI**            | Basic text-only stream                | Unified chat + call timeline with contextual actions |
| **Account Management** | Basic auth                            | Full deletion, reclamation, avatar customization     |
| **Onboarding**         | Minimal setup                         | Guided multi-step profile & permission flow          |
| **Resilience**         | Frequent state loss                   | Session persistence, reconnection logic              |
| **User Experience**    | Fragmented                            | Smooth, modern, PWA-ready experience                 |

---

## 🧑‍💻 **9. Credits**

*   **Author:** Ashish Yesale

---

## 🛠️ **10. Technologies Used**

### **Programming Languages**

*   **TypeScript:** Primary language for type safety and modern JavaScript features.
*   **JavaScript:** Used for configuration files and service worker logic.

### **Core Frameworks & Libraries**

*   **Next.js:** React framework for full-stack development, routing, and performance.
*   **React:** Core UI library for building component-based interfaces.
*   **Genkit:** Open-source framework from Google for building AI flows and features.
*   **WebRTC:** For enabling peer-to-peer real-time audio and video communication.

### **Backend & Database**

*   **Firebase:**
    *   **Firestore:** NoSQL database for real-time data storage (user profiles, chats, calls, events).
    *   **Firebase Authentication:** Secure user management (Email/Password, Google, Phone).
    *   **Firebase Cloud Messaging:** For native browser push notifications.
    *   **Firebase Storage:** For user-uploaded assets like avatars.

### **AI & Machine Learning**

*   **Google Gemini:** The underlying large language model used for all generative AI tasks (summaries, planning, etc.).

### **External APIs**

*   **Google Workspace APIs:**
    *   Google Calendar API
    *   Google Tasks API
    *   Google Gmail API
*   **Competitive Programming APIs:**
    *   Codeforces API
    *   LeetCode GraphQL API
    *   Third-party proxies for CodeChef data.

### **UI & Styling**

*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **ShadCN UI:** A collection of accessible and reusable UI components.
*   **Framer Motion:** For animations and interactive elements.
*   **Lucide React:** Icon library.

### **Key Libraries & Utilities**

*   **Zod:** For schema declaration and validation of AI inputs/outputs.
*   **Date-fns:** For reliable and modern date manipulation.
*   **React Hook Form:** For managing complex forms and validation.
*   **`react-phone-number-input`:** For international phone number input.

---
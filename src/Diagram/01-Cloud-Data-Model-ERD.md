
# Cloud Data Model (Firestore ERD)

This diagram illustrates the high-level Entity-Relationship structure of the Firestore database. It shows the main collections and the subcollections nested within user documents.

```mermaid
graph TD
    subgraph "Firebase Firestore"
        direction LR

        Users["/users/{userId}"]
        Streaks["/streaks/{userId}"]
        Calls["/calls/{callId} (Signaling)"]

        subgraph "User Subcollections"
            TimelineEvents["/timelineEvents"]
            CareerGoals["/careerGoals"]
            Skills["/skills"]
            Resources["/resources"]
            Chats["/chats"]
            Notifications["/notifications"]
            DailyPlans["/dailyPlans"]
            CareerVisions["/careerVisions"]
            TrackedKeywords["/trackedKeywords"]
            FCMTokens["/fcmTokens"]
        end
        
        Users -- "1-to-1" --> Streaks
        Users -- "Has Many" --> TimelineEvents
        Users -- "Has Many" --> CareerGoals
        Users -- "Has Many" --> Skills
        Users -- "Has Many" --> Resources
        Users -- "Has Many" --> Chats
        Users -- "Has Many" --> Notifications
        Users -- "Has Many" --> DailyPlans
        Users -- "Has Many" --> CareerVisions
        Users -- "Has Many" --> TrackedKeywords
        Users -- "Has Many" --> FCMTokens
        
        Chats -- "Contains Messages" --> Messages["/messages"]
        
        Calls -. "Signaling Data for" .-> Users
    end
```


# Data Entity Class Diagram

This diagram provides a UML-style view of the primary data entities (TypeScript interfaces) used within the application. It shows the properties of each entity and their relationships, such as how a `User` has many `TimelineEvent`s and `CareerGoal`s.

```mermaid
classDiagram
    direction LR
    
    class User {
        +uid: string
        +displayName: string
        +email: string
        +photoURL: string
        +subscription: UserSubscription
        +preferences: UserPreferences
        +stats: UserStats
    }
    
    class TimelineEvent {
        +id: string
        +userId: string
        +title: string
        +date: Date
        +endDate: Date
        +type: string
        +notes: string
    }

    class CareerGoal {
        +id: string
        +userId: string
        +title: string
        +progress: number
        +deadline: Date
        +milestones: Milestone[]
    }
    
    class Skill {
        +id: string
        +userId: string
        +name: string
        +category: string
        +proficiency: string
    }
    
    class CareerVision {
        +id: string
        +userId: string
        +visionStatement: string
        +roadmap: RoadmapStep[]
    }

    User "1" -- "0..*" TimelineEvent : Manages
    User "1" -- "0..*" CareerGoal : Tracks
    User "1" -- "0..*" Skill : Acquires
    User "1" -- "0..*" CareerVision : Generates
```

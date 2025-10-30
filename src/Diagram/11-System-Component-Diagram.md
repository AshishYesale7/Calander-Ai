
# System Component Diagram

This UML component diagram illustrates the high-level architecture of the Calendar.ai application. It shows the major components and the dependencies between them, providing a clear overview of how the system is structured.

```mermaid
graph TD
    subgraph "Client Tier (Browser)"
        Frontend[<i class='fab fa-react'></i> Next.js Frontend]
    end

    subgraph "Server Tier (Vercel/Firebase)"
        APILayer[<i class='fas fa-server'></i> Next.js API Routes]
        AILayer[<i class='fas fa-brain'></i> Genkit AI Flows]
    end

    subgraph "Backend-as-a-Service (BaaS)"
        Firebase[<i class='fas fa-database'></i> Firebase Suite]
        Firestore[(<i class='fas fa-fire'></i> Firestore DB)]
        FirebaseAuth[(<i class='fas fa-user-lock'></i> Firebase Auth)]
        FCM[(<i class='fas fa-comment-alt'></i> Cloud Messaging)]
    end

    subgraph "External Services"
        GoogleAI[<i class='fas fa-robot'></i> Google AI (Gemini)]
        GoogleAPIs[<i class='fab fa-google'></i> Google Workspace APIs]
        Payments[<i class='fas fa-credit-card'></i> Razorpay API]
    end
    
    Frontend --> APILayer : HTTP Requests
    APILayer --> Firebase : Reads/Writes Data
    APILayer --> GoogleAPIs : OAuth & Data Sync
    APILayer --> Payments : Processes Subscriptions
    
    Frontend --> AILayer : Invokes AI Flows
    AILayer --> GoogleAI : Generates Content
    AILayer --> APILayer : Uses Services
    
    Frontend --> FirebaseAuth : User Authentication
    Frontend -- "Real-time Updates" --> Firestore : Listens
    
    Firebase -- "Triggers" --> FCM
    FCM --> Frontend : Push Notifications
```

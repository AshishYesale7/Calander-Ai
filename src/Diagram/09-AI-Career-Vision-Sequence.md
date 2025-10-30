
# AI Career Vision Generation Sequence Diagram

This diagram shows the sequence of events when a user generates a new AI-powered career vision plan. It illustrates the flow from the user's input on the frontend to the Genkit AI flow on the server, the call to the external Gemini model, and the final result being displayed back to the user and saved.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Career Vision Page
    participant Genkit as generateCareerVisionFlow
    participant Gemini as Google Gemini AI Model
    participant Firestore as Firestore DB

    User->>Frontend: Enters aspirations and clicks "Generate Plan"
    Frontend->>Genkit: invoke({aspirations: "..."})
    activate Genkit
    
    Genkit->>Gemini: generate({prompt: "You are a career coach...", input: aspirations})
    activate Gemini
    Gemini-->>Genkit: Returns structured JSON (vision, roadmap, skills, etc.)
    deactivate Gemini
    
    Genkit->>Firestore: saveCareerVision(userId, prompt, plan)
    activate Firestore
    Firestore-->>Genkit: Returns saved document ID
    deactivate Firestore
    
    Genkit-->>Frontend: Returns full career plan object
    deactivate Genkit
    
    Frontend->>User: Renders the complete, multi-faceted career plan
```


# Real-Time Chat & Call Signaling

This sequence diagram explains the flow of messages and WebRTC signaling for calls between two users, highlighting the role of Firestore as a real-time intermediary.

```mermaid
sequenceDiagram
    actor UserA
    actor UserB
    participant AppA as App (User A)
    participant AppB as App (User B)
    participant Firestore as Firestore DB
    
    %% Message Flow
    UserA->>AppA: Types and sends "Hello!"
    AppA->>Firestore: writeBatch (Set message in A's doc, Set message in B's doc, Update recent chats for both)
    
    Firestore-->>AppB: onSnapshot listener fires
    AppB-->>UserB: Displays "Hello!"
    
    %% Call Signaling Flow
    UserA->>AppA: Clicks "Call User B"
    AppA->>Firestore: createCall() -> Creates /calls/{callId} (status: ringing)
    Firestore-->>AppB: onSnapshot listener fires (Incoming Call)
    AppB-->>UserB: Shows Incoming Call UI
    
    UserB->>AppB: Clicks "Accept"
    AppB->>Firestore: updateCallStatus(callId, 'answered')
    
    AppA->>Firestore: Creates WebRTC Offer in /calls/{callId}
    Firestore-->>AppB: onSnapshot detects Offer
    AppB->>Firestore: Creates WebRTC Answer in /calls/{callId}
    Firestore-->>AppA: onSnapshot detects Answer
    
    Note over AppA, AppB: ICE Candidates are exchanged via subcollections in /calls/{callId}
    
    AppA<->>AppB: Direct Peer-to-Peer WebRTC connection established
```

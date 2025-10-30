
# User Authentication Flowchart

This flowchart details the process from when a user signs in to when their full profile, including data from multiple collections, is ready in the application.

```mermaid
graph TD
    A[Start: User visits Sign-in Page] --> B{Choose Auth Provider};
    B -- Google/Microsoft/etc. --> C[Firebase signInWithPopup];
    B -- Phone --> D[Enter Phone Number];
    D --> E[Setup reCAPTCHA];
    E --> F[signInWithPhoneNumber];
    F --> G[Receive OTP];
    G --> H[confirmationResult.confirm(otp)];

    subgraph "Firebase Auth"
        C; H;
    end
    
    I[onAuthStateChanged triggered]
    C --> I;
    H --> I;

    J[AuthContext: fetchFullUserProfile]
    I --> J;

    subgraph "Data Fetching (Promise.all)"
      J --> K[getUserProfile(uid)];
      J --> L[getUserSubscription(uid)];
    end

    M{Profile exists?}
    K --> M;
    M -- No --> N[createUserProfile(user)];
    M -- Yes --> O[Merge Auth & Profile data];
    N --> O;

    P[Set Global State]
    O --> P;
    L --> P;
    
    Q[Set Onboarding Status]
    P --> Q

    R[App Ready]
    Q --> R
```

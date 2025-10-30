
# Dashboard Layout Sync - User Journey

This diagram illustrates the journey the application takes to decide which dashboard layout to display, prioritizing user customizations while allowing for updates.

```mermaid
journey
    title Dashboard Layout Loading Process
    section Hydration
      App Loads: User logs in, role is identified (e.g., 'student').
      Check Local Storage: App first looks for `dashboard-layouts-userId-student` in localStorage.
      Check Firestore: App concurrently fetches the layout from the `userSettings/{userId}` document in Firestore.
    
    section Version Comparison
      Compare Versions: The app compares the `version` number from local, cloud, and the default layout in the code.
      Decision Point: Which version is the highest?
        - Local Wins: LocalStorage has the newest version.
        - Cloud Wins: Firestore has the newest version.
        - Code Wins: A new default layout was deployed with the app.

    section Rendering
      Local Wins --> Render Local Layout: The user's most recent local changes are displayed instantly.
      Cloud Wins --> Sync & Render: The layout from Firestore is saved to localStorage and then rendered.
      Code Wins --> Render & Clear: The new default layout is rendered. All custom layouts for this user are deleted from local and cloud storage to ensure compatibility.
      
    section User Interaction
      User Edits Layout: User drags or resizes a widget.
      Instant Save: The new layout is immediately saved to localStorage.
      Debounced Cloud Sync: After a short delay, the updated layout is saved to Firestore.
```

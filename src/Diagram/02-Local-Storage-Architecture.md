
# Local Storage Architecture

This mind map shows the different pieces of data cached in the browser's `localStorage` to improve performance and provide a better offline experience.

```mermaid
mindmap
  root((localStorage))
    futuresight-theme
      ::icon(🎨)
      (light / dark)
    futuresight-background-image
      ::icon(🖼️)
      (URL of user's background)
    futuresight-background-video
      ::icon(📹)
      (URL of user's video background)
    futuresight-custom-theme
      ::icon(🖌️)
      (JSON of custom color values)
    futuresight-glass-effect
      ::icon(💎)
      (e.g., 'frosted', 'water-droplets')
    futuresight-gemini-api-key
      ::icon(🔑)
      (User's custom API key)
    futuresight-known-users
      ::icon(👥)
      (Array of profiles for fast account switching)
    Data Caches
      ::icon(🗃️)
      timelineEvents
      bookmarkedResources
      aiSuggestions
      skills
      callHistory
      chatMessages_{userId}_{otherUserId}
    Layout Cache
      ::icon(🏠)
      dashboard-layouts-{userId}-{role}
```

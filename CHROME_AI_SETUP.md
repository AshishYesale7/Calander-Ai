# Chrome AI Integration Setup Guide
## Google Chrome AI Hackathon 2025 - Calendar.ai Enhanced Orb

This guide explains how to set up and use Chrome's built-in AI APIs (including Gemini Nano) with the Calendar.ai Dashboard Orb.

## Prerequisites

### Chrome Browser Setup
1. **Chrome Canary or Dev Channel** (Required)
   - Download Chrome Canary: https://www.google.com/chrome/canary/
   - Or Chrome Dev: https://www.google.com/chrome/dev/

2. **Enable Chrome AI Features**
   ```
   chrome://flags/#optimization-guide-on-device-model
   chrome://flags/#prompt-api-for-gemini-nano
   chrome://flags/#summarization-api-for-gemini-nano
   chrome://flags/#writer-api-for-gemini-nano
   chrome://flags/#rewriter-api-for-gemini-nano
   chrome://flags/#translation-api
   chrome://flags/#language-detection-api
   ```
   Set all to "Enabled" and restart Chrome.

3. **Download Gemini Nano Model**
   - Navigate to `chrome://components/`
   - Find "Optimization Guide On Device Model"
   - Click "Check for update" to download Gemini Nano

4. **Verify Installation**
   - Open DevTools Console
   - Type: `window.ai`
   - Should return an object with available APIs

## Chrome AI APIs Used

### 1. Prompt API (Gemini Nano)
```javascript
// Enhanced conversational AI for the orb
const session = await window.ai.languageModel.create({
  systemPrompt: "You are Orb, an AI assistant for Calendar.ai",
  temperature: 0.7
});
const response = await session.prompt("What's on my calendar today?");
```

### 2. Summarizer API
```javascript
// Summarize emails, calendar events, and documents
const summarizer = await window.ai.summarizer.create({
  type: 'key-points',
  format: 'markdown',
  length: 'medium'
});
const summary = await summarizer.summarize(longText);
```

### 3. Writer API
```javascript
// Generate content for emails, tasks, and notes
const writer = await window.ai.writer.create({
  tone: 'professional',
  format: 'plain-text',
  length: 'medium'
});
const content = await writer.write("Draft an email about the meeting");
```

### 4. Rewriter API
```javascript
// Improve and rewrite text content
const rewriter = await window.ai.rewriter.create({
  tone: 'more-formal',
  length: 'shorter'
});
const improved = await rewriter.rewrite(originalText);
```

### 5. Translator API
```javascript
// Translate content in real-time
const translator = await window.ai.translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});
const translated = await translator.translate("Hello, world!");
```

### 6. Proofreader API
```javascript
// Auto-correct and grammar checking
const proofreader = await window.ai.proofreader.create();
const corrected = await proofreader.proofread(textWithErrors);
```

## Implementation Features

### Voice-Activated AI Assistant
- **Wake Word**: "Hey Orb"
- **Continuous Listening**: Always ready for commands
- **Speech Synthesis**: Orb speaks responses back
- **Context Awareness**: Understands calendar, emails, tasks

### Text Selection AI Operations
- Select any text on the page
- Right-click or use floating toolbar
- Apply AI operations: summarize, translate, rewrite, proofread
- Results replace selected text or appear in chat

### Contextual Intelligence
- **Calendar Integration**: Knows your schedule
- **Email Awareness**: Understands important messages
- **Task Management**: Tracks your to-dos
- **Goal Tracking**: Monitors progress

### Auto-Correction System
- Real-time grammar and spelling correction
- Works across all input fields
- Powered by Chrome's Proofreader API

## Usage Examples

### 1. Voice Commands
```
"Hey Orb, what's my schedule for today?"
"Hey Orb, summarize my important emails"
"Hey Orb, help me write a follow-up email"
"Hey Orb, translate this text to Spanish"
```

### 2. Text Selection Operations
1. Select text anywhere on the page
2. Floating AI toolbar appears
3. Choose operation: Summarize, Rewrite, Translate, Proofread
4. AI processes using Chrome's built-in models
5. Result replaces selection or appears in chat

### 3. Smart Briefings
- Daily briefings generated using Chrome AI
- Combines calendar, email, and task data
- Personalized insights and recommendations

## Technical Architecture

### Chrome AI Service Layer
```typescript
// Core service that interfaces with Chrome's AI APIs
class ChromeAIService {
  private languageModel: AILanguageModel;
  private summarizer: AISummarizer;
  private writer: AIWriter;
  // ... other AI models
}
```

### Integration with Existing Flows
```typescript
// Hybrid approach: Chrome AI first, Genkit fallback
const response = await aiFlowsIntegrationService.processRequest({
  type: 'webapp-qa',
  prompt: userQuery,
  options: {
    useChrome: true,        // Prefer Chrome AI
    fallbackToGenkit: true  // Fallback if needed
  }
});
```

### Context-Aware Processing
```typescript
// Webapp context service provides data to Chrome AI
const context = await webappContextService.getFullContext(userId);
const response = await chromeAI.generateContextualResponse(prompt, context);
```

## Performance Optimizations

### 1. Model Caching
- Chrome AI models are cached locally
- No network requests for inference
- Instant responses

### 2. Streaming Responses
- Real-time text generation
- Progressive UI updates
- Better user experience

### 3. Hybrid Processing
- Chrome AI for speed and privacy
- Genkit fallback for complex queries
- Best of both worlds

## Privacy & Security

### Local Processing
- All Chrome AI processing happens locally
- No data sent to external servers
- Complete privacy protection

### Secure Context
- HTTPS required for Chrome AI APIs
- Secure origin enforcement
- Protected user data

## Troubleshooting

### Chrome AI Not Available
1. Check Chrome version (Canary/Dev required)
2. Verify flags are enabled
3. Ensure Gemini Nano is downloaded
4. Check `window.ai` in console

### Model Download Issues
1. Go to `chrome://components/`
2. Update "Optimization Guide On Device Model"
3. Wait for download to complete
4. Restart Chrome

### API Errors
1. Check browser console for errors
2. Verify API availability: `await window.ai.languageModel.capabilities()`
3. Ensure proper error handling in code

## Development Commands

### Start Development Server
```bash
cd orb
npm run dev
```

### Build for Production
```bash
npm run build
```

### Test Chrome AI Integration
```bash
# Open Chrome DevTools Console
window.ai?.languageModel?.capabilities()
```

## Hackathon Compliance

✅ **Uses Chrome's Built-in AI APIs**
- Prompt API (Gemini Nano)
- Summarizer API
- Writer API
- Rewriter API
- Translator API
- Proofreader API

✅ **Local Processing**
- All AI inference happens on-device
- No external API calls for AI processing
- Privacy-first approach

✅ **Enhanced User Experience**
- Voice-activated assistant
- Real-time text processing
- Context-aware responses
- Seamless integration

✅ **Innovation**
- Advanced voice interaction
- Page-wide text selection AI
- Auto-correction system
- Hybrid AI processing

## Demo Script

1. **Show Chrome AI Detection**
   - Open DevTools
   - Show `window.ai` object
   - Demonstrate API availability

2. **Voice Interaction**
   - Say "Hey Orb"
   - Ask about calendar/emails
   - Show voice response

3. **Text Selection AI**
   - Select text on page
   - Use AI toolbar
   - Show real-time processing

4. **Auto-Correction**
   - Type with errors
   - Show correction suggestions
   - Demonstrate improvement

5. **Contextual Intelligence**
   - Ask complex questions
   - Show calendar/email integration
   - Demonstrate understanding

This implementation fully leverages Chrome's built-in AI capabilities while maintaining the existing Calendar.ai functionality and user experience.
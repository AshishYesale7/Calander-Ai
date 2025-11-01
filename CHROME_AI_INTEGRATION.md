# Chrome AI Integration for Calendar.ai Orb

## Overview

This document describes the comprehensive Chrome AI integration implemented for the Calendar.ai Dashboard Orb as part of the Google Chrome AI Hackathon 2025. The integration enhances the existing AI orb with advanced Chrome AI APIs while maintaining backward compatibility with the existing Genkit-based system.

## Features Implemented

### 🎯 Core Chrome AI APIs Integration
- **Prompt API**: Enhanced prompt processing and contextual responses
- **Summarizer API**: Intelligent text summarization with multiple formats
- **Writer API**: Content generation and writing assistance
- **Rewriter API**: Text improvement and style adjustment
- **Translator API**: Multi-language translation support
- **Proofreader API**: Grammar checking and text correction

### 🎤 Enhanced Voice Assistant
- **"Hey Orb" Wake Word**: Continuous listening for voice activation
- **Speech Synthesis**: Natural text-to-speech responses
- **Voice Commands**: Full voice interaction with all AI features
- **Continuous Listening**: Seamless voice conversation flow

### 📝 Text Selection AI Operations
- **Page-wide Text Selection**: Select any text on the page for AI processing
- **Context Menu**: Floating action buttons for quick AI operations
- **Real-time Processing**: Instant AI operations on selected text
- **Text Replacement**: Automatic replacement of selected text with AI results

### 🔄 Auto-Correction System
- **Real-time Grammar Check**: Automatic grammar and spelling correction
- **Input Field Monitoring**: Monitors all text inputs across the webapp
- **Smart Suggestions**: Non-intrusive correction suggestions

### 🌐 Webapp Context Integration
- **Gmail Integration**: Access to important emails and unread messages
- **Calendar Events**: Today's events and upcoming schedule
- **Tasks Management**: Pending and overdue tasks
- **Goals Tracking**: Active goals and progress monitoring
- **Skills Assessment**: Current skills and learning progress

## Architecture

### Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DashboardChat Component                   │
├─────────────────────────────────────────────────────────────┤
│                AI Flows Integration Service                  │
├─────────────────────────────────────────────────────────────┤
│  Chrome AI Service  │  Webapp Context Service  │  Voice Hook │
├─────────────────────────────────────────────────────────────┤
│     Chrome AI APIs     │    Existing Genkit Flows          │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Chrome AI Service (`src/services/chromeAiService.ts`)
- Manages all Chrome AI API interactions
- Handles initialization and capability detection
- Provides unified interface for all AI operations
- Includes text selection and auto-correction utilities

#### 2. Webapp Context Service (`src/services/webappContextService.ts`)
- Aggregates data from Gmail, Calendar, Tasks, Goals, and Skills
- Provides contextual information for AI responses
- Caches data for performance optimization
- Supports different context types for specific operations

#### 3. AI Flows Integration Service (`src/services/aiFlowsIntegration.ts`)
- Bridges Chrome AI with existing Genkit flows
- Implements hybrid processing strategies
- Provides fallback mechanisms
- Handles timeout and error management

#### 4. Enhanced Voice Activation (`src/hooks/useVoiceActivation.ts`)
- Continuous "Hey Orb" wake word detection
- Advanced speech synthesis with voice options
- Command listening with timeout handling
- Seamless integration with AI processing

#### 5. Enhanced Dashboard Chat (`src/components/layout/DashboardChat.tsx`)
- Integrated Chrome AI controls
- Text selection popup interface
- Voice mode indicators and controls
- Real-time AI operation feedback

## Usage Guide

### Voice Interaction
1. **Enable Voice Mode**: Click the microphone button in the orb
2. **Wake Word Activation**: Say "Hey Orb" to activate voice commands
3. **Voice Commands**: Speak naturally to interact with the AI
4. **Voice Responses**: The orb will speak responses back to you

### Text Selection AI
1. **Select Text**: Highlight any text on the webpage
2. **AI Actions**: Click the floating action buttons that appear
3. **Operations**: Choose from Summarize, Rewrite, Translate, or Proofread
4. **Results**: View results in the chat and optionally replace selected text

### Auto-Correction
1. **Automatic Detection**: Type in any input field across the webapp
2. **Smart Suggestions**: Receive non-intrusive correction suggestions
3. **Manual Acceptance**: Choose whether to accept corrections

### Chat Interface
1. **Enhanced Prompts**: Chrome AI automatically enhances your prompts
2. **Contextual Responses**: AI has access to your calendar, emails, and tasks
3. **Hybrid Processing**: Seamlessly switches between Chrome AI and Genkit
4. **Voice Integration**: All chat responses can be spoken aloud

## Chrome AI API Requirements

### Browser Requirements
- Chrome Canary (version 127+)
- Chrome AI APIs enabled in chrome://flags/
- Microphone permissions for voice features

### Required Flags
```
chrome://flags/#optimization-guide-on-device-model
chrome://flags/#prompt-api-for-gemini-nano
chrome://flags/#summarization-api-for-gemini-nano
chrome://flags/#writer-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
chrome://flags/#translation-api
```

### API Availability
The system automatically detects Chrome AI availability and falls back to Genkit when needed:
- **Chrome AI Available**: Uses Chrome AI with Genkit fallback
- **Chrome AI Unavailable**: Uses existing Genkit flows
- **Hybrid Mode**: Runs both in parallel and uses best result

## Configuration

### Environment Variables
No additional environment variables required. The system uses existing Genkit configuration.

### Feature Toggles
- Voice mode can be enabled/disabled per user session
- Chrome AI can be disabled to force Genkit usage
- Auto-correction can be enabled/disabled globally

## Performance Optimizations

### Caching Strategy
- Webapp context cached for 5 minutes
- Chrome AI capabilities cached on initialization
- Voice recognition optimized for continuous listening

### Timeout Management
- Chrome AI operations: 10 second timeout
- Genkit operations: 15 second timeout
- Voice commands: 5 second timeout after speech ends

### Resource Management
- Automatic cleanup of AI model instances
- Memory-efficient text selection handling
- Optimized voice recognition restart cycles

## Error Handling

### Graceful Degradation
1. **Chrome AI Unavailable**: Falls back to Genkit flows
2. **Network Issues**: Provides cached responses when possible
3. **Permission Denied**: Gracefully handles microphone/API permissions
4. **Timeout Errors**: Automatic retry with alternative methods

### User Feedback
- Clear error messages for permission issues
- Loading indicators for AI operations
- Status indicators for Chrome AI availability
- Voice feedback for error conditions

## Security Considerations

### Data Privacy
- All Chrome AI processing happens locally in the browser
- No additional data sent to external servers
- Webapp context data remains within the user's session
- Voice data processed locally with Web Speech API

### Permissions
- Microphone access required for voice features
- No additional permissions required for Chrome AI
- Respects existing webapp authentication and authorization

## Testing

### Manual Testing Checklist
- [ ] Chrome AI APIs detection and initialization
- [ ] Voice activation with "Hey Orb" wake word
- [ ] Text selection and AI operations
- [ ] Auto-correction in various input fields
- [ ] Fallback to Genkit when Chrome AI unavailable
- [ ] Webapp context integration
- [ ] Error handling and graceful degradation

### Browser Compatibility
- **Chrome Canary**: Full feature support
- **Chrome Stable**: Genkit fallback mode
- **Other Browsers**: Genkit fallback mode

## Future Enhancements

### Planned Features
1. **Custom Voice Training**: Personalized wake word detection
2. **Multi-language Support**: Voice commands in multiple languages
3. **Advanced Context**: Integration with more webapp data sources
4. **Offline Mode**: Local AI processing when network unavailable
5. **Performance Analytics**: AI operation performance monitoring

### API Expansions
- Integration with future Chrome AI APIs
- Enhanced context awareness
- Improved voice synthesis options
- Advanced text processing capabilities

## Troubleshooting

### Common Issues

#### Chrome AI Not Available
- Ensure Chrome Canary is installed
- Enable required flags in chrome://flags/
- Restart browser after enabling flags

#### Voice Not Working
- Check microphone permissions
- Ensure HTTPS connection
- Test with browser's built-in speech recognition

#### Text Selection Not Responding
- Check for JavaScript errors in console
- Ensure proper page loading
- Verify text selection event handlers

#### Auto-Correction Not Working
- Check input field compatibility
- Verify Chrome AI proofreader availability
- Test with different input types

## Support

For issues related to Chrome AI integration:
1. Check browser console for error messages
2. Verify Chrome AI API availability
3. Test with fallback Genkit mode
4. Review webapp context service logs

## Contributing

When contributing to the Chrome AI integration:
1. Follow existing service architecture patterns
2. Maintain backward compatibility with Genkit
3. Add comprehensive error handling
4. Include fallback mechanisms
5. Update type definitions as needed

---

**Note**: This integration is designed for the Google Chrome AI Hackathon 2025 and showcases the potential of Chrome AI APIs in enhancing web applications with local AI processing capabilities.
# Chrome AI Troubleshooting Guide

## Error: `ai is not defined`

This error means Chrome AI APIs are not available in your current browser. Here's how to fix it:

## Step 1: Check Your Browser

### Required Browser
You **MUST** use one of these browsers:
- **Chrome Canary** (Recommended) - Download: https://www.google.com/chrome/canary/
- **Chrome Dev** - Download: https://www.google.com/chrome/dev/
- **Chrome Beta** (may work) - Download: https://www.google.com/chrome/beta/

**Regular Chrome Stable will NOT work** - the AI APIs are experimental features only available in pre-release versions.

## Step 2: Enable Chrome AI Flags

1. Open Chrome Canary/Dev
2. Navigate to `chrome://flags/`
3. Search for and enable these flags (set to "Enabled"):

```
chrome://flags/#optimization-guide-on-device-model
chrome://flags/#prompt-api-for-gemini-nano
chrome://flags/#summarization-api-for-gemini-nano
chrome://flags/#writer-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
chrome://flags/#translation-api
chrome://flags/#language-detection-api
```

4. **Restart Chrome** after enabling all flags

## Step 3: Download Gemini Nano Model

1. Go to `chrome://components/`
2. Find "Optimization Guide On Device Model"
3. Click "Check for update"
4. Wait for the download to complete (this may take several minutes)
5. The status should show "Up-to-date" when finished

## Step 4: Verify Installation

Open DevTools Console and run:

```javascript
// Check if AI object exists
console.log('AI object:', window.ai);

// Check language model availability
if (window.ai?.languageModel) {
  console.log('Language Model availability:', await window.ai.languageModel.capabilities());
} else {
  console.log('Language Model not available');
}

// Check all APIs
const apis = {
  languageModel: !!window.ai?.languageModel,
  summarizer: !!window.ai?.summarizer,
  writer: !!window.ai?.writer,
  rewriter: !!window.ai?.rewriter,
  translator: !!window.ai?.translator,
  proofreader: !!window.ai?.proofreader
};
console.log('Available APIs:', apis);
```

## Step 5: Test Each API

```javascript
// Test Language Model (Gemini Nano)
if (window.ai?.languageModel) {
  try {
    const capabilities = await window.ai.languageModel.capabilities();
    console.log('Language Model capabilities:', capabilities);
    
    if (capabilities.available === 'readily') {
      const session = await window.ai.languageModel.create();
      const response = await session.prompt('Hello, are you working?');
      console.log('Response:', response);
      session.destroy();
    }
  } catch (error) {
    console.error('Language Model error:', error);
  }
}

// Test Summarizer
if (window.ai?.summarizer) {
  try {
    const capabilities = await window.ai.summarizer.capabilities();
    console.log('Summarizer capabilities:', capabilities);
  } catch (error) {
    console.error('Summarizer error:', error);
  }
}
```

## Common Issues and Solutions

### Issue 1: "ai is not defined"
**Solution**: You're not using Chrome Canary/Dev or flags aren't enabled
- Install Chrome Canary
- Enable all required flags
- Restart browser

### Issue 2: "languageModel.capabilities() returns 'no'"
**Solution**: Gemini Nano model not downloaded
- Go to `chrome://components/`
- Update "Optimization Guide On Device Model"
- Wait for download to complete

### Issue 3: "capabilities() returns 'after-download'"
**Solution**: Model is downloading
- Wait for the download to complete
- Check `chrome://components/` for status
- May take 10-15 minutes depending on connection

### Issue 4: APIs return "not available"
**Solution**: Flags not properly enabled
- Double-check all flags are set to "Enabled"
- Restart Chrome completely
- Clear browser cache if needed

## Quick Setup Script

Run this in the console to check your setup:

```javascript
async function checkChromeAISetup() {
  console.log('🔍 Checking Chrome AI Setup...\n');
  
  // Check browser
  const isCanary = navigator.userAgent.includes('Chrome') && 
                   (navigator.userAgent.includes('Canary') || 
                    navigator.userAgent.includes('Dev'));
  console.log('✅ Browser:', isCanary ? 'Chrome Canary/Dev' : '❌ Need Chrome Canary/Dev');
  
  // Check AI object
  console.log('✅ window.ai:', window.ai ? 'Available' : '❌ Not available');
  
  if (!window.ai) {
    console.log('\n🔧 Setup Required:');
    console.log('1. Install Chrome Canary: https://www.google.com/chrome/canary/');
    console.log('2. Enable flags at chrome://flags/');
    console.log('3. Restart browser');
    return;
  }
  
  // Check APIs
  const apis = {
    'Language Model': window.ai.languageModel,
    'Summarizer': window.ai.summarizer,
    'Writer': window.ai.writer,
    'Rewriter': window.ai.rewriter,
    'Translator': window.ai.translator,
    'Proofreader': window.ai.proofreader
  };
  
  console.log('\n📋 API Availability:');
  for (const [name, api] of Object.entries(apis)) {
    console.log(`${api ? '✅' : '❌'} ${name}`);
  }
  
  // Check Gemini Nano
  if (window.ai.languageModel) {
    try {
      const capabilities = await window.ai.languageModel.capabilities();
      console.log('\n🤖 Gemini Nano Status:', capabilities.available);
      
      if (capabilities.available === 'no') {
        console.log('🔧 Go to chrome://components/ and update "Optimization Guide On Device Model"');
      } else if (capabilities.available === 'after-download') {
        console.log('⏳ Gemini Nano is downloading... please wait');
      } else if (capabilities.available === 'readily') {
        console.log('🎉 Gemini Nano is ready!');
        
        // Test it
        const session = await window.ai.languageModel.create();
        const response = await session.prompt('Say hello!');
        console.log('🗣️ Test response:', response);
        session.destroy();
      }
    } catch (error) {
      console.error('❌ Error checking Gemini Nano:', error);
    }
  }
}

// Run the check
checkChromeAISetup();
```

## Expected Output When Working

When everything is set up correctly, you should see:

```javascript
console.log(window.ai);
// Output: {languageModel: {...}, summarizer: {...}, writer: {...}, ...}

console.log(await window.ai.languageModel.capabilities());
// Output: {available: "readily", defaultTemperature: 0.8, ...}
```

## Alternative Testing

If you want to test our Calendar.ai integration specifically:

```javascript
// Import our demo utility (if the app is running)
const demo = new ChromeAIDemo();
await demo.checkChromeAIAvailability();
await demo.runAllDemos();
```

## Still Having Issues?

1. **Clear browser data**: Settings > Privacy > Clear browsing data
2. **Disable extensions**: Test in incognito mode
3. **Check system requirements**: Ensure your OS supports Chrome AI
4. **Wait for updates**: Chrome AI is experimental and may have temporary issues

## System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: At least 4GB available (Gemini Nano needs memory)
- **Storage**: ~1GB for Gemini Nano model
- **Network**: Required for initial model download

Remember: Chrome AI is experimental technology and may not work perfectly in all situations. The APIs are still in development and subject to change.
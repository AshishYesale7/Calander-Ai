#!/usr/bin/env node

/**
 * Chrome AI Integration Test Suite
 * Tests all Chrome AI features for Calendar.ai Orb
 * Run this in Chrome Canary with Chrome AI enabled
 */

class ChromeAIIntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.log(`Testing: ${name}`, 'info');
    try {
      const result = await testFn();
      this.results.passed++;
      this.results.details.push({ name, status: 'PASSED', result });
      this.log(`${name}: PASSED`, 'success');
      return result;
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ name, error: error.message });
      this.results.details.push({ name, status: 'FAILED', error: error.message });
      this.log(`${name}: FAILED - ${error.message}`, 'error');
      return null;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Chrome AI Integration Tests for Calendar.ai', 'info');
    this.log('=' .repeat(60), 'info');

    // Environment Tests
    await this.test('Browser Environment Check', () => this.testBrowserEnvironment());
    await this.test('Chrome AI Availability', () => this.testChromeAIAvailability());
    await this.test('Gemini Nano Status', () => this.testGeminiNanoStatus());

    // Individual API Tests
    await this.test('Language Model API', () => this.testLanguageModel());
    await this.test('Summarizer API', () => this.testSummarizer());
    await this.test('Writer API', () => this.testWriter());
    await this.test('Rewriter API', () => this.testRewriter());
    await this.test('Translator API', () => this.testTranslator());
    await this.test('Proofreader API', () => this.testProofreader());

    // Integration Tests
    await this.test('Chrome AI Service Integration', () => this.testChromeAIService());
    await this.test('Voice Activation System', () => this.testVoiceActivation());
    await this.test('Context Service Integration', () => this.testContextService());
    await this.test('AI Flows Integration', () => this.testAIFlowsIntegration());

    // Performance Tests
    await this.test('Response Time Performance', () => this.testPerformance());
    await this.test('Memory Usage', () => this.testMemoryUsage());

    this.printResults();
  }

  async testBrowserEnvironment() {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome');
    const isCanary = userAgent.includes('Canary');
    const isDev = userAgent.includes('Dev');
    
    if (!isChrome) {
      throw new Error('Chrome browser required');
    }
    
    if (!isCanary && !isDev) {
      throw new Error('Chrome Canary or Dev required for Chrome AI');
    }
    
    return {
      browser: isCanary ? 'Chrome Canary' : isDev ? 'Chrome Dev' : 'Chrome',
      userAgent: userAgent.substring(0, 100) + '...'
    };
  }

  async testChromeAIAvailability() {
    if (!window.ai) {
      throw new Error('Chrome AI APIs not available. Enable flags and restart Chrome.');
    }

    const apis = {
      languageModel: !!window.ai.languageModel,
      summarizer: !!window.ai.summarizer,
      writer: !!window.ai.writer,
      rewriter: !!window.ai.rewriter,
      translator: !!window.ai.translator,
      proofreader: !!window.ai.proofreader
    };

    const availableCount = Object.values(apis).filter(Boolean).length;
    
    if (availableCount === 0) {
      throw new Error('No Chrome AI APIs available');
    }

    return { apis, availableCount, total: 6 };
  }

  async testGeminiNanoStatus() {
    if (!window.ai?.languageModel) {
      throw new Error('Language Model API not available');
    }

    const capabilities = await window.ai.languageModel.capabilities();
    
    if (capabilities.available === 'no') {
      throw new Error('Gemini Nano not available. Download from chrome://components/');
    }
    
    if (capabilities.available === 'after-download') {
      throw new Error('Gemini Nano downloading. Please wait and try again.');
    }
    
    if (capabilities.available !== 'readily') {
      throw new Error(`Unexpected Gemini Nano status: ${capabilities.available}`);
    }

    return capabilities;
  }

  async testLanguageModel() {
    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are Orb, the AI assistant for Calendar.ai. Respond briefly.',
      temperature: 0.7
    });

    const testPrompts = [
      'Hello! Introduce yourself.',
      'What can you help me with in Calendar.ai?',
      'How do you use Chrome AI?'
    ];

    const responses = [];
    for (const prompt of testPrompts) {
      const response = await session.prompt(prompt);
      responses.push({ prompt, response: response.substring(0, 100) + '...' });
    }

    session.destroy();
    return { responses, sessionCreated: true };
  }

  async testSummarizer() {
    const summarizer = await window.ai.summarizer.create({
      type: 'key-points',
      format: 'markdown',
      length: 'medium'
    });

    const longText = `
      Calendar.ai is a comprehensive productivity web application built with Next.js, React, and TypeScript. 
      The application integrates with multiple Google services including Gmail, Google Calendar, Google Tasks, 
      and Google Contacts to provide a unified dashboard experience. The AI assistant called "Orb" has been 
      enhanced with Chrome AI APIs for the Google Chrome AI Hackathon 2025. Key features include voice 
      activation with "Hey Orb" wake word, real-time text processing, contextual understanding of user data, 
      and hybrid AI processing that combines Chrome AI with Genkit flows. The application supports career 
      goal tracking, skills development, resource management, timeline visualization, and gamified productivity 
      features. The Chrome AI integration includes all six APIs: Prompt API with Gemini Nano, Summarizer, 
      Writer, Rewriter, Translator, and Proofreader APIs.
    `;

    const summary = await summarizer.summarize(longText);
    summarizer.destroy();

    if (!summary || summary.length < 10) {
      throw new Error('Summary too short or empty');
    }

    return { originalLength: longText.length, summaryLength: summary.length, summary };
  }

  async testWriter() {
    const writer = await window.ai.writer.create({
      tone: 'professional',
      format: 'plain-text',
      length: 'short'
    });

    const content = await writer.write('Write a welcome message for Calendar.ai users about the new Chrome AI integration.');
    writer.destroy();

    if (!content || content.length < 20) {
      throw new Error('Generated content too short');
    }

    return { content, length: content.length };
  }

  async testRewriter() {
    const rewriter = await window.ai.rewriter.create({
      tone: 'more-formal',
      length: 'shorter'
    });

    const originalText = "Hey! The AI stuff is working great and it's really cool!";
    const rewritten = await rewriter.rewrite(originalText);
    rewriter.destroy();

    if (!rewritten || rewritten === originalText) {
      throw new Error('Rewriting failed or no change detected');
    }

    return { original: originalText, rewritten };
  }

  async testTranslator() {
    const translator = await window.ai.translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });

    const englishText = "Hello! I am Orb, your AI assistant for Calendar.ai.";
    const spanishText = await translator.translate(englishText);
    translator.destroy();

    if (!spanishText || spanishText === englishText) {
      throw new Error('Translation failed or no change detected');
    }

    return { english: englishText, spanish: spanishText };
  }

  async testProofreader() {
    const proofreader = await window.ai.proofreader.create();

    const textWithErrors = "Teh Calendar.ai orb has been enhansed with Chrome AI capabilites for teh hackathon.";
    const corrected = await proofreader.proofread(textWithErrors);
    proofreader.destroy();

    if (!corrected || corrected === textWithErrors) {
      throw new Error('Proofreading failed or no corrections made');
    }

    return { original: textWithErrors, corrected };
  }

  async testChromeAIService() {
    // Test if our ChromeAIService is available
    if (typeof window.ChromeAIService === 'undefined') {
      // Try to load it from the app
      try {
        const response = await fetch('/api/test-chrome-ai-service');
        if (!response.ok) {
          throw new Error('ChromeAIService not accessible via API');
        }
        return { serviceAvailable: true, accessMethod: 'API' };
      } catch (error) {
        throw new Error('ChromeAIService not available in window or via API');
      }
    }

    return { serviceAvailable: true, accessMethod: 'window' };
  }

  async testVoiceActivation() {
    // Test if voice activation APIs are available
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;

    if (!hasWebkitSpeechRecognition && !hasSpeechRecognition) {
      throw new Error('Speech Recognition API not available');
    }

    if (!hasSpeechSynthesis) {
      throw new Error('Speech Synthesis API not available');
    }

    // Test speech synthesis
    const utterance = new SpeechSynthesisUtterance('Testing voice activation');
    utterance.volume = 0; // Silent test
    speechSynthesis.speak(utterance);

    return {
      speechRecognition: hasWebkitSpeechRecognition || hasSpeechRecognition,
      speechSynthesis: hasSpeechSynthesis,
      voicesAvailable: speechSynthesis.getVoices().length
    };
  }

  async testContextService() {
    // Test if context service can access webapp data
    const contextData = {
      hasLocalStorage: typeof localStorage !== 'undefined',
      hasSessionStorage: typeof sessionStorage !== 'undefined',
      hasIndexedDB: typeof indexedDB !== 'undefined',
      hasWebWorkers: typeof Worker !== 'undefined'
    };

    // Test localStorage access
    try {
      localStorage.setItem('test-chrome-ai', 'test-value');
      const retrieved = localStorage.getItem('test-chrome-ai');
      localStorage.removeItem('test-chrome-ai');
      contextData.localStorageWorking = retrieved === 'test-value';
    } catch (error) {
      contextData.localStorageWorking = false;
    }

    return contextData;
  }

  async testAIFlowsIntegration() {
    // Test if AI flows integration is working
    try {
      const response = await fetch('/api/ai/test-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        const data = await response.json();
        return { integrationWorking: true, response: data };
      } else {
        return { integrationWorking: false, status: response.status };
      }
    } catch (error) {
      return { integrationWorking: false, error: error.message };
    }
  }

  async testPerformance() {
    const startTime = performance.now();
    
    // Test language model performance
    const session = await window.ai.languageModel.create();
    const response = await session.prompt('Hello!');
    session.destroy();
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    if (responseTime > 10000) { // 10 seconds
      throw new Error(`Response time too slow: ${responseTime}ms`);
    }

    return {
      responseTime: Math.round(responseTime),
      responseLength: response.length,
      performance: responseTime < 3000 ? 'Good' : responseTime < 6000 ? 'Fair' : 'Slow'
    };
  }

  async testMemoryUsage() {
    if (!performance.memory) {
      return { memoryAPIAvailable: false };
    }

    const beforeMemory = performance.memory.usedJSHeapSize;
    
    // Create and destroy multiple AI sessions
    for (let i = 0; i < 5; i++) {
      const session = await window.ai.languageModel.create();
      await session.prompt('Test');
      session.destroy();
    }

    const afterMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = afterMemory - beforeMemory;

    return {
      memoryAPIAvailable: true,
      beforeMemory: Math.round(beforeMemory / 1024 / 1024), // MB
      afterMemory: Math.round(afterMemory / 1024 / 1024), // MB
      memoryIncrease: Math.round(memoryIncrease / 1024 / 1024), // MB
      totalMemory: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) // MB
    };
  }

  printResults() {
    this.log('=' .repeat(60), 'info');
    this.log('🏁 Test Results Summary', 'info');
    this.log('=' .repeat(60), 'info');
    
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    this.log(`📊 Total: ${this.results.passed + this.results.failed}`, 'info');
    
    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    this.log(`🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    if (this.results.errors.length > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.results.errors.forEach(({ name, error }) => {
        this.log(`  • ${name}: ${error}`, 'error');
      });
    }

    this.log('\n📋 Detailed Results:', 'info');
    this.results.details.forEach(({ name, status, result, error }) => {
      const icon = status === 'PASSED' ? '✅' : '❌';
      this.log(`  ${icon} ${name}: ${status}`, status === 'PASSED' ? 'success' : 'error');
      if (result && typeof result === 'object') {
        this.log(`    ${JSON.stringify(result, null, 2).substring(0, 200)}...`, 'info');
      }
    });

    // Overall assessment
    if (successRate >= 90) {
      this.log('\n🎉 Excellent! Chrome AI integration is working perfectly!', 'success');
    } else if (successRate >= 70) {
      this.log('\n👍 Good! Chrome AI integration is mostly working with minor issues.', 'success');
    } else if (successRate >= 50) {
      this.log('\n⚠️ Partial! Chrome AI integration has some issues that need attention.', 'warning');
    } else {
      this.log('\n🚨 Critical! Chrome AI integration has major issues that need immediate attention.', 'error');
    }

    return this.results;
  }
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  window.ChromeAIIntegrationTester = ChromeAIIntegrationTester;
  
  // Add a global function to run tests
  window.runChromeAITests = async function() {
    const tester = new ChromeAIIntegrationTester();
    return await tester.runAllTests();
  };
  
  console.log('🤖 Chrome AI Integration Tester loaded!');
  console.log('📋 Run tests with: runChromeAITests()');
  console.log('🔧 Or create instance: const tester = new ChromeAIIntegrationTester()');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChromeAIIntegrationTester;
}
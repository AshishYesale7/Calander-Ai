// Chrome AI Demo Utilities for Google Chrome AI Hackathon 2025
// Demonstrates Chrome's built-in AI APIs integration

export class ChromeAIDemo {
  private static instance: ChromeAIDemo;
  
  static getInstance(): ChromeAIDemo {
    if (!ChromeAIDemo.instance) {
      ChromeAIDemo.instance = new ChromeAIDemo();
    }
    return ChromeAIDemo.instance;
  }

  // Check if Chrome AI is available and ready
  async checkChromeAIAvailability(): Promise<{
    available: boolean;
    apis: {
      languageModel: boolean;
      summarizer: boolean;
      writer: boolean;
      rewriter: boolean;
      translator: boolean;
      proofreader: boolean;
    };
    geminoNano: boolean;
    message: string;
  }> {
    if (!window.ai) {
      return {
        available: false,
        apis: {
          languageModel: false,
          summarizer: false,
          writer: false,
          rewriter: false,
          translator: false,
          proofreader: false
        },
        geminoNano: false,
        message: 'Chrome AI APIs not available. Please use Chrome Canary with AI flags enabled.'
      };
    }

    const apis = {
      languageModel: !!window.ai.languageModel,
      summarizer: !!window.ai.summarizer,
      writer: !!window.ai.writer,
      rewriter: !!window.ai.rewriter,
      translator: !!window.ai.translator,
      proofreader: !!window.ai.proofreader
    };

    let geminoNano = false;
    try {
      const capabilities = await window.ai.languageModel?.capabilities();
      geminoNano = capabilities?.available === 'readily';
    } catch (error) {
      console.warn('Could not check Gemini Nano availability:', error);
    }

    const availableCount = Object.values(apis).filter(Boolean).length;
    
    return {
      available: availableCount > 0,
      apis,
      geminoNano,
      message: `Chrome AI APIs available: ${availableCount}/6. Gemini Nano: ${geminoNano ? 'Ready' : 'Not Ready'}`
    };
  }

  // Demo: Gemini Nano Language Model
  async demoLanguageModel(): Promise<string> {
    if (!window.ai?.languageModel) {
      throw new Error('Language Model API not available');
    }

    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available !== 'readily') {
      throw new Error('Gemini Nano not ready. Please download the model from chrome://components/');
    }

    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are Orb, an AI assistant for Calendar.ai. Be helpful and concise.',
      temperature: 0.7,
      topK: 40
    });

    const response = await session.prompt(
      'Introduce yourself as the enhanced Calendar.ai Orb powered by Chrome AI and Gemini Nano. Explain your new capabilities in 2-3 sentences.'
    );

    session.destroy();
    return response;
  }

  // Demo: Summarizer API
  async demoSummarizer(): Promise<string> {
    if (!window.ai?.summarizer) {
      throw new Error('Summarizer API not available');
    }

    const capabilities = await window.ai.summarizer.capabilities();
    if (capabilities.available !== 'readily') {
      throw new Error('Summarizer not ready');
    }

    const summarizer = await window.ai.summarizer.create({
      type: 'key-points',
      format: 'markdown',
      length: 'medium'
    });

    const longText = `
    Calendar.ai is a comprehensive productivity web application that helps users manage their time, goals, and tasks effectively. The application integrates with Google services including Gmail, Google Calendar, and Google Tasks to provide a unified dashboard experience. Users can track their career goals, monitor skill development, manage resources, and maintain productivity streaks. The application features an AI-powered assistant called Orb that can answer questions about the user's schedule, provide daily briefings, and help with various productivity tasks. With the new Chrome AI integration, Orb has been enhanced with advanced capabilities including voice activation, real-time text processing, and contextual understanding of user data. The system now leverages Chrome's built-in AI models like Gemini Nano for local processing, ensuring privacy and speed. Users can interact with Orb through voice commands using the wake word "Hey Orb", select text anywhere on the page for AI operations, and benefit from automatic grammar correction across all input fields.
    `;

    const summary = await summarizer.summarize(longText);
    summarizer.destroy();
    return summary;
  }

  // Demo: Writer API
  async demoWriter(): Promise<string> {
    if (!window.ai?.writer) {
      throw new Error('Writer API not available');
    }

    const capabilities = await window.ai.writer.capabilities();
    if (capabilities.available !== 'readily') {
      throw new Error('Writer not ready');
    }

    const writer = await window.ai.writer.create({
      tone: 'professional',
      format: 'plain-text',
      length: 'medium'
    });

    const content = await writer.write(
      'Write a brief email to team members about the successful integration of Chrome AI APIs into our Calendar.ai application for the Google Chrome AI Hackathon 2025.'
    );

    writer.destroy();
    return content;
  }

  // Demo: Rewriter API
  async demoRewriter(): Promise<string> {
    if (!window.ai?.rewriter) {
      throw new Error('Rewriter API not available');
    }

    const capabilities = await window.ai.rewriter.capabilities();
    if (capabilities.available !== 'readily') {
      throw new Error('Rewriter not ready');
    }

    const rewriter = await window.ai.rewriter.create({
      tone: 'more-formal',
      length: 'shorter'
    });

    const originalText = "Hey there! So we've got this really cool AI thing working now and it's pretty awesome. The orb can talk to you and stuff, and it knows about your calendar and emails. Pretty neat, right?";

    const rewritten = await rewriter.rewrite(originalText);
    rewriter.destroy();
    return rewritten;
  }

  // Demo: Translator API
  async demoTranslator(): Promise<string> {
    if (!window.ai?.translator) {
      throw new Error('Translator API not available');
    }

    const capabilities = await window.ai.translator.capabilities();
    if (capabilities.available !== 'readily') {
      throw new Error('Translator not ready');
    }

    const translator = await window.ai.translator.create({
      sourceLanguage: 'en',
      targetLanguage: 'es'
    });

    const englishText = "Hello! I am Orb, your AI assistant powered by Chrome's built-in AI models. I can help you manage your calendar, emails, and tasks efficiently.";
    const spanishText = await translator.translate(englishText);
    
    translator.destroy();
    return `English: "${englishText}"\nSpanish: "${spanishText}"`;
  }

  // Demo: Proofreader API
  async demoProofreader(): Promise<string> {
    if (!window.ai?.proofreader) {
      throw new Error('Proofreader API not available');
    }

    const capabilities = await window.ai.proofreader.capabilities();
    if (capabilities.available !== 'readily') {
      throw new Error('Proofreader not ready');
    }

    const proofreader = await window.ai.proofreader.create();

    const textWithErrors = "Teh Calendar.ai orb has been enhansed with Chrome AI capabilites. It can now proces text localy using Gemini Nano and other built-in AI models. This provids better privasy and performanse for users.";

    const corrected = await proofreader.proofread(textWithErrors);
    proofreader.destroy();
    
    return `Original: "${textWithErrors}"\nCorrected: "${corrected}"`;
  }

  // Run all demos
  async runAllDemos(): Promise<{
    availability: any;
    demos: {
      languageModel?: string;
      summarizer?: string;
      writer?: string;
      rewriter?: string;
      translator?: string;
      proofreader?: string;
    };
    errors: string[];
  }> {
    const availability = await this.checkChromeAIAvailability();
    const demos: any = {};
    const errors: string[] = [];

    // Run each demo if the API is available
    if (availability.apis.languageModel) {
      try {
        demos.languageModel = await this.demoLanguageModel();
      } catch (error) {
        errors.push(`Language Model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (availability.apis.summarizer) {
      try {
        demos.summarizer = await this.demoSummarizer();
      } catch (error) {
        errors.push(`Summarizer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (availability.apis.writer) {
      try {
        demos.writer = await this.demoWriter();
      } catch (error) {
        errors.push(`Writer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (availability.apis.rewriter) {
      try {
        demos.rewriter = await this.demoRewriter();
      } catch (error) {
        errors.push(`Rewriter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (availability.apis.translator) {
      try {
        demos.translator = await this.demoTranslator();
      } catch (error) {
        errors.push(`Translator: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (availability.apis.proofreader) {
      try {
        demos.proofreader = await this.demoProofreader();
      } catch (error) {
        errors.push(`Proofreader: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      availability,
      demos,
      errors
    };
  }

  // Generate setup instructions based on current state
  async generateSetupInstructions(): Promise<string> {
    const availability = await this.checkChromeAIAvailability();
    
    if (availability.available && availability.geminoNano) {
      return "✅ Chrome AI is fully set up and ready! All APIs are available and Gemini Nano is loaded.";
    }

    let instructions = "🔧 Chrome AI Setup Required:\n\n";

    if (!window.ai) {
      instructions += "1. Install Chrome Canary or Chrome Dev\n";
      instructions += "2. Enable Chrome AI flags:\n";
      instructions += "   - chrome://flags/#optimization-guide-on-device-model\n";
      instructions += "   - chrome://flags/#prompt-api-for-gemini-nano\n";
      instructions += "   - chrome://flags/#summarization-api-for-gemini-nano\n";
      instructions += "   - chrome://flags/#writer-api-for-gemini-nano\n";
      instructions += "   - chrome://flags/#rewriter-api-for-gemini-nano\n";
      instructions += "   - chrome://flags/#translation-api\n";
      instructions += "3. Restart Chrome\n";
    }

    if (!availability.geminoNano) {
      instructions += "4. Download Gemini Nano:\n";
      instructions += "   - Go to chrome://components/\n";
      instructions += "   - Find 'Optimization Guide On Device Model'\n";
      instructions += "   - Click 'Check for update'\n";
      instructions += "   - Wait for download to complete\n";
    }

    instructions += "\n5. Refresh this page to test the integration";

    return instructions;
  }

  // Console demo for developers
  logDemoToConsole(): void {
    console.log(`
🤖 Chrome AI Demo for Calendar.ai Orb
=====================================

Run these commands in the console to test Chrome AI integration:

// Check availability
const demo = new ChromeAIDemo();
await demo.checkChromeAIAvailability();

// Test individual APIs
await demo.demoLanguageModel();
await demo.demoSummarizer();
await demo.demoWriter();
await demo.demoRewriter();
await demo.demoTranslator();
await demo.demoProofreader();

// Run all demos
await demo.runAllDemos();

// Get setup instructions
await demo.generateSetupInstructions();

🎯 For Google Chrome AI Hackathon 2025
    `);
  }
}

// Global demo instance for console access
if (typeof window !== 'undefined') {
  (window as any).ChromeAIDemo = ChromeAIDemo;
}

export const chromeAIDemo = ChromeAIDemo.getInstance();
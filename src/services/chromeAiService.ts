
// Chrome AI Service for Google Chrome AI Hackathon 2025
// Implements all Chrome AI APIs for the Dashboard Orb

import type {
  ChromeAI,
  AILanguageModel,
  AISummarizer,
  AIWriter,
  AIRewriter,
  AITranslator,
  AIProofreader,
  OrbAIRequest,
  OrbAIResponse,
  TextSelection
} from '@/types/chrome-ai';

class ChromeAIService {
  private languageModel: AILanguageModel | null = null;
  private summarizer: AISummarizer | null = null;
  private writer: AIWriter | null = null;
  private rewriter: AIRewriter | null = null;
  private translator: AITranslator | null = null;
  private proofreader: AIProofreader | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!window.ai) {
      console.warn('Chrome AI APIs not available. Make sure you are using Chrome Canary with AI features enabled.');
      return;
    }

    try {
      // Initialize all AI models
      await this.initializeLanguageModel();
      await this.initializeSummarizer();
      await this.initializeWriter();
      await this.initializeRewriter();
      await this.initializeTranslator();
      await this.initializeProofreader();
      
      this.isInitialized = true;
      console.log('Chrome AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Chrome AI Service:', error);
    }
  }

  private async initializeLanguageModel() {
    if (!window.ai?.languageModel) return;
    
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'readily') {
      this.languageModel = await window.ai.languageModel.create({
        systemPrompt: `You are Orb, an intelligent AI assistant integrated into Calendar.ai. You have access to the user's calendar events, emails, tasks, and webapp data. Provide helpful, contextual responses based on this information. Be concise but informative.`,
        temperature: 0.7,
        topK: 40
      });
    }
  }

  private async initializeSummarizer() {
    if (!window.ai?.summarizer) return;
    
    const capabilities = await window.ai.summarizer.capabilities();
    if (capabilities.available === 'readily') {
      this.summarizer = await window.ai.summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium'
      });
    }
  }

  private async initializeWriter() {
    if (!window.ai?.writer) return;
    
    const capabilities = await window.ai.writer.capabilities();
    if (capabilities.available === 'readily') {
      this.writer = await window.ai.writer.create({
        format: 'plain-text',
        length: 'medium',
        tone: 'neutral'
      });
    }
  }

  private async initializeRewriter() {
    if (!window.ai?.rewriter) return;
    
    const capabilities = await window.ai.rewriter.capabilities();
    if (capabilities.available === 'readily') {
      this.rewriter = await window.ai.rewriter.create({
        format: 'plain-text',
        length: 'as-is',
        tone: 'as-is'
      });
    }
  }

  private async initializeTranslator() {
    if (!window.ai?.translator) return;
    
    const capabilities = await window.ai.translator.capabilities();
    if (capabilities.available === 'readily') {
      // Initialize with English to Spanish as default, will recreate as needed
      this.translator = await window.ai.translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'es'
      });
    }
  }

  private async initializeProofreader() {
    if (!window.ai?.proofreader) return;
    
    const capabilities = await window.ai.proofreader.capabilities();
    if (capabilities.available === 'readily') {
      this.proofreader = await window.ai.proofreader.create();
    }
  }

  // Main AI operation handler
  async processAIRequest(request: OrbAIRequest): Promise<OrbAIResponse> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Chrome AI Service not initialized',
        operation: request.operation
      };
    }

    try {
      let result: string;

      switch (request.operation) {
        case 'summarize':
          result = await this.summarizeText(request.text, request.context);
          break;
        case 'rewrite':
          result = await this.rewriteText(request.text, request.options);
          break;
        case 'translate':
          result = await this.translateText(request.text, request.options?.targetLanguage || 'es');
          break;
        case 'proofread':
          result = await this.proofreadText(request.text);
          break;
        case 'enhance-prompt':
          result = await this.enhancePrompt(request.text, request.context);
          break;
        case 'write':
          result = await this.writeContent(request.text, request.context);
          break;
        case 'auto-correct':
          result = await this.autoCorrect(request.text);
          break;
        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }

      return {
        success: true,
        result,
        operation: request.operation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: request.operation
      };
    }
  }

  // Summarize text using Chrome AI Summarizer API
  async summarizeText(text: string, context?: string): Promise<string> {
    if (!this.summarizer) {
      throw new Error('Summarizer not available');
    }

    return await this.summarizer.summarize(text, { context });
  }

  // Rewrite text using Chrome AI Rewriter API
  async rewriteText(text: string, options?: { tone?: string; length?: string }): Promise<string> {
    if (!this.rewriter) {
      throw new Error('Rewriter not available');
    }

    // Recreate rewriter with specific options if needed
    if (options?.tone || options?.length) {
      const newRewriter = await window.ai!.rewriter.create({
        format: 'plain-text',
        length: (options.length as any) || 'as-is',
        tone: (options.tone as any) || 'as-is'
      });
      const result = await newRewriter.rewrite(text);
      newRewriter.destroy();
      return result;
    }

    return await this.rewriter.rewrite(text);
  }

  // Translate text using Chrome AI Translator API
  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!window.ai?.translator) {
      throw new Error('Translator not available');
    }

    // Create new translator for specific language pair
    const translator = await window.ai.translator.create({
      sourceLanguage: 'en', // Assuming source is English
      targetLanguage
    });

    try {
      const result = await translator.translate(text);
      return result;
    } finally {
      translator.destroy();
    }
  }

  // Proofread text using Chrome AI Proofreader API
  async proofreadText(text: string): Promise<string> {
    if (!this.proofreader) {
      throw new Error('Proofreader not available');
    }

    return await this.proofreader.proofread(text);
  }

  // Enhance prompts using Language Model
  async enhancePrompt(prompt: string, context?: string): Promise<string> {
    if (!this.languageModel) {
      throw new Error('Language model not available');
    }

    const enhancementPrompt = `
Enhance this user prompt to be more specific, clear, and effective for an AI assistant. 
Consider the context provided and make the prompt more actionable.

Original prompt: "${prompt}"
${context ? `Context: ${context}` : ''}

Enhanced prompt:`;

    return await this.languageModel.prompt(enhancementPrompt);
  }

  // Write content using Chrome AI Writer API
  async writeContent(prompt: string, context?: string): Promise<string> {
    if (!this.writer) {
      throw new Error('Writer not available');
    }

    return await this.writer.write(prompt, { context });
  }

  // Auto-correct text using Proofreader API
  async autoCorrect(text: string): Promise<string> {
    if (!this.proofreader) {
      // Fallback to language model if proofreader not available
      if (this.languageModel) {
        const correctionPrompt = `Please correct any spelling and grammar mistakes in the following text. Return only the corrected text without explanations:

"${text}"

Corrected text:`;
        return await this.languageModel.prompt(correctionPrompt);
      }
      // If no models are available, return the original text instead of throwing an error.
      console.warn('Auto-correct not available, returning original text.');
      return text;
    }

    return await this.proofreadText(text);
  }

  // Generate contextual response using Language Model with webapp data
  async generateContextualResponse(prompt: string, webappContext: any): Promise<string> {
    if (!this.languageModel) {
      throw new Error('Language model not available');
    }

    const contextualPrompt = `
Based on the user's webapp data and context, provide a helpful response to their query.

User Query: "${prompt}"

Webapp Context:
- Calendar Events: ${JSON.stringify(webappContext.events || [], null, 2)}
- Recent Emails: ${JSON.stringify(webappContext.emails || [], null, 2)}
- Tasks: ${JSON.stringify(webappContext.tasks || [], null, 2)}
- Goals: ${JSON.stringify(webappContext.goals || [], null, 2)}

Provide a contextual, helpful response:`;

    return await this.languageModel.prompt(contextualPrompt);
  }

  // Check if Chrome AI is available
  isAvailable(): boolean {
    return !!window.ai && this.isInitialized;
  }

  // Get capabilities for all APIs
  async getCapabilities() {
    if (!window.ai) return null;

    const capabilities = {
      languageModel: await window.ai.languageModel?.capabilities(),
      summarizer: await window.ai.summarizer?.capabilities(),
      writer: await window.ai.writer?.capabilities(),
      rewriter: await window.ai.rewriter?.capabilities(),
      translator: await window.ai.translator?.capabilities(),
      proofreader: await window.ai.proofreader?.capabilities()
    };

    return capabilities;
  }

  // Cleanup resources
  destroy() {
    this.languageModel?.destroy();
    this.summarizer?.destroy();
    this.writer?.destroy();
    this.rewriter?.destroy();
    this.translator?.destroy();
    this.proofreader?.destroy();
    
    this.languageModel = null;
    this.summarizer = null;
    this.writer = null;
    this.rewriter = null;
    this.translator = null;
    this.proofreader = null;
    this.isInitialized = false;
  }
}

// Text selection utilities for page-wide AI operations
export class TextSelectionHandler {
  private static instance: TextSelectionHandler;
  private currentSelection: TextSelection | null = null;
  private selectionCallbacks: ((selection: TextSelection | null) => void)[] = [];

  static getInstance(): TextSelectionHandler {
    if (!TextSelectionHandler.instance) {
      TextSelectionHandler.instance = new TextSelectionHandler();
    }
    return TextSelectionHandler.instance;
  }

  constructor() {
    this.initializeSelectionHandling();
  }

  private initializeSelectionHandling() {
    document.addEventListener('mouseup', this.handleSelection.bind(this));
    document.addEventListener('keyup', this.handleSelection.bind(this));
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  private handleSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.currentSelection = null;
      this.notifyCallbacks(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (text.length === 0) {
      this.currentSelection = null;
      this.notifyCallbacks(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const element = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
      ? range.commonAncestorContainer.parentElement!
      : range.commonAncestorContainer as HTMLElement;

    this.currentSelection = {
      text,
      element,
      range,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    };

    this.notifyCallbacks(this.currentSelection);
  }

  private handleSelectionChange() {
    // Debounce selection changes
    setTimeout(() => this.handleSelection(), 100);
  }

  private notifyCallbacks(selection: TextSelection | null) {
    this.selectionCallbacks.forEach(callback => callback(selection));
  }

  onSelectionChange(callback: (selection: TextSelection | null) => void) {
    this.selectionCallbacks.push(callback);
    return () => {
      const index = this.selectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.selectionCallbacks.splice(index, 1);
      }
    };
  }

  getCurrentSelection(): TextSelection | null {
    return this.currentSelection;
  }

  replaceSelectedText(newText: string) {
    if (!this.currentSelection) return;

    const range = this.currentSelection.range;
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    this.currentSelection = null;
    this.notifyCallbacks(null);
  }
}

// Auto-correct service for typing inputs
export class AutoCorrectService {
  private chromeAI: ChromeAIService;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private correctionCallbacks: Map<HTMLElement, (correctedText: string) => void> = new Map();

  constructor(chromeAI: ChromeAIService) {
    this.chromeAI = chromeAI;
    this.initializeAutoCorrect();
  }

  private initializeAutoCorrect() {
    // Listen for input events on text inputs and textareas
    document.addEventListener('input', this.handleInput.bind(this));
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLElement;
    
    if (!this.isTextInput(target)) return;
    
    const inputElement = target as HTMLInputElement | HTMLTextAreaElement;
    const text = inputElement.value;
    
    // Debounce auto-correction
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.performAutoCorrect(inputElement, text);
    }, 1000); // Wait 1 second after user stops typing
  }

  private isTextInput(element: HTMLElement): boolean {
    return (
      element.tagName === 'INPUT' && 
      ['text', 'email', 'search'].includes((element as HTMLInputElement).type)
    ) || element.tagName === 'TEXTAREA' || element.contentEditable === 'true';
  }

  private async performAutoCorrect(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
    if (text.length < 10) return; // Don't correct very short text
    
    try {
      const correctedText = await this.chromeAI.autoCorrect(text);
      
      if (correctedText !== text) {
        // Notify about correction but don't auto-replace
        const callback = this.correctionCallbacks.get(element);
        if (callback) {
          callback(correctedText);
        }
      }
    } catch (error) {
      console.error('Auto-correct failed:', error);
    }
  }

  onCorrection(element: HTMLElement, callback: (correctedText: string) => void) {
    this.correctionCallbacks.set(element, callback);
    return () => {
      this.correctionCallbacks.delete(element);
    };
  }
}

// Export singleton instance
export const chromeAIService = new ChromeAIService();
export const textSelectionHandler = TextSelectionHandler.getInstance();
export const autoCorrectService = new AutoCorrectService(chromeAIService);

export default chromeAIService;


// AI Flows Integration Service
// Bridges Chrome AI APIs with existing Genkit flows for seamless operation

import { chromeAIService } from './chromeAiService';
import { webappContextService } from './webappContextService';
import { answerWebAppQuestions } from '@/ai/flows/webapp-qa-flow';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing-flow';
import type { OrbAIRequest, OrbAIResponse } from '@/types/chrome-ai';

export interface AIFlowRequest {
  type: 'webapp-qa' | 'daily-briefing' | 'chrome-ai' | 'hybrid';
  prompt: string;
  userId: string;
  apiKey: string;
  chatHistory?: Array<{ role: string; content: string }>;
  options?: {
    useChrome?: boolean;
    fallbackToGenkit?: boolean;
    enhancePrompt?: boolean;
    contextType?: 'calendar' | 'email' | 'tasks' | 'goals' | 'skills';
  };
}

export interface AIFlowResponse {
  success: boolean;
  response?: string;
  source: 'chrome-ai' | 'genkit' | 'hybrid';
  error?: string;
  metadata?: {
    processingTime: number;
    tokensUsed?: number;
    contextUsed: boolean;
  };
}

class AIFlowsIntegrationService {
  private readonly CHROME_AI_TIMEOUT = 10000; // 10 seconds
  private readonly GENKIT_TIMEOUT = 30000; // Increased from 15000 to 30000

  async processRequest(request: AIFlowRequest): Promise<AIFlowResponse> {
    const startTime = Date.now();
    const { type, prompt, userId, apiKey, chatHistory = [], options = {} } = request;

    try {
      // Determine processing strategy
      const strategy = this.determineStrategy(type, options);
      
      let response: AIFlowResponse;

      switch (strategy) {
        case 'chrome-only':
          response = await this.processChromeAI(prompt, userId, options);
          break;
        case 'genkit-only':
          response = await this.processGenkit(type, prompt, userId, apiKey, chatHistory);
          break;
        case 'hybrid':
          response = await this.processHybrid(type, prompt, userId, apiKey, chatHistory, options);
          break;
        case 'chrome-with-fallback':
          response = await this.processChromeWithFallback(type, prompt, userId, apiKey, chatHistory, options);
          break;
        default:
          response = await this.processGenkit(type, prompt, userId, apiKey, chatHistory);
      }

      response.metadata = {
        ...response.metadata,
        processingTime: Date.now() - startTime
      };

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'hybrid',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    }
  }

  private determineStrategy(
    type: AIFlowRequest['type'], 
    options: AIFlowRequest['options']
  ): 'chrome-only' | 'genkit-only' | 'hybrid' | 'chrome-with-fallback' {
    // If Chrome AI is explicitly disabled or not available
    if (options.useChrome === false || !chromeAIService.isAvailable()) {
      return 'genkit-only';
    }

    // If Chrome AI is explicitly requested
    if (type === 'chrome-ai') {
      return 'chrome-only';
    }

    // If hybrid processing is requested
    if (type === 'hybrid') {
      return 'hybrid';
    }

    // Default strategy: try Chrome AI with Genkit fallback
    if (options.fallbackToGenkit !== false) {
      return 'chrome-with-fallback';
    }

    return 'chrome-only';
  }

  private async processChromeAI(
    prompt: string, 
    userId: string, 
    options: AIFlowRequest['options']
  ): Promise<AIFlowResponse> {
    try {
      // Get webapp context
      const context = await webappContextService.getContextForAI(userId, options?.contextType);
      
      // Enhance prompt if requested
      let enhancedPrompt = prompt;
      if (options?.enhancePrompt) {
        const enhanceRequest: OrbAIRequest = {
          operation: 'enhance-prompt',
          text: prompt,
          context: JSON.stringify(context)
        };
        
        const enhanceResponse = await chromeAIService.processAIRequest(enhanceRequest);
        if (enhanceResponse.success && enhanceResponse.result) {
          enhancedPrompt = enhanceResponse.result;
        }
      }

      // Generate contextual response
      const response = await Promise.race([
        chromeAIService.generateContextualResponse(enhancedPrompt, context),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Chrome AI timeout')), this.CHROME_AI_TIMEOUT)
        )
      ]);

      return {
        success: true,
        response,
        source: 'chrome-ai',
        metadata: {
          processingTime: 0, // Will be set by caller
          contextUsed: true
        }
      };
    } catch (error) {
      throw new Error(`Chrome AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processGenkit(
    type: AIFlowRequest['type'],
    prompt: string,
    userId: string,
    apiKey: string,
    chatHistory: Array<{ role: string; content: string }>
  ): Promise<AIFlowResponse> {
    try {
      let response: string;

      if (type === 'daily-briefing') {
        const result = await Promise.race([
          generateDailyBriefing({ userId, apiKey }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Genkit timeout')), this.GENKIT_TIMEOUT)
          )
        ]);
        response = result.briefing || 'Could not generate briefing';
      } else {
        const result = await Promise.race([
          answerWebAppQuestions({
            chatHistory: [...chatHistory, { role: 'user', content: prompt }],
            apiKey
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Genkit timeout')), this.GENKIT_TIMEOUT)
          )
        ]);
        response = result.response || 'Could not generate response';
      }

      return {
        success: true,
        response,
        source: 'genkit',
        metadata: {
          processingTime: 0, // Will be set by caller
          contextUsed: false
        }
      };
    } catch (error) {
      throw new Error(`Genkit processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processHybrid(
    type: AIFlowRequest['type'],
    prompt: string,
    userId: string,
    apiKey: string,
    chatHistory: Array<{ role: string; content: string }>,
    options: AIFlowRequest['options']
  ): Promise<AIFlowResponse> {
    try {
      // Run both Chrome AI and Genkit in parallel
      const [chromeResult, genkitResult] = await Promise.allSettled([
        this.processChromeAI(prompt, userId, options).catch(err => ({ error: err.message })),
        this.processGenkit(type, prompt, userId, apiKey, chatHistory).catch(err => ({ error: err.message }))
      ]);

      // Prefer Chrome AI result if available
      if (chromeResult.status === 'fulfilled' && 'response' in chromeResult.value) {
        return {
          ...chromeResult.value,
          source: 'hybrid'
        };
      }

      // Fallback to Genkit result
      if (genkitResult.status === 'fulfilled' && 'response' in genkitResult.value) {
        return {
          ...genkitResult.value,
          source: 'hybrid'
        };
      }

      // Both failed
      throw new Error('Both Chrome AI and Genkit processing failed');
    } catch (error) {
      throw new Error(`Hybrid processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processChromeWithFallback(
    type: AIFlowRequest['type'],
    prompt: string,
    userId: string,
    apiKey: string,
    chatHistory: Array<{ role: string; content: string }>,
    options: AIFlowRequest['options']
  ): Promise<AIFlowResponse> {
    try {
      // Try Chrome AI first
      return await this.processChromeAI(prompt, userId, options);
    } catch (chromeError) {
      console.warn('Chrome AI failed, falling back to Genkit:', chromeError);
      
      try {
        // Fallback to Genkit
        const genkitResult = await this.processGenkit(type, prompt, userId, apiKey, chatHistory);
        return {
          ...genkitResult,
          source: 'genkit' // Keep original source for transparency
        };
      } catch (genkitError) {
        throw new Error(`Both Chrome AI and Genkit failed. Chrome: ${chromeError instanceof Error ? chromeError.message : 'Unknown'}. Genkit: ${genkitError instanceof Error ? genkitError.message : 'Unknown'}`);
      }
    }
  }

  // Specialized methods for different AI operations
  async summarizeContent(text: string, userId: string, options?: { format?: string; length?: string }): Promise<AIFlowResponse> {
    if (!chromeAIService.isAvailable()) {
      return {
        success: false,
        error: 'Chrome AI not available for summarization',
        source: 'chrome-ai',
        metadata: { processingTime: 0, contextUsed: false }
      };
    }

    const startTime = Date.now();
    try {
      const request: OrbAIRequest = {
        operation: 'summarize',
        text,
        options: {
          format: options?.format || 'markdown',
          length: options?.length || 'medium'
        }
      };

      const response = await chromeAIService.processAIRequest(request);
      
      return {
        success: response.success,
        response: response.result,
        error: response.error,
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Summarization failed',
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    }
  }

  async translateContent(text: string, targetLanguage: string): Promise<AIFlowResponse> {
    if (!chromeAIService.isAvailable()) {
      return {
        success: false,
        error: 'Chrome AI not available for translation',
        source: 'chrome-ai',
        metadata: { processingTime: 0, contextUsed: false }
      };
    }

    const startTime = Date.now();
    try {
      const request: OrbAIRequest = {
        operation: 'translate',
        text,
        options: { targetLanguage }
      };

      const response = await chromeAIService.processAIRequest(request);
      
      return {
        success: response.success,
        response: response.result,
        error: response.error,
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    }
  }

  async rewriteContent(text: string, options?: { tone?: string; length?: string }): Promise<AIFlowResponse> {
    if (!chromeAIService.isAvailable()) {
      return {
        success: false,
        error: 'Chrome AI not available for rewriting',
        source: 'chrome-ai',
        metadata: { processingTime: 0, contextUsed: false }
      };
    }

    const startTime = Date.now();
    try {
      const request: OrbAIRequest = {
        operation: 'rewrite',
        text,
        options: {
          tone: options?.tone || 'as-is',
          length: options?.length || 'as-is'
        }
      };

      const response = await chromeAIService.processAIRequest(request);
      
      return {
        success: response.success,
        response: response.result,
        error: response.error,
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rewriting failed',
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    }
  }

  async proofreadContent(text: string): Promise<AIFlowResponse> {
    if (!chromeAIService.isAvailable()) {
      return {
        success: false,
        error: 'Chrome AI not available for proofreading',
        source: 'chrome-ai',
        metadata: { processingTime: 0, contextUsed: false }
      };
    }

    const startTime = Date.now();
    try {
      const request: OrbAIRequest = {
        operation: 'proofread',
        text
      };

      const response = await chromeAIService.processAIRequest(request);
      
      return {
        success: response.success,
        response: response.result,
        error: response.error,
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Proofreading failed',
        source: 'chrome-ai',
        metadata: {
          processingTime: Date.now() - startTime,
          contextUsed: false
        }
      };
    }
  }

  // Get AI capabilities and status
  async getAIStatus(): Promise<{
    chromeAI: {
      available: boolean;
      capabilities?: any;
    };
    genkit: {
      available: boolean;
    };
    recommended: 'chrome-ai' | 'genkit' | 'hybrid';
  }> {
    const chromeAvailable = chromeAIService.isAvailable();
    let capabilities = null;

    if (chromeAvailable) {
      try {
        capabilities = await chromeAIService.getCapabilities();
      } catch (error) {
        console.error('Failed to get Chrome AI capabilities:', error);
      }
    }

    return {
      chromeAI: {
        available: chromeAvailable,
        capabilities
      },
      genkit: {
        available: true // Assuming Genkit is always available
      },
      recommended: chromeAvailable ? 'hybrid' : 'genkit'
    };
  }
}

export const aiFlowsIntegrationService = new AIFlowsIntegrationService();
export default aiFlowsIntegrationService;

// Global AI Service - Replaces Chrome AI across the entire webapp
// This service provides a unified interface for AI operations throughout the application

import { aiProviderManager } from './ai-providers/aiProviderManager';
import { ChatMessage, AIProvider, AIModel } from '@/types/ai-providers';

export interface GlobalAIConfig {
  providerId: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AIOperation {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

class GlobalAIService {
  private currentConfig: GlobalAIConfig | null = null;
  private userId: string | null = null;

  // AI Operations that replace Chrome AI Actions
  private operations: AIOperation[] = [
    {
      id: 'summarize',
      name: 'Summarize',
      description: 'Create a concise summary of the content',
      systemPrompt: 'You are a professional summarizer. Create a clear, concise summary of the provided content. Focus on the main points and key information. Keep it brief but comprehensive.',
      temperature: 0.3,
      maxTokens: 500
    },
    {
      id: 'explain',
      name: 'Explain',
      description: 'Provide a detailed explanation',
      systemPrompt: 'You are an expert explainer. Break down complex topics into easy-to-understand explanations. Use clear language and provide context where needed.',
      temperature: 0.5,
      maxTokens: 800
    },
    {
      id: 'rewrite',
      name: 'Rewrite',
      description: 'Rewrite content in a different style',
      systemPrompt: 'You are a skilled writer. Rewrite the provided content while maintaining its core meaning. Improve clarity, flow, and readability.',
      temperature: 0.7,
      maxTokens: 1000
    },
    {
      id: 'translate',
      name: 'Translate',
      description: 'Translate content to another language',
      systemPrompt: 'You are a professional translator. Translate the provided content accurately while maintaining its tone and context. If no target language is specified, ask for clarification.',
      temperature: 0.2,
      maxTokens: 1000
    },
    {
      id: 'analyze',
      name: 'Analyze',
      description: 'Analyze and provide insights',
      systemPrompt: 'You are an analytical expert. Analyze the provided content and provide meaningful insights, patterns, and observations. Be thorough and objective.',
      temperature: 0.4,
      maxTokens: 1200
    },
    {
      id: 'improve_writing',
      name: 'Improve Writing',
      description: 'Enhance writing quality and style',
      systemPrompt: 'You are a writing coach. Improve the provided text by enhancing grammar, style, clarity, and flow. Maintain the original voice and intent.',
      temperature: 0.6,
      maxTokens: 1000
    },
    {
      id: 'generate_ideas',
      name: 'Generate Ideas',
      description: 'Brainstorm creative ideas and suggestions',
      systemPrompt: 'You are a creative brainstorming assistant. Generate innovative, practical ideas related to the given topic. Be creative but realistic.',
      temperature: 0.8,
      maxTokens: 800
    },
    {
      id: 'fact_check',
      name: 'Fact Check',
      description: 'Verify facts and provide corrections',
      systemPrompt: 'You are a fact-checking expert. Analyze the provided content for factual accuracy. Point out any potential inaccuracies and provide corrections with reliable sources when possible.',
      temperature: 0.2,
      maxTokens: 1000
    }
  ];

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadUserConfig();
  }

  private async loadUserConfig(): Promise<void> {
    if (!this.userId) return;

    try {
      const settings = await aiProviderManager.getUserSettings(this.userId);
      if (settings) {
        this.currentConfig = {
          providerId: settings.defaultProvider || 'google',
          modelId: settings.defaultModel || 'gemini-1.5-pro',
          temperature: settings.temperature || 0.7,
          maxTokens: settings.maxTokens || 2000,
          systemPrompt: settings.systemPrompt
        };
      } else {
        // Default configuration
        this.currentConfig = {
          providerId: 'google',
          modelId: 'gemini-1.5-pro',
          temperature: 0.7,
          maxTokens: 2000
        };
      }
    } catch (error) {
      console.error('Failed to load user AI config:', error);
      // Fallback to default
      this.currentConfig = {
        providerId: 'google',
        modelId: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 2000
      };
    }
  }

  async updateConfig(config: Partial<GlobalAIConfig>): Promise<void> {
    if (!this.currentConfig) return;

    this.currentConfig = { ...this.currentConfig, ...config };

    // Save to user settings
    if (this.userId) {
      try {
        await aiProviderManager.updateUserSettings(this.userId, {
          defaultProvider: this.currentConfig.providerId,
          defaultModel: this.currentConfig.modelId,
          temperature: this.currentConfig.temperature,
          maxTokens: this.currentConfig.maxTokens,
          systemPrompt: this.currentConfig.systemPrompt
        });
      } catch (error) {
        console.error('Failed to save AI config:', error);
      }
    }
  }

  getCurrentConfig(): GlobalAIConfig | null {
    return this.currentConfig;
  }

  getAvailableOperations(): AIOperation[] {
    return this.operations;
  }

  getOperation(operationId: string): AIOperation | null {
    return this.operations.find(op => op.id === operationId) || null;
  }

  // Main AI execution method that replaces Chrome AI
  async executeOperation(
    operationId: string,
    content: string,
    options?: {
      context?: string;
      customPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    success: boolean;
    result?: string;
    error?: string;
    metadata?: {
      providerId: string;
      modelId: string;
      tokenCount: number;
      responseTime: number;
      cost: number;
    };
  }> {
    if (!this.currentConfig) {
      return { success: false, error: 'AI service not initialized' };
    }

    const operation = this.getOperation(operationId);
    if (!operation) {
      return { success: false, error: 'Operation not found' };
    }

    const startTime = Date.now();

    try {
      // Prepare the prompt
      let systemPrompt = options?.customPrompt || operation.systemPrompt;
      if (options?.context) {
        systemPrompt += `\n\nContext: ${options.context}`;
      }

      // Prepare messages
      const messages: ChatMessage[] = [
        {
          id: 'system',
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now()
        },
        {
          id: 'user',
          role: 'user',
          content: content,
          timestamp: Date.now()
        }
      ];

      // Execute with current AI provider
      const response = await aiProviderManager.generateResponse(
        content,
        this.currentConfig.providerId,
        this.currentConfig.modelId,
        messages,
        {
          temperature: options?.temperature || operation.temperature,
          maxTokens: options?.maxTokens || operation.maxTokens,
          systemPrompt
        }
      );

      const endTime = Date.now();

      return {
        success: true,
        result: response.content,
        metadata: {
          providerId: this.currentConfig.providerId,
          modelId: this.currentConfig.modelId,
          tokenCount: response.usage?.totalTokens || 0,
          responseTime: endTime - startTime,
          cost: response.usage?.cost || 0
        }
      };

    } catch (error) {
      console.error(`AI operation ${operationId} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Specific methods that replace Chrome AI Actions
  async summarize(content: string, options?: { length?: 'short' | 'medium' | 'long' }): Promise<string> {
    const lengthPrompts = {
      short: 'Create a very brief summary in 1-2 sentences.',
      medium: 'Create a concise summary in 3-5 sentences.',
      long: 'Create a comprehensive summary with key details.'
    };

    const customPrompt = `You are a professional summarizer. ${lengthPrompts[options?.length || 'medium']} Focus on the main points and key information.`;

    const result = await this.executeOperation('summarize', content, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async explain(content: string, options?: { audience?: 'general' | 'technical' | 'beginner' }): Promise<string> {
    const audiencePrompts = {
      general: 'Explain this for a general audience using clear, accessible language.',
      technical: 'Provide a technical explanation with appropriate detail and terminology.',
      beginner: 'Explain this in very simple terms for someone new to the topic.'
    };

    const customPrompt = `You are an expert explainer. ${audiencePrompts[options?.audience || 'general']} Break down complex concepts clearly.`;

    const result = await this.executeOperation('explain', content, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async rewrite(content: string, options?: { style?: 'formal' | 'casual' | 'professional' | 'creative' }): Promise<string> {
    const stylePrompts = {
      formal: 'Rewrite in a formal, academic style.',
      casual: 'Rewrite in a casual, conversational style.',
      professional: 'Rewrite in a professional business style.',
      creative: 'Rewrite with creative flair and engaging language.'
    };

    const customPrompt = `You are a skilled writer. ${stylePrompts[options?.style || 'professional']} Maintain the core meaning while improving clarity and flow.`;

    const result = await this.executeOperation('rewrite', content, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async translate(content: string, targetLanguage: string): Promise<string> {
    const customPrompt = `You are a professional translator. Translate the following content to ${targetLanguage}. Maintain the tone, context, and meaning accurately.`;

    const result = await this.executeOperation('translate', content, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async improveWriting(content: string): Promise<string> {
    const result = await this.executeOperation('improve_writing', content);
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async generateIdeas(topic: string, count: number = 5): Promise<string> {
    const customPrompt = `You are a creative brainstorming assistant. Generate ${count} innovative and practical ideas related to the topic: "${topic}". Present them as a numbered list with brief explanations.`;

    const result = await this.executeOperation('generate_ideas', topic, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async factCheck(content: string): Promise<string> {
    const result = await this.executeOperation('fact_check', content);
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async analyze(content: string, analysisType?: 'sentiment' | 'structure' | 'themes' | 'general'): Promise<string> {
    const analysisPrompts = {
      sentiment: 'Analyze the sentiment and emotional tone of this content.',
      structure: 'Analyze the structure, organization, and flow of this content.',
      themes: 'Identify and analyze the main themes and topics in this content.',
      general: 'Provide a comprehensive analysis of this content.'
    };

    const customPrompt = `You are an analytical expert. ${analysisPrompts[analysisType || 'general']} Provide meaningful insights and observations.`;

    const result = await this.executeOperation('analyze', content, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  // Email-specific AI operations
  async composeEmail(
    context: string,
    options: {
      recipient?: string;
      subject?: string;
      tone?: 'formal' | 'casual' | 'friendly' | 'urgent';
      purpose?: 'request' | 'response' | 'update' | 'follow-up';
    }
  ): Promise<string> {
    const tonePrompts = {
      formal: 'Use a formal, professional tone.',
      casual: 'Use a casual, relaxed tone.',
      friendly: 'Use a warm, friendly tone.',
      urgent: 'Use an urgent but professional tone.'
    };

    const purposePrompts = {
      request: 'This is a request email asking for something.',
      response: 'This is a response to a previous email.',
      update: 'This is an update or status report email.',
      'follow-up': 'This is a follow-up email checking on something.'
    };

    let customPrompt = `You are a professional email composer. Write a well-structured email based on the following context: ${context}`;
    
    if (options.recipient) customPrompt += `\nRecipient: ${options.recipient}`;
    if (options.subject) customPrompt += `\nSubject: ${options.subject}`;
    if (options.tone) customPrompt += `\n${tonePrompts[options.tone]}`;
    if (options.purpose) customPrompt += `\n${purposePrompts[options.purpose]}`;

    customPrompt += '\n\nInclude appropriate greeting, body, and closing. Make it clear, concise, and actionable.';

    const result = await this.executeOperation('rewrite', context, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  // Calendar-specific AI operations
  async parseEventDetails(naturalLanguageInput: string): Promise<{
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
    attendees?: string[];
  }> {
    const customPrompt = `You are an event parsing assistant. Extract event details from natural language input and return them in JSON format with these fields: title, startTime (ISO format), endTime (ISO format), location, description, attendees (array of emails). If information is missing, omit the field.`;

    const result = await this.executeOperation('analyze', naturalLanguageInput, { customPrompt });
    
    if (result.success) {
      try {
        return JSON.parse(result.result!);
      } catch {
        return {};
      }
    }
    
    return {};
  }

  // File analysis operations
  async analyzeFile(fileName: string, fileContent: string, fileType: string): Promise<string> {
    const customPrompt = `You are a file analysis expert. Analyze this ${fileType} file named "${fileName}" and provide insights about its content, structure, and key information. Be comprehensive but concise.`;

    const result = await this.executeOperation('analyze', fileContent, { customPrompt });
    return result.success ? result.result! : `Error: ${result.error}`;
  }

  async extractKeyPoints(content: string, maxPoints: number = 5): Promise<string[]> {
    const customPrompt = `You are an information extraction expert. Extract the ${maxPoints} most important key points from this content. Return them as a simple numbered list, one point per line.`;

    const result = await this.executeOperation('analyze', content, { customPrompt });
    
    if (result.success) {
      // Parse the numbered list into an array
      return result.result!
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, maxPoints);
    }
    
    return [];
  }

  // Get current provider info for UI display
  getCurrentProviderInfo(): { provider: AIProvider | null; model: AIModel | null } {
    if (!this.currentConfig) {
      return { provider: null, model: null };
    }

    const providers = aiProviderManager.getAvailableProviders();
    const provider = providers.find(p => p.id === this.currentConfig!.providerId) || null;
    const model = provider?.models.find(m => m.id === this.currentConfig!.modelId) || null;

    return { provider, model };
  }
}

// Export singleton instance
export const globalAIService = new GlobalAIService();
export default globalAIService;
// AI Provider Manager - Orchestrates multiple AI providers with subscription support

import { AIProvider, AIModel, AIResponse, ChatMessage, UserAISettings } from '@/types/ai-providers';
import { AIProviderAccess, TokenUsage } from '@/types/subscription';
import { openaiService } from './openaiService';
import { anthropicService } from './anthropicService';
import { deepseekService } from './deepseekService';
import { grokService } from './grokService';
import { mistralService } from './mistralService';
import { perplexityService } from './perplexityService';
import { aiFlowsIntegrationService } from '../aiFlowsIntegration';
import { subscriptionManager } from '../subscriptionManager';

class AIProviderManager {
  private providers: Map<string, any> = new Map();
  private userSettings: UserAISettings | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Register all AI providers
    this.providers.set('openai', openaiService);
    this.providers.set('anthropic', anthropicService);
    this.providers.set('deepseek', deepseekService);
    this.providers.set('grok', grokService);
    this.providers.set('mistral', mistralService);
    this.providers.set('perplexity', perplexityService);
    this.providers.set('google', aiFlowsIntegrationService); // Fallback to existing Genkit
  }

  async loadUserSettings(userId: string): Promise<UserAISettings> {
    try {
      // Load subscription info first
      await subscriptionManager.loadUserSubscription(userId);
      
      // Load from Firebase
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const settingsDoc = await getDoc(doc(db, 'userAISettings', userId));
      
      if (settingsDoc.exists()) {
        this.userSettings = settingsDoc.data() as UserAISettings;
      } else {
        // Create default settings
        this.userSettings = this.createDefaultSettings(userId);
        await this.saveUserSettings();
      }
      
      return this.userSettings;
    } catch (error) {
      console.error('Failed to load user AI settings:', error);
      return this.createDefaultSettings(userId);
    }
  }

  private createDefaultSettings(userId: string): UserAISettings {
    return {
      userId,
      globalProvider: 'google', // Default to existing Genkit
      globalModel: 'gemini-pro',
      providers: {
        google: {
          apiKey: process.env.GEMINI_API_KEY || '',
          selectedModel: 'gemini-pro',
          isActive: true
        }
      },
      mcpServers: {},
      workflows: [],
      chatSessions: [],
      preferences: {
        showMultipleResponses: false,
        autoSaveChats: true,
        enableFileAnalysis: true,
        enableEmailAutomation: false,
        defaultTemperature: 0.7,
        defaultMaxTokens: 2048
      }
    };
  }

  async saveUserSettings(): Promise<void> {
    if (!this.userSettings) return;

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await setDoc(doc(db, 'userAISettings', this.userSettings.userId), this.userSettings);
    } catch (error) {
      console.error('Failed to save user AI settings:', error);
    }
  }

  getAvailableProviders(): AIProvider[] {
    const userId = this.userSettings?.userId || '';
    
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        displayName: 'OpenAI',
        logo: '/logos/openai-logo.svg',
        models: [
          {
            id: 'gpt-5-mini',
            name: 'GPT-5 mini',
            displayName: 'GPT-5 mini',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 400000,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'gpt-5-nano',
            name: 'GPT-5 nano',
            displayName: 'GPT-5 nano',
            speed: 'medium',
            intelligence: 'basic',
            contextWindow: 400000,
            costPerToken: 0.0000005,
            maxTokens: 2048,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'gpt-4.1',
            name: 'GPT-4.1',
            displayName: 'GPT-4.1*',
            speed: 'fast',
            intelligence: 'expert',
            contextWindow: 1000000,
            costPerToken: 0.00002,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'gpt-4.1-mini',
            name: 'GPT-4.1 mini',
            displayName: 'GPT-4.1 mini',
            speed: 'fast',
            intelligence: 'expert',
            contextWindow: 1000000,
            costPerToken: 0.00001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'gpt-4.1-nano',
            name: 'GPT-4.1 nano',
            displayName: 'GPT-4.1 nano',
            speed: 'medium',
            intelligence: 'basic',
            contextWindow: 1000000,
            costPerToken: 0.000005,
            maxTokens: 2048,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'gpt-4',
            name: 'GPT-4',
            displayName: 'GPT-4*',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 8000,
            costPerToken: 0.00003,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            displayName: 'GPT-4 Turbo*',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 127000,
            costPerToken: 0.00001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            displayName: 'GPT-4o*',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 127000,
            costPerToken: 0.000005,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            displayName: 'GPT-4o mini',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 127000,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          }
        ],
        apiKey: this.getProviderApiKey('openai'),
        isActive: this.isProviderActive('openai'),
        isConnected: this.isProviderConnected('openai'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'images', name: 'Image Understanding', description: 'Analyze and describe images', supported: true },
          { id: 'files', name: 'File Processing', description: 'Process various file formats', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        displayName: 'Anthropic',
        logo: '/logos/anthropic-logo.svg',
        models: [
          {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            displayName: 'Claude 3.5 Sonnet',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 200000,
            costPerToken: 0.000015,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'claude-3-haiku-20240307',
            name: 'Claude 3 Haiku',
            displayName: 'Claude 3 Haiku',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 200000,
            costPerToken: 0.00000025,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: false
          }
        ],
        apiKey: this.userSettings?.providers.anthropic?.apiKey || '',
        isActive: this.userSettings?.providers.anthropic?.isActive || false,
        isConnected: false,
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'images', name: 'Image Understanding', description: 'Analyze and describe images', supported: true },
          { id: 'reasoning', name: 'Advanced Reasoning', description: 'Complex problem solving', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        displayName: 'DeepSeek',
        logo: '/logos/deepseek-logo.svg',
        models: [
          {
            id: 'deepseek-chat',
            name: 'DeepSeek Chat',
            displayName: 'DeepSeek Chat',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 32768,
            costPerToken: 0.0000014,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'deepseek-coder',
            name: 'DeepSeek Coder',
            displayName: 'DeepSeek Coder',
            speed: 'fast',
            intelligence: 'expert',
            contextWindow: 16384,
            costPerToken: 0.0000014,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: true
          }
        ],
        apiKey: this.userSettings?.providers.deepseek?.apiKey || '',
        isActive: this.userSettings?.providers.deepseek?.isActive || false,
        isConnected: false,
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'coding', name: 'Code Generation', description: 'Advanced coding assistance', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'google',
        name: 'Google',
        displayName: 'Google Gemini',
        logo: '/logos/google-logo.svg',
        models: [
          {
            id: 'gemini-pro',
            name: 'Gemini Pro',
            displayName: 'Gemini Pro',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 32768,
            costPerToken: 0.000001,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'gemini-flash',
            name: 'Gemini Flash',
            displayName: 'Gemini Flash',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 32768,
            costPerToken: 0.0000005,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          }
        ],
        apiKey: process.env.GEMINI_API_KEY || '',
        isActive: true,
        isConnected: true,
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'images', name: 'Image Understanding', description: 'Analyze and describe images', supported: true },
          { id: 'files', name: 'File Processing', description: 'Process various file formats', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'mistral',
        name: 'Mistral',
        displayName: 'Mistral',
        logo: '/logos/mistral-logo.svg',
        models: [
          {
            id: 'mistral-large-latest',
            name: 'Mistral Large',
            displayName: 'Mistral Large',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 128000,
            costPerToken: 0.000004,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: true
          },
          {
            id: 'mistral-medium-latest',
            name: 'Mistral Medium',
            displayName: 'Mistral Medium',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 32000,
            costPerToken: 0.0000027,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'mistral-small-latest',
            name: 'Mistral Small',
            displayName: 'Mistral Small',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 32000,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          }
        ],
        apiKey: this.getProviderApiKey('mistral'),
        isActive: this.isProviderActive('mistral'),
        isConnected: this.isProviderConnected('mistral'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'coding', name: 'Code Generation', description: 'Advanced coding assistance', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'perplexity',
        name: 'Perplexity',
        displayName: 'Perplexity',
        logo: '/logos/perplexity-logo.svg',
        models: [
          {
            id: 'llama-3.1-sonar-large-128k-online',
            name: 'Llama 3.1 Sonar Large',
            displayName: 'Llama 3.1 Sonar Large',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 128000,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'llama-3.1-sonar-small-128k-online',
            name: 'Llama 3.1 Sonar Small',
            displayName: 'Llama 3.1 Sonar Small',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 128000,
            costPerToken: 0.0000002,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          }
        ],
        apiKey: this.getProviderApiKey('perplexity'),
        isActive: this.isProviderActive('perplexity'),
        isConnected: this.isProviderConnected('perplexity'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'search', name: 'Web Search', description: 'Real-time web search integration', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'meta',
        name: 'Meta',
        displayName: 'Meta',
        logo: '/logos/meta-logo.svg',
        models: [
          {
            id: 'llama-3.2-90b-vision-instruct',
            name: 'Llama 3.2 90B Vision',
            displayName: 'Llama 3.2 90B Vision',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 128000,
            costPerToken: 0.000002,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'llama-3.2-11b-vision-instruct',
            name: 'Llama 3.2 11B Vision',
            displayName: 'Llama 3.2 11B Vision',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 128000,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: false
          },
          {
            id: 'llama-3.2-3b-instruct',
            name: 'Llama 3.2 3B',
            displayName: 'Llama 3.2 3B',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 128000,
            costPerToken: 0.0000005,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'llama-3.2-1b-instruct',
            name: 'Llama 3.2 1B',
            displayName: 'Llama 3.2 1B',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 128000,
            costPerToken: 0.0000002,
            maxTokens: 2048,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          }
        ],
        apiKey: this.getProviderApiKey('meta'),
        isActive: this.isProviderActive('meta'),
        isConnected: this.isProviderConnected('meta'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'images', name: 'Image Understanding', description: 'Analyze and describe images', supported: true },
          { id: 'reasoning', name: 'Advanced Reasoning', description: 'Complex problem solving', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'xai',
        name: 'xAI',
        displayName: 'xAI',
        logo: '/logos/xai-logo.svg',
        models: [
          {
            id: 'grok-beta',
            name: 'Grok Beta',
            displayName: 'Grok Beta',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 131072,
            costPerToken: 0.000005,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          },
          {
            id: 'grok-vision-beta',
            name: 'Grok Vision Beta',
            displayName: 'Grok Vision Beta',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 8192,
            costPerToken: 0.000005,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: true,
            supportsFiles: true
          }
        ],
        apiKey: this.getProviderApiKey('xai'),
        isActive: this.isProviderActive('xai'),
        isConnected: this.isProviderConnected('xai'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'images', name: 'Image Understanding', description: 'Analyze and describe images', supported: true },
          { id: 'realtime', name: 'Real-time Data', description: 'Access to real-time information', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'moonshot',
        name: 'Moonshot AI',
        displayName: 'Moonshot AI',
        logo: '/logos/moonshot-logo.svg',
        models: [
          {
            id: 'moonshot-v1-128k',
            name: 'Moonshot v1 128K',
            displayName: 'Moonshot v1 128K',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 128000,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: true
          },
          {
            id: 'moonshot-v1-32k',
            name: 'Moonshot v1 32K',
            displayName: 'Moonshot v1 32K',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 32000,
            costPerToken: 0.0000005,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'moonshot-v1-8k',
            name: 'Moonshot v1 8K',
            displayName: 'Moonshot v1 8K',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 8000,
            costPerToken: 0.0000002,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          }
        ],
        apiKey: this.getProviderApiKey('moonshot'),
        isActive: this.isProviderActive('moonshot'),
        isConnected: this.isProviderConnected('moonshot'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'longcontext', name: 'Long Context', description: 'Handle very long conversations', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      },
      {
        id: 'qwen',
        name: 'Qwen',
        displayName: 'Qwen',
        logo: '/logos/qwen-logo.svg',
        models: [
          {
            id: 'qwen2.5-72b-instruct',
            name: 'Qwen2.5 72B',
            displayName: 'Qwen2.5 72B',
            speed: 'medium',
            intelligence: 'expert',
            contextWindow: 131072,
            costPerToken: 0.000002,
            maxTokens: 8192,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: true
          },
          {
            id: 'qwen2.5-32b-instruct',
            name: 'Qwen2.5 32B',
            displayName: 'Qwen2.5 32B',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 131072,
            costPerToken: 0.000001,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'qwen2.5-14b-instruct',
            name: 'Qwen2.5 14B',
            displayName: 'Qwen2.5 14B',
            speed: 'fast',
            intelligence: 'advanced',
            contextWindow: 131072,
            costPerToken: 0.0000007,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          },
          {
            id: 'qwen2.5-7b-instruct',
            name: 'Qwen2.5 7B',
            displayName: 'Qwen2.5 7B',
            speed: 'fast',
            intelligence: 'basic',
            contextWindow: 131072,
            costPerToken: 0.0000003,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsImages: false,
            supportsFiles: false
          }
        ],
        apiKey: this.getProviderApiKey('qwen'),
        isActive: this.isProviderActive('qwen'),
        isConnected: this.isProviderConnected('qwen'),
        capabilities: [
          { id: 'text', name: 'Text Generation', description: 'Generate human-like text', supported: true },
          { id: 'multilingual', name: 'Multilingual', description: 'Support for multiple languages', supported: true },
          { id: 'coding', name: 'Code Generation', description: 'Advanced coding assistance', supported: true },
          { id: 'streaming', name: 'Streaming', description: 'Real-time response streaming', supported: true }
        ]
      }
    ];
  }

  async generateResponse(
    message: string,
    providerId: string,
    modelId: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      attachments?: any[];
    }
  ): Promise<AIResponse> {
    const userId = this.userSettings?.userId || '';
    
    // Check if user can use this provider/model
    const accessCheck = subscriptionManager.canUseProvider(providerId, modelId);
    if (!accessCheck.allowed) {
      throw new Error(accessCheck.reason || 'Access denied');
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Set up API key based on access type
    const apiKey = await this.getProviderApiKey(providerId);
    if (!apiKey) {
      throw new Error(`No API key available for ${providerId}`);
    }
    
    provider.setApiKey(apiKey);

    const startTime = Date.now();
    
    try {
      const response = await provider.generateResponse(message, modelId, options);
      const endTime = Date.now();

      const aiResponse: AIResponse = {
        id: `${providerId}-${Date.now()}`,
        providerId,
        modelId,
        content: response.content,
        tokens: response.tokens || { input: 0, output: 0, total: 0 },
        cost: response.cost || 0,
        latency: endTime - startTime,
        timestamp: Date.now()
      };

      // Track usage for subscription management
      if (userId) {
        const usage: TokenUsage = {
          providerId,
          modelId,
          inputTokens: aiResponse.tokens.input,
          outputTokens: aiResponse.tokens.output,
          totalTokens: aiResponse.tokens.total,
          cost: aiResponse.cost,
          timestamp: Date.now(),
          userId,
          sessionId: options?.sessionId || 'unknown',
          messageId: options?.messageId || 'unknown'
        };
        
        await subscriptionManager.trackTokenUsage(usage);
      }

      return aiResponse;
    } catch (error) {
      return {
        id: `${providerId}-${Date.now()}`,
        providerId,
        modelId,
        content: '',
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        latency: Date.now() - startTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateMultipleResponses(
    message: string,
    activeProviders: { providerId: string; modelId: string }[],
    options?: any
  ): Promise<AIResponse[]> {
    const promises = activeProviders.map(({ providerId, modelId }) =>
      this.generateResponse(message, providerId, modelId, options)
    );

    return Promise.all(promises);
  }

  async testConnection(providerId: string, apiKey: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      return await provider.testConnection(apiKey);
    } catch (error) {
      console.error(`Connection test failed for ${providerId}:`, error);
      return false;
    }
  }

  updateProviderSettings(providerId: string, settings: any): void {
    if (!this.userSettings) return;

    this.userSettings.providers[providerId] = {
      ...this.userSettings.providers[providerId],
      ...settings
    };

    this.saveUserSettings();
  }

  setGlobalProvider(providerId: string, modelId: string): void {
    if (!this.userSettings) return;

    this.userSettings.globalProvider = providerId;
    this.userSettings.globalModel = modelId;

    this.saveUserSettings();
  }

  getGlobalProvider(): { providerId: string; modelId: string } {
    return {
      providerId: this.userSettings?.globalProvider || 'google',
      modelId: this.userSettings?.globalModel || 'gemini-pro'
    };
  }

  // Global AI method that replaces Genkit across the webapp
  async generateGlobalResponse(
    prompt: string,
    options?: any
  ): Promise<string> {
    const { providerId, modelId } = this.getGlobalProvider();
    const response = await this.generateResponse(prompt, providerId, modelId, options);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.content;
  }

  // Stream response for real-time chat
  async *streamGlobalResponse(
    prompt: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    const { providerId, modelId } = this.getGlobalProvider();
    const provider = this.providers.get(providerId);
    
    if (!provider || !provider.streamResponse) {
      // Fallback to regular response
      const response = await this.generateGlobalResponse(prompt, options);
      yield response;
      return;
    }

    yield* provider.streamResponse(prompt, modelId, options);
  }

  // Helper methods for subscription integration
  private async getProviderApiKey(providerId: string): Promise<string | null> {
    const userId = this.userSettings?.userId || '';
    const access = subscriptionManager.getAIProviderAccess(userId, providerId);
    
    switch (access.accessType) {
      case 'pro_managed':
        // Use our managed API keys for Pro users
        return await subscriptionManager.getManagedAPIKey(providerId);
      
      case 'user_api_key':
        // Use user's own API key
        return this.userSettings?.providers[providerId]?.apiKey || null;
      
      case 'free_tier':
        // Use our managed keys for free tier (limited usage)
        if (providerId === 'google') {
          return process.env.GEMINI_API_KEY || null;
        }
        return null;
      
      default:
        return null;
    }
  }

  private isProviderActive(providerId: string): boolean {
    const userId = this.userSettings?.userId || '';
    const access = subscriptionManager.getAIProviderAccess(userId, providerId);
    return access.isActive;
  }

  private isProviderConnected(providerId: string): boolean {
    const userId = this.userSettings?.userId || '';
    const access = subscriptionManager.getAIProviderAccess(userId, providerId);
    
    // Check if we have a valid API key
    if (access.accessType === 'pro_managed') {
      return true; // Pro users always have access through our managed keys
    }
    
    if (access.accessType === 'user_api_key') {
      return !!(this.userSettings?.providers[providerId]?.apiKey);
    }
    
    if (access.accessType === 'free_tier') {
      return providerId === 'google'; // Only Google is available for free
    }
    
    return false;
  }

  // Get provider access information for UI
  getProviderAccessInfo(providerId: string): {
    accessType: 'pro_managed' | 'user_api_key' | 'free_tier';
    isActive: boolean;
    requiresApiKey: boolean;
    requiresUpgrade: boolean;
    usageInfo?: {
      used: number;
      limit: number;
      resetDate: number;
    };
  } {
    const userId = this.userSettings?.userId || '';
    const access = subscriptionManager.getAIProviderAccess(userId, providerId);
    const canUse = subscriptionManager.canUseProvider(providerId);
    
    return {
      accessType: access.accessType,
      isActive: access.isActive,
      requiresApiKey: canUse.requiresApiKey || false,
      requiresUpgrade: canUse.requiresUpgrade || false,
      usageInfo: access.limits ? {
        used: access.limits.tokensUsed,
        limit: access.limits.monthlyTokens,
        resetDate: access.limits.lastResetDate
      } : undefined
    };
  }

  // Get subscription status
  getSubscriptionStatus(): {
    isPro: boolean;
    isEnterprise: boolean;
    planName: string;
    canUpgrade: boolean;
  } {
    const currentPlan = subscriptionManager.getCurrentPlan();
    
    return {
      isPro: subscriptionManager.isPro(),
      isEnterprise: subscriptionManager.isEnterprise(),
      planName: currentPlan?.displayName || 'Free',
      canUpgrade: !subscriptionManager.isEnterprise()
    };
  }

  // Upgrade subscription
  async upgradeSubscription(planId: string, paymentMethod: 'stripe' | 'razorpay'): Promise<{
    success: boolean;
    error?: string;
  }> {
    const userId = this.userSettings?.userId || '';
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await subscriptionManager.upgradeSubscription(userId, planId, paymentMethod);
    
    if (result.success) {
      // Reload settings to reflect new subscription
      await this.loadUserSettings(userId);
    }
    
    return result;
  }
}

export const aiProviderManager = new AIProviderManager();
export default aiProviderManager;
// Subscription Manager - Handles Pro plans and AI provider access

import { 
  SubscriptionPlan, 
  UserSubscription, 
  AIProviderAccess, 
  TokenUsage,
  ProAIProvider 
} from '@/types/subscription';
import { AIProvider } from '@/types/ai-providers';

class SubscriptionManager {
  private plans: SubscriptionPlan[] = [];
  private userSubscription: UserSubscription | null = null;

  constructor() {
    this.initializePlans();
  }

  private initializePlans() {
    this.plans = [
      {
        id: 'free',
        name: 'Free',
        displayName: 'Free Plan',
        price: { monthly: 0, yearly: 0 },
        features: [
          'Basic AI chat with Gemini',
          '100 messages per day',
          'Basic file attachments',
          'Community support'
        ],
        aiProviders: [
          {
            providerId: 'google',
            modelIds: ['gemini-flash'],
            monthlyTokenAllowance: 50000,
            isUnlimited: false,
            priority: 1
          }
        ],
        limits: {
          monthlyTokens: 50000,
          dailyRequests: 100,
          maxConcurrentChats: 1,
          maxFileSize: 5, // 5MB
          maxFilesPerChat: 3
        },
        isActive: true
      },
      {
        id: 'pro',
        name: 'Pro',
        displayName: 'Pro Plan',
        price: { monthly: 20, yearly: 200 },
        features: [
          'Access to all AI providers (OpenAI, Anthropic, DeepSeek, etc.)',
          'Unlimited messages',
          'Advanced file processing',
          'Email automation',
          'MCP integrations',
          'Workflow automation',
          'Priority support',
          'Early access to new features'
        ],
        aiProviders: [
          {
            providerId: 'openai',
            modelIds: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
            monthlyTokenAllowance: 1000000,
            isUnlimited: false,
            priority: 5
          },
          {
            providerId: 'anthropic',
            modelIds: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
            monthlyTokenAllowance: 500000,
            isUnlimited: false,
            priority: 5
          },
          {
            providerId: 'deepseek',
            modelIds: ['deepseek-chat', 'deepseek-coder'],
            monthlyTokenAllowance: 2000000,
            isUnlimited: false,
            priority: 4
          },
          {
            providerId: 'google',
            modelIds: ['gemini-pro', 'gemini-flash'],
            monthlyTokenAllowance: 1000000,
            isUnlimited: false,
            priority: 4
          }
        ],
        limits: {
          monthlyTokens: 5000000,
          dailyRequests: 10000,
          maxConcurrentChats: 10,
          maxFileSize: 100, // 100MB
          maxFilesPerChat: 20
        },
        isActive: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        displayName: 'Enterprise Plan',
        price: { monthly: 100, yearly: 1000 },
        features: [
          'Everything in Pro',
          'Unlimited AI usage',
          'Custom AI model fine-tuning',
          'Advanced analytics',
          'Team collaboration',
          'SSO integration',
          'Dedicated support',
          'Custom integrations'
        ],
        aiProviders: [
          {
            providerId: 'openai',
            modelIds: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
            monthlyTokenAllowance: 0,
            isUnlimited: true,
            priority: 10
          },
          {
            providerId: 'anthropic',
            modelIds: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
            monthlyTokenAllowance: 0,
            isUnlimited: true,
            priority: 10
          },
          {
            providerId: 'deepseek',
            modelIds: ['deepseek-chat', 'deepseek-coder'],
            monthlyTokenAllowance: 0,
            isUnlimited: true,
            priority: 8
          },
          {
            providerId: 'google',
            modelIds: ['gemini-pro', 'gemini-flash'],
            monthlyTokenAllowance: 0,
            isUnlimited: true,
            priority: 8
          }
        ],
        limits: {
          monthlyTokens: 0, // Unlimited
          dailyRequests: 0, // Unlimited
          maxConcurrentChats: 50,
          maxFileSize: 500, // 500MB
          maxFilesPerChat: 100
        },
        isActive: true
      }
    ];
  }

  async loadUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const subscriptionDoc = await getDoc(doc(db, 'userSubscriptions', userId));
      
      if (subscriptionDoc.exists()) {
        this.userSubscription = subscriptionDoc.data() as UserSubscription;
        return this.userSubscription;
      }
      
      // Create default free subscription
      const freeSubscription: UserSubscription = {
        userId,
        planId: 'free',
        status: 'active',
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        usage: {
          monthlyTokensUsed: 0,
          dailyRequestsUsed: 0,
          lastResetDate: Date.now()
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await this.saveUserSubscription(freeSubscription);
      this.userSubscription = freeSubscription;
      return freeSubscription;
    } catch (error) {
      console.error('Failed to load user subscription:', error);
      return null;
    }
  }

  async saveUserSubscription(subscription: UserSubscription): Promise<void> {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await setDoc(doc(db, 'userSubscriptions', subscription.userId), subscription);
      this.userSubscription = subscription;
    } catch (error) {
      console.error('Failed to save user subscription:', error);
    }
  }

  getAvailablePlans(): SubscriptionPlan[] {
    return this.plans.filter(plan => plan.isActive);
  }

  getCurrentPlan(): SubscriptionPlan | null {
    if (!this.userSubscription) return null;
    return this.plans.find(plan => plan.id === this.userSubscription!.planId) || null;
  }

  isPro(): boolean {
    const currentPlan = this.getCurrentPlan();
    return currentPlan ? ['pro', 'enterprise'].includes(currentPlan.id) : false;
  }

  isEnterprise(): boolean {
    const currentPlan = this.getCurrentPlan();
    return currentPlan?.id === 'enterprise';
  }

  // Get AI provider access configuration
  getAIProviderAccess(userId: string, providerId: string): AIProviderAccess {
    const currentPlan = this.getCurrentPlan();
    
    if (!currentPlan) {
      // Default free access
      return {
        providerId,
        accessType: 'free_tier',
        isActive: providerId === 'google',
        limits: {
          monthlyTokens: 50000,
          dailyRequests: 100,
          tokensUsed: 0,
          requestsUsed: 0,
          lastResetDate: Date.now()
        }
      };
    }

    const proProvider = currentPlan.aiProviders.find(p => p.providerId === providerId);
    
    if (proProvider) {
      // Pro managed access
      return {
        providerId,
        accessType: 'pro_managed',
        isActive: true,
        limits: proProvider.isUnlimited ? undefined : {
          monthlyTokens: proProvider.monthlyTokenAllowance,
          dailyRequests: currentPlan.limits.dailyRequests,
          tokensUsed: this.userSubscription?.usage.monthlyTokensUsed || 0,
          requestsUsed: this.userSubscription?.usage.dailyRequestsUsed || 0,
          lastResetDate: this.userSubscription?.usage.lastResetDate || Date.now()
        },
        proConfig: {
          allowedModels: proProvider.modelIds,
          priority: proProvider.priority,
          isUnlimited: proProvider.isUnlimited
        }
      };
    }

    // Allow user API key access for non-covered providers
    return {
      providerId,
      accessType: 'user_api_key',
      isActive: false, // User needs to provide API key
      limits: {
        monthlyTokens: 0, // No limits for user's own API key
        dailyRequests: 0,
        tokensUsed: 0,
        requestsUsed: 0,
        lastResetDate: Date.now()
      }
    };
  }

  // Check if user can use a specific provider/model
  canUseProvider(providerId: string, modelId?: string): {
    allowed: boolean;
    reason?: string;
    requiresApiKey?: boolean;
    requiresUpgrade?: boolean;
  } {
    const access = this.getAIProviderAccess(this.userSubscription?.userId || '', providerId);
    
    if (!access.isActive) {
      if (access.accessType === 'user_api_key') {
        return {
          allowed: false,
          requiresApiKey: true,
          reason: 'Please provide your API key for this provider'
        };
      }
      
      return {
        allowed: false,
        requiresUpgrade: true,
        reason: 'Upgrade to Pro to access this AI provider'
      };
    }

    // Check model access for pro users
    if (access.accessType === 'pro_managed' && modelId && access.proConfig) {
      if (!access.proConfig.allowedModels.includes(modelId)) {
        return {
          allowed: false,
          requiresUpgrade: true,
          reason: 'This model requires a higher tier subscription'
        };
      }
    }

    // Check usage limits
    if (access.limits && !access.limits) {
      const now = Date.now();
      const daysSinceReset = (now - access.limits.lastResetDate) / (1000 * 60 * 60 * 24);
      
      // Reset daily limits
      if (daysSinceReset >= 1) {
        access.limits.requestsUsed = 0;
        access.limits.lastResetDate = now;
      }
      
      // Reset monthly limits
      if (daysSinceReset >= 30) {
        access.limits.tokensUsed = 0;
      }
      
      // Check daily request limit
      if (access.limits.dailyRequests > 0 && access.limits.requestsUsed >= access.limits.dailyRequests) {
        return {
          allowed: false,
          reason: 'Daily request limit reached. Upgrade for higher limits.'
        };
      }
      
      // Check monthly token limit
      if (access.limits.monthlyTokens > 0 && access.limits.tokensUsed >= access.limits.monthlyTokens) {
        return {
          allowed: false,
          reason: 'Monthly token limit reached. Upgrade for higher limits.'
        };
      }
    }

    return { allowed: true };
  }

  // Track token usage
  async trackTokenUsage(usage: TokenUsage): Promise<void> {
    if (!this.userSubscription) return;

    try {
      // Update user subscription usage
      const updatedSubscription = {
        ...this.userSubscription,
        usage: {
          ...this.userSubscription.usage,
          monthlyTokensUsed: this.userSubscription.usage.monthlyTokensUsed + usage.totalTokens,
          dailyRequestsUsed: this.userSubscription.usage.dailyRequestsUsed + 1
        },
        updatedAt: Date.now()
      };

      await this.saveUserSubscription(updatedSubscription);

      // Save detailed usage record
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await addDoc(collection(db, 'tokenUsage'), usage);
    } catch (error) {
      console.error('Failed to track token usage:', error);
    }
  }

  // Get usage statistics
  async getUsageStats(userId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<{
    totalTokens: number;
    totalRequests: number;
    totalCost: number;
    providerBreakdown: Record<string, {
      tokens: number;
      requests: number;
      cost: number;
    }>;
  }> {
    try {
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const now = Date.now();
      let startTime = now;
      
      switch (period) {
        case 'day':
          startTime = now - (24 * 60 * 60 * 1000);
          break;
        case 'week':
          startTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = now - (30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      const usageQuery = query(
        collection(db, 'tokenUsage'),
        where('userId', '==', userId),
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(usageQuery);
      const usageRecords = snapshot.docs.map(doc => doc.data() as TokenUsage);
      
      const stats = {
        totalTokens: 0,
        totalRequests: usageRecords.length,
        totalCost: 0,
        providerBreakdown: {} as Record<string, { tokens: number; requests: number; cost: number }>
      };
      
      usageRecords.forEach(record => {
        stats.totalTokens += record.totalTokens;
        stats.totalCost += record.cost;
        
        if (!stats.providerBreakdown[record.providerId]) {
          stats.providerBreakdown[record.providerId] = {
            tokens: 0,
            requests: 0,
            cost: 0
          };
        }
        
        stats.providerBreakdown[record.providerId].tokens += record.totalTokens;
        stats.providerBreakdown[record.providerId].requests += 1;
        stats.providerBreakdown[record.providerId].cost += record.cost;
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        totalTokens: 0,
        totalRequests: 0,
        totalCost: 0,
        providerBreakdown: {}
      };
    }
  }

  // Upgrade subscription
  async upgradeSubscription(userId: string, planId: string, paymentMethod: 'stripe' | 'razorpay'): Promise<{
    success: boolean;
    subscriptionId?: string;
    error?: string;
  }> {
    try {
      const plan = this.plans.find(p => p.id === planId);
      if (!plan) {
        return { success: false, error: 'Invalid plan selected' };
      }

      // Create subscription via payment processor
      let subscriptionId: string;
      
      if (paymentMethod === 'stripe') {
        // Implement Stripe subscription creation
        subscriptionId = await this.createStripeSubscription(userId, planId);
      } else {
        // Implement Razorpay subscription creation
        subscriptionId = await this.createRazorpaySubscription(userId, planId);
      }

      // Update user subscription
      const updatedSubscription: UserSubscription = {
        userId,
        planId,
        status: 'active',
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        ...(paymentMethod === 'stripe' ? { stripeSubscriptionId: subscriptionId } : { razorpaySubscriptionId: subscriptionId }),
        usage: {
          monthlyTokensUsed: 0,
          dailyRequestsUsed: 0,
          lastResetDate: Date.now()
        },
        createdAt: this.userSubscription?.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      await this.saveUserSubscription(updatedSubscription);

      return { success: true, subscriptionId };
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return { success: false, error: 'Failed to process subscription upgrade' };
    }
  }

  private async createStripeSubscription(userId: string, planId: string): Promise<string> {
    // Implement Stripe subscription creation
    // This would integrate with your existing Stripe setup
    throw new Error('Stripe integration not implemented');
  }

  private async createRazorpaySubscription(userId: string, planId: string): Promise<string> {
    // Implement Razorpay subscription creation
    // This would integrate with your existing Razorpay setup
    throw new Error('Razorpay integration not implemented');
  }

  // Get our managed API keys for Pro users
  async getManagedAPIKey(providerId: string): Promise<string | null> {
    if (!this.isPro()) return null;

    // In production, these would be stored securely and rotated regularly
    const managedKeys: Record<string, string> = {
      'openai': process.env.MANAGED_OPENAI_API_KEY || '',
      'anthropic': process.env.MANAGED_ANTHROPIC_API_KEY || '',
      'deepseek': process.env.MANAGED_DEEPSEEK_API_KEY || '',
      'mistral': process.env.MANAGED_MISTRAL_API_KEY || '',
      'perplexity': process.env.MANAGED_PERPLEXITY_API_KEY || ''
    };

    return managedKeys[providerId] || null;
  }
}

export const subscriptionManager = new SubscriptionManager();
export default subscriptionManager;
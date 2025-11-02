// Subscription and Pro Plan Types

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  aiProviders: ProAIProvider[];
  limits: {
    monthlyTokens: number;
    dailyRequests: number;
    maxConcurrentChats: number;
    maxFileSize: number; // in MB
    maxFilesPerChat: number;
  };
  isActive: boolean;
}

export interface ProAIProvider {
  providerId: string;
  modelIds: string[];
  monthlyTokenAllowance: number;
  isUnlimited: boolean;
  priority: number; // Higher priority = better models
}

export interface UserSubscription {
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  razorpaySubscriptionId?: string;
  usage: {
    monthlyTokensUsed: number;
    dailyRequestsUsed: number;
    lastResetDate: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface AIProviderAccess {
  providerId: string;
  accessType: 'user_api_key' | 'pro_managed' | 'free_tier';
  apiKey?: string; // Only for user_api_key type
  isActive: boolean;
  limits?: {
    monthlyTokens: number;
    dailyRequests: number;
    tokensUsed: number;
    requestsUsed: number;
    lastResetDate: number;
  };
  proConfig?: {
    allowedModels: string[];
    priority: number;
    isUnlimited: boolean;
  };
}

export interface TokenUsage {
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
  userId: string;
  sessionId: string;
  messageId: string;
}

export interface APIKeyValidation {
  providerId: string;
  isValid: boolean;
  error?: string;
  availableModels?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  accountInfo?: {
    tier: string;
    credits: number;
    usage: number;
  };
}
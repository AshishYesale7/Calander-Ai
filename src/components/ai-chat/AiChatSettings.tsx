'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Zap, 
  Brain, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Eye,
  EyeOff,
  TestTube,
  Workflow,
  Bot,
  Server,
  Plug,
  Activity
} from 'lucide-react';
import { aiProviderManager } from '@/services/ai-providers/aiProviderManager';
import { AIProvider, UserAISettings } from '@/types/ai-providers';
import { SubscriptionPlan } from '@/types/subscription';
import { subscriptionManager } from '@/services/subscriptionManager';
import { MCPSettings } from './MCPSettings';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AiChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiChatSettings({ isOpen, onClose }: AiChatSettingsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ai-settings');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [userSettings, setUserSettings] = useState<UserAISettings | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    try {
      const settings = await aiProviderManager.loadUserSettings(user?.uid || '');
      setUserSettings(settings);
      setProviders(aiProviderManager.getAvailableProviders());
      setSubscriptionStatus(aiProviderManager.getSubscriptionStatus());
      setAvailablePlans(subscriptionManager.getAvailablePlans());
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI settings',
        variant: 'destructive'
      });
    }
  };

  const handleProviderToggle = (providerId: string, isActive: boolean) => {
    if (!userSettings) return;

    const updatedSettings = {
      ...userSettings,
      providers: {
        ...userSettings.providers,
        [providerId]: {
          ...userSettings.providers[providerId],
          isActive
        }
      }
    };

    setUserSettings(updatedSettings);
    aiProviderManager.updateProviderSettings(providerId, { isActive });
  };

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    if (!userSettings) return;

    const updatedSettings = {
      ...userSettings,
      providers: {
        ...userSettings.providers,
        [providerId]: {
          ...userSettings.providers[providerId],
          apiKey
        }
      }
    };

    setUserSettings(updatedSettings);
    aiProviderManager.updateProviderSettings(providerId, { apiKey });
  };

  const handleModelChange = (providerId: string, modelId: string) => {
    if (!userSettings) return;

    const updatedSettings = {
      ...userSettings,
      providers: {
        ...userSettings.providers,
        [providerId]: {
          ...userSettings.providers[providerId],
          selectedModel: modelId
        }
      }
    };

    setUserSettings(updatedSettings);
    aiProviderManager.updateProviderSettings(providerId, { selectedModel: modelId });
  };

  const handleGlobalProviderChange = (providerId: string, modelId: string) => {
    if (!userSettings) return;

    const updatedSettings = {
      ...userSettings,
      globalProvider: providerId,
      globalModel: modelId
    };

    setUserSettings(updatedSettings);
    aiProviderManager.setGlobalProvider(providerId, modelId);
    
    toast({
      title: 'Global AI Provider Updated',
      description: `Now using ${providerId} ${modelId} across the entire webapp`
    });
  };

  const testConnection = async (providerId: string, apiKey: string) => {
    setTestingProvider(providerId);
    
    try {
      const isConnected = await aiProviderManager.testConnection(providerId, apiKey);
      
      toast({
        title: isConnected ? 'Connection Successful' : 'Connection Failed',
        description: isConnected 
          ? `Successfully connected to ${providerId}` 
          : `Failed to connect to ${providerId}. Please check your API key.`,
        variant: isConnected ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: `Error testing connection to ${providerId}`,
        variant: 'destructive'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'slow': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getIntelligenceColor = (intelligence: string) => {
    switch (intelligence) {
      case 'expert': return 'bg-purple-500';
      case 'advanced': return 'bg-blue-500';
      case 'basic': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Chat Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-settings" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Settings
            </TabsTrigger>
            <TabsTrigger value="pro" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Pro
            </TabsTrigger>
            <TabsTrigger value="mcps" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              MCPs
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Automation
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="ai-settings" className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  Choose a <span className="italic">faster</span> model when speed matters and a
                </h3>
                <p className="text-muted-foreground">
                  smarter one for more complex tasks.
                </p>
              </div>

              {/* Global Provider Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Global AI Provider
                  </CardTitle>
                  <CardDescription>
                    This provider will be used across the entire webapp for all AI operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Label>Current Global Provider:</Label>
                    <Badge variant="outline" className="text-sm">
                      {userSettings?.globalProvider} - {userSettings?.globalModel}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* AI Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => {
                  const accessInfo = aiProviderManager.getProviderAccessInfo(provider.id);
                  
                  return (
                    <Card key={provider.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={provider.logo} 
                              alt={provider.displayName}
                              className="w-8 h-8 rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logos/default-ai-logo.svg';
                              }}
                            />
                            <div>
                              <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                {provider.isConnected ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {provider.isConnected ? 'Connected' : 'Not Connected'}
                                </span>
                                
                                {/* Access Type Badge */}
                                <Badge 
                                  variant={accessInfo.accessType === 'pro_managed' ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {accessInfo.accessType === 'pro_managed' && 'Pro'}
                                  {accessInfo.accessType === 'user_api_key' && 'Your Key'}
                                  {accessInfo.accessType === 'free_tier' && 'Free'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={accessInfo.isActive}
                            onCheckedChange={(checked) => handleProviderToggle(provider.id, checked)}
                            disabled={accessInfo.requiresUpgrade && !accessInfo.isActive}
                          />
                        </div>
                      </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Upgrade Prompt for Non-Pro Users */}
                      {accessInfo.requiresUpgrade && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Pro Feature
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                            Upgrade to Pro to access {provider.displayName} with our managed API keys
                          </p>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Upgrade to Pro
                          </Button>
                        </div>
                      )}

                      {/* Usage Information for Pro Users */}
                      {accessInfo.accessType === 'pro_managed' && accessInfo.usageInfo && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              Monthly Usage
                            </span>
                            <Badge variant="outline" className="text-xs text-green-700">
                              Pro Managed
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Tokens Used:</span>
                              <span>{accessInfo.usageInfo.used.toLocaleString()} / {accessInfo.usageInfo.limit.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((accessInfo.usageInfo.used / accessInfo.usageInfo.limit) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* API Key Input - Only for user_api_key access type */}
                      {accessInfo.accessType === 'user_api_key' && (
                        <div className="space-y-2">
                          <Label htmlFor={`${provider.id}-api-key`}>Your API Key</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id={`${provider.id}-api-key`}
                                type={showApiKeys[provider.id] ? 'text' : 'password'}
                                placeholder="Enter your API key..."
                                value={userSettings?.providers[provider.id]?.apiKey || ''}
                                onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => toggleApiKeyVisibility(provider.id)}
                              >
                                {showApiKeys[provider.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testConnection(provider.id, userSettings?.providers[provider.id]?.apiKey || '')}
                              disabled={testingProvider === provider.id || !userSettings?.providers[provider.id]?.apiKey}
                            >
                              {testingProvider === provider.id ? (
                                <TestTube className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Get your API key from {provider.displayName}'s developer portal
                          </p>
                        </div>
                      )}

                      {/* Model Selection */}
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                          value={userSettings?.providers[provider.id]?.selectedModel || provider.models[0]?.id}
                          onValueChange={(value) => handleModelChange(provider.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model..." />
                          </SelectTrigger>
                          <SelectContent>
                            {provider.models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{model.displayName}</span>
                                  <div className="flex items-center gap-2 ml-4">
                                    <div className={`w-2 h-2 rounded-full ${getSpeedColor(model.speed)}`} />
                                    <div className={`w-2 h-2 rounded-full ${getIntelligenceColor(model.intelligence)}`} />
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Model Details */}
                      {provider.models.length > 0 && (
                        <div className="space-y-2">
                          {provider.models.map((model) => (
                            <div key={model.id} className="text-xs space-y-1 p-2 bg-muted rounded">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{model.displayName}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {model.speed}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Brain className="h-3 w-3 mr-1" />
                                    {model.intelligence}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>Context: {model.contextWindow.toLocaleString()}</span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${model.costPerToken.toFixed(6)}/token
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {model.supportsStreaming && <Badge variant="secondary" className="text-xs">Streaming</Badge>}
                                {model.supportsImages && <Badge variant="secondary" className="text-xs">Images</Badge>}
                                {model.supportsFiles && <Badge variant="secondary" className="text-xs">Files</Badge>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Set as Global Provider */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const selectedModel = userSettings?.providers[provider.id]?.selectedModel || provider.models[0]?.id;
                          if (selectedModel) {
                            handleGlobalProviderChange(provider.id, selectedModel);
                          }
                        }}
                        disabled={!userSettings?.providers[provider.id]?.isActive}
                      >
                        Set as Global Provider
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Temperature</Label>
                      <Slider
                        value={[userSettings?.preferences.defaultTemperature || 0.7]}
                        onValueChange={([value]) => {
                          if (userSettings) {
                            setUserSettings({
                              ...userSettings,
                              preferences: {
                                ...userSettings.preferences,
                                defaultTemperature: value
                              }
                            });
                          }
                        }}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">
                        {userSettings?.preferences.defaultTemperature || 0.7}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Max Tokens</Label>
                      <Slider
                        value={[userSettings?.preferences.defaultMaxTokens || 2048]}
                        onValueChange={([value]) => {
                          if (userSettings) {
                            setUserSettings({
                              ...userSettings,
                              preferences: {
                                ...userSettings.preferences,
                                defaultMaxTokens: value
                              }
                            });
                          }
                        }}
                        max={8192}
                        min={256}
                        step={256}
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">
                        {userSettings?.preferences.defaultMaxTokens || 2048}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Multiple Responses</Label>
                        <p className="text-xs text-muted-foreground">
                          Display responses from multiple AI models simultaneously
                        </p>
                      </div>
                      <Switch
                        checked={userSettings?.preferences.showMultipleResponses || false}
                        onCheckedChange={(checked) => {
                          if (userSettings) {
                            setUserSettings({
                              ...userSettings,
                              preferences: {
                                ...userSettings.preferences,
                                showMultipleResponses: checked
                              }
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-save Chats</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically save chat sessions to Firebase
                        </p>
                      </div>
                      <Switch
                        checked={userSettings?.preferences.autoSaveChats || true}
                        onCheckedChange={(checked) => {
                          if (userSettings) {
                            setUserSettings({
                              ...userSettings,
                              preferences: {
                                ...userSettings.preferences,
                                autoSaveChats: checked
                              }
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable File Analysis</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow AI to analyze uploaded files and attachments
                        </p>
                      </div>
                      <Switch
                        checked={userSettings?.preferences.enableFileAnalysis || true}
                        onCheckedChange={(checked) => {
                          if (userSettings) {
                            setUserSettings({
                              ...userSettings,
                              preferences: {
                                ...userSettings.preferences,
                                enableFileAnalysis: checked
                              }
                            });
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Email Automation</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow AI to compose and manage email drafts
                        </p>
                      </div>
                      <Switch
                        checked={userSettings?.preferences.enableEmailAutomation || false}
                        onCheckedChange={(checked) => {
                          if (userSettings) {
                            setUserSettings({
                              ...userSettings,
                              preferences: {
                                ...userSettings.preferences,
                                enableEmailAutomation: checked
                              }
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pro" className="space-y-6">
              {/* Current Subscription Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Current Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{subscriptionStatus?.planName || 'Free Plan'}</h3>
                      <p className="text-muted-foreground text-sm">
                        {subscriptionStatus?.isPro 
                          ? 'You have access to all AI providers with managed API keys'
                          : 'Limited to Google Gemini with basic features'
                        }
                      </p>
                    </div>
                    <Badge 
                      variant={subscriptionStatus?.isPro ? 'default' : 'outline'}
                      className="text-sm"
                    >
                      {subscriptionStatus?.isPro ? 'Pro' : 'Free'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Plans */}
              {subscriptionStatus?.canUpgrade && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePlans.filter(plan => plan.id !== 'free').map((plan) => (
                      <Card key={plan.id} className={cn(
                        "relative",
                        plan.id === 'pro' && "border-2 border-blue-500 shadow-lg"
                      )}>
                        {plan.id === 'pro' && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                          </div>
                        )}
                        
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{plan.displayName}</span>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                ${plan.price.monthly}
                                <span className="text-sm font-normal text-muted-foreground">/month</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                or ${plan.price.yearly}/year (save 17%)
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500 shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* AI Providers included */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">AI Providers Included:</h4>
                            <div className="flex flex-wrap gap-2">
                              {plan.aiProviders.map((aiProvider) => (
                                <Badge key={aiProvider.providerId} variant="outline" className="text-xs">
                                  {aiProvider.providerId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Usage Limits */}
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>Monthly Tokens: {plan.limits.monthlyTokens === 0 ? 'Unlimited' : plan.limits.monthlyTokens.toLocaleString()}</div>
                            <div>Daily Requests: {plan.limits.dailyRequests === 0 ? 'Unlimited' : plan.limits.dailyRequests.toLocaleString()}</div>
                            <div>Max File Size: {plan.limits.maxFileSize}MB</div>
                          </div>
                        </CardContent>
                        
                        <CardContent className="pt-0">
                          <Button 
                            className="w-full" 
                            variant={plan.id === 'pro' ? 'default' : 'outline'}
                            onClick={() => {
                              // Handle upgrade
                              toast({
                                title: 'Upgrade Coming Soon',
                                description: 'Subscription upgrade will be available soon!'
                              });
                            }}
                          >
                            {plan.id === 'pro' ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Features Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Why Upgrade to Pro?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Multiple AI Providers
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Access OpenAI, Anthropic, DeepSeek, and more with our managed API keys
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Cost Effective
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        No need to manage multiple API subscriptions - we handle everything
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        Advanced Automation
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Email automation, MCP integrations, and workflow builders
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Priority Support
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Get priority support and early access to new features
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mcps" className="space-y-6">
              <MCPSettings onConnectionChange={() => {
                // Reload settings when MCP connections change
                loadSettings();
              }} />
            </TabsContent>

            <TabsContent value="automation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Automation Workflows
                  </CardTitle>
                  <CardDescription>
                    Create and manage automated workflows with visual editor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Workflow automation coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Zap, 
  Brain, 
  Clock, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Star,
  Sparkles,
  Activity,
  Settings,
  Key
} from 'lucide-react';
import { aiProviderManager } from '@/services/ai-providers/aiProviderManager';
import { AIProvider, AIModel } from '@/types/ai-providers';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProviderIcon, getProviderDisplayName, getProviderColor } from '@/components/ui/provider-icons';

interface EnhancedAISettingsProps {
  onProviderChange?: (providerId: string, modelId: string) => void;
}

export function EnhancedAISettings({ onProviderChange }: EnhancedAISettingsProps) {
  const { user } = useAuth();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
    loadSettings();
  }, [user]);

  const loadProviders = () => {
    const availableProviders = aiProviderManager.getAvailableProviders();
    setProviders(availableProviders);
  };

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const settings = await aiProviderManager.getUserSettings(user.uid);
      if (settings) {
        setSelectedProvider(settings.defaultProvider || 'google');
        setSelectedModel(settings.defaultModel || 'gemini-1.5-pro');
        
        // Load API keys (they would be encrypted in storage)
        const keys: Record<string, string> = {};
        for (const provider of providers) {
          if (provider.apiKey) {
            keys[provider.id] = '••••••••••••••••'; // Masked for display
          }
        }
        setApiKeys(keys);
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      const defaultModel = provider.models[0].id;
      setSelectedModel(defaultModel);
      onProviderChange?.(providerId, defaultModel);
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    onProviderChange?.(selectedProvider, modelId);
  };

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: apiKey }));
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    
    try {
      const apiKey = apiKeys[providerId];
      if (!apiKey || apiKey === '••••••••••••••••') {
        toast({
          title: 'API Key Required',
          description: 'Please enter a valid API key first',
          variant: 'destructive'
        });
        return;
      }

      // Test the connection
      const success = await aiProviderManager.testConnection(providerId, apiKey);
      
      if (success) {
        toast({
          title: 'Connection Successful',
          description: `Successfully connected to ${providerId}`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Please check your API key and try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setTestingProvider(null);
    }
  };



  const getSpeedBars = (speed: string) => {
    const levels = { fast: 3, medium: 2, slow: 1 };
    const level = levels[speed as keyof typeof levels] || 1;
    return Array.from({ length: 3 }, (_, i) => (
      <div
        key={i}
        className={cn(
          "h-1 w-4 rounded-full",
          i < level ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
        )}
      />
    ));
  };

  const getIntelligenceBars = (intelligence: string) => {
    const levels = { expert: 3, advanced: 2, basic: 1 };
    const level = levels[intelligence as keyof typeof levels] || 1;
    return Array.from({ length: 3 }, (_, i) => (
      <div
        key={i}
        className={cn(
          "h-1 w-4 rounded-full",
          i < level ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
        )}
      />
    ));
  };

  const formatContextWindow = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}k`;
    return tokens.toString();
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-white">AI Settings</h3>
        <p className="text-gray-400 text-sm">
          Choose a <span className="italic text-white">faster</span> model when speed matters and a<br />
          smarter one for more complex tasks.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="grid grid-cols-5 gap-4">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelect(provider.id)}
            className={cn(
              "flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200",
              selectedProvider === provider.id
                ? "border-white bg-gray-800"
                : "border-gray-600 bg-gray-900 hover:border-gray-500"
            )}
          >
            <ProviderIcon provider={provider.id} size="lg" className="mb-2" />
            <span className="text-sm font-medium text-white">{provider.displayName}</span>
          </button>
        ))}
      </div>

      {/* Model Selection */}
      {selectedProviderData && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {selectedProviderData.displayName} Models
            </CardTitle>
            <CardDescription className="text-gray-400">
              Select a model that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {selectedProviderData.models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                      selectedModel === model.id
                        ? "border-white bg-gray-800"
                        : "border-gray-600 bg-gray-900 hover:border-gray-500"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{model.displayName}</h4>
                        {model.displayName.includes('*') && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">context</div>
                        <div className="text-sm font-medium text-white">
                          {formatContextWindow(model.contextWindow)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div>
                        <div className="text-gray-400 mb-1">model</div>
                        <div className="text-white font-medium">{model.displayName}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">speed</div>
                        <div className="flex gap-1">
                          {getSpeedBars(model.speed)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">intelligence</div>
                        <div className="flex gap-1">
                          {getIntelligenceBars(model.intelligence)}
                        </div>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="flex gap-2 mt-3">
                      {model.supportsImages && (
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Vision
                        </Badge>
                      )}
                      {model.supportsFiles && (
                        <Badge variant="secondary" className="text-xs">
                          <Settings className="h-3 w-3 mr-1" />
                          Files
                        </Badge>
                      )}
                      {model.supportsStreaming && (
                        <Badge variant="secondary" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          Streaming
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* API Key Configuration */}
      {selectedProviderData && selectedProvider !== 'google' && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure your API key for {selectedProviderData.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-white">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKeys[selectedProvider] ? 'text' : 'password'}
                    placeholder="Enter your API key..."
                    value={apiKeys[selectedProvider] || ''}
                    onChange={(e) => handleApiKeyChange(selectedProvider, e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowApiKeys(prev => ({
                      ...prev,
                      [selectedProvider]: !prev[selectedProvider]
                    }))}
                  >
                    {showApiKeys[selectedProvider] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => handleTestConnection(selectedProvider)}
                  disabled={testingProvider === selectedProvider}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800"
                >
                  {testingProvider === selectedProvider ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Get your API key from {selectedProviderData.displayName}'s developer portal
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
              {selectedProviderData.isConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-400">Not Connected</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Information */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Usage & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Tokens Used Today</div>
              <div className="text-white font-medium">12,450 / 50,000</div>
              <Progress value={24.9} className="mt-1 h-1" />
            </div>
            <div>
              <div className="text-gray-400 mb-1">Requests Today</div>
              <div className="text-white font-medium">89 / 1,000</div>
              <Progress value={8.9} className="mt-1 h-1" />
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="text-xs text-gray-400">
            <p>• Free tier includes 50K tokens and 1K requests per day</p>
            <p>• Upgrade to Pro for unlimited usage and premium models</p>
            <p>• Usage resets daily at midnight UTC</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
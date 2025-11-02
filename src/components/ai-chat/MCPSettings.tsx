'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Key, 
  Shield, 
  Zap,
  Calendar,
  Mail,
  FileText,
  MessageSquare,
  Code,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { mcpManager, MCPServiceConfig } from '@/services/mcp/mcpManager';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProviderIcon, getProviderDisplayName } from '@/components/ui/provider-icons';

interface MCPSettingsProps {
  onConnectionChange?: () => void;
}

export function MCPSettings({ onConnectionChange }: MCPSettingsProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<MCPServiceConfig[]>([]);
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [connectingService, setConnectingService] = useState<string | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);

  useEffect(() => {
    loadMCPServices();
    loadConnections();
  }, [user]);

  const loadMCPServices = () => {
    const availableServices = mcpManager.getAvailableServices();
    setServices(availableServices);
  };

  const loadConnections = async () => {
    if (!user) return;

    const connectionStatus: Record<string, boolean> = {};
    
    for (const service of services) {
      const isConnected = await mcpManager.isServiceConnected(service.id, user.uid);
      connectionStatus[service.id] = isConnected;
    }
    
    setConnections(connectionStatus);
  };

  const handleConnect = async (serviceId: string) => {
    if (!user) return;

    setConnectingService(serviceId);
    
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      let result;
      
      if (service.authType === 'api_key') {
        const apiKey = apiKeys[serviceId];
        if (!apiKey) {
          toast({
            title: 'API Key Required',
            description: 'Please enter your API key first',
            variant: 'destructive'
          });
          return;
        }
        result = await mcpManager.authenticateService(serviceId, user.uid, apiKey);
      } else {
        result = await mcpManager.authenticateService(serviceId, user.uid);
      }

      if (result.success) {
        if (result.authUrl) {
          // For OAuth, open the authorization URL
          window.open(result.authUrl, '_blank', 'width=600,height=700');
          toast({
            title: 'Authorization Required',
            description: 'Please complete the authorization in the new window'
          });
        } else {
          // For API key or service account, connection is immediate
          setConnections(prev => ({ ...prev, [serviceId]: true }));
          toast({
            title: 'Connected Successfully',
            description: `Successfully connected to ${service.displayName}`
          });
          onConnectionChange?.();
        }
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to service',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setConnectingService(null);
    }
  };

  const handleDisconnect = async (serviceId: string) => {
    if (!user) return;

    try {
      await mcpManager.disconnectService(serviceId, user.uid);
      setConnections(prev => ({ ...prev, [serviceId]: false }));
      
      const service = services.find(s => s.id === serviceId);
      toast({
        title: 'Disconnected',
        description: `Disconnected from ${service?.displayName}`
      });
      onConnectionChange?.();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Disconnect Error',
        description: 'Failed to disconnect from service',
        variant: 'destructive'
      });
    }
  };

  const handleTestConnection = async (serviceId: string) => {
    if (!user) return;

    setTestingService(serviceId);
    
    try {
      // Test by executing a simple tool call
      const service = services.find(s => s.id === serviceId);
      if (!service || service.tools.length === 0) return;

      // For testing, we'll just check if the connection exists and is valid
      const isConnected = await mcpManager.isServiceConnected(serviceId, user.uid);
      
      if (isConnected) {
        toast({
          title: 'Connection Test Successful',
          description: `${service.displayName} is connected and ready to use`
        });
      } else {
        toast({
          title: 'Connection Test Failed',
          description: `${service.displayName} is not properly connected`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Connection test failed',
        variant: 'destructive'
      });
    } finally {
      setTestingService(null);
    }
  };



  const getAuthTypeDisplay = (authType: string) => {
    switch (authType) {
      case 'oauth2':
        return { label: 'OAuth 2.0', color: 'bg-blue-500' };
      case 'api_key':
        return { label: 'API Key', color: 'bg-green-500' };
      case 'service_account':
        return { label: 'Service Account', color: 'bg-purple-500' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Model Context Protocol (MCP) Servers</h3>
        <p className="text-muted-foreground text-sm">
          Connect external services to enhance AI capabilities with real-time data and actions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const isConnected = connections[service.id] || false;
          const authType = getAuthTypeDisplay(service.authType);
          const isConnecting = connectingService === service.id;
          const isTesting = testingService === service.id;

          return (
            <Card key={service.id} className={cn(
              "relative transition-all duration-200",
              isConnected && "ring-2 ring-green-500/20 bg-green-50/50 dark:bg-green-950/20"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProviderIcon provider={service.id} size="md" />
                    <div>
                      <CardTitle className="text-base">{service.displayName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", `${authType.color} text-white`)}
                        >
                          {authType.label}
                        </Badge>
                        {isConnected ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="h-3 w-3" />
                            Not Connected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>

                {/* API Key Input for API Key auth type */}
                {service.authType === 'api_key' && (
                  <div className="space-y-2">
                    <Label htmlFor={`${service.id}-api-key`}>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`${service.id}-api-key`}
                          type={showApiKeys[service.id] ? 'text' : 'password'}
                          placeholder="Enter your API key..."
                          value={apiKeys[service.id] || ''}
                          onChange={(e) => setApiKeys(prev => ({
                            ...prev,
                            [service.id]: e.target.value
                          }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKeys(prev => ({
                            ...prev,
                            [service.id]: !prev[service.id]
                          }))}
                        >
                          {showApiKeys[service.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get your API key from {service.displayName}'s developer settings
                    </p>
                  </div>
                )}

                {/* OAuth2 Info */}
                {service.authType === 'oauth2' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Secure OAuth Authentication
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Click connect to authorize Calendar.ai to access your {service.displayName} account securely
                    </p>
                  </div>
                )}

                {/* Capabilities */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {service.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs">
                        {capability.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Available Tools */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Available Tools ({service.tools.length})</h4>
                  <ScrollArea className="h-20">
                    <div className="space-y-1">
                      {service.tools.map((tool) => (
                        <div key={tool.id} className="text-xs p-2 bg-muted rounded">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-muted-foreground">{tool.description}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(service.id)}
                        disabled={isTesting}
                        className="flex-1"
                      >
                        {isTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(service.id)}
                        className="flex-1"
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnect(service.id)}
                      disabled={isConnecting || (service.authType === 'api_key' && !apiKeys[service.id])}
                      className="w-full"
                      size="sm"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : service.authType === 'oauth2' ? (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      ) : (
                        <Key className="h-4 w-4 mr-2" />
                      )}
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Services:</span>
              <div className="font-medium">{services.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Connected:</span>
              <div className="font-medium text-green-600">
                {Object.values(connections).filter(Boolean).length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">OAuth Services:</span>
              <div className="font-medium">
                {services.filter(s => s.authType === 'oauth2').length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">API Key Services:</span>
              <div className="font-medium">
                {services.filter(s => s.authType === 'api_key').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-900 dark:text-amber-100">Security & Privacy</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                All connections are encrypted and stored securely. OAuth tokens are automatically refreshed. 
                API keys are encrypted before storage. You can disconnect any service at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
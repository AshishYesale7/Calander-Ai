'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Settings, 
  Bot, 
  User, 
  Clock, 
  Zap, 
  Brain, 
  Star,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Sparkles,
  Activity,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  Code,
  Workflow,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  Globe,
  Database,
  Shield,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderIcon, getProviderDisplayName } from '@/components/ui/provider-icons';
import { AIProvider, AIModel, ChatMessage, FileAttachment } from '@/types/ai-providers';
import { aiProviderManager } from '@/services/ai-providers/aiProviderManager';
import { globalAIService } from '@/services/globalAIService';
import { mcpManager } from '@/services/mcp/mcpManager';
import { EnhancedFileAttachment } from './EnhancedFileAttachment';
import { EnhancedAISettings } from './EnhancedAISettings';
import { GlobalAIActionsCard } from './GlobalAIActionsCard';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AiAssistantChatProps {
  chatId?: string;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  className?: string;
  contextData?: {
    userProfile?: any;
    calendarEvents?: any[];
    emails?: any[];
    contacts?: any[];
    files?: any[];
    currentPage?: string;
    selectedText?: string;
  };
}

interface ActiveProvider {
  id: string;
  provider: AIProvider;
  model: AIModel;
  isActive: boolean;
}

interface MCPService {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  tools: string[];
}

export function AiAssistantChat({
  chatId = 'default',
  initialMessages = [],
  onMessagesChange,
  className,
  contextData
}: AiAssistantChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [showMCPServices, setShowMCPServices] = useState(false);
  const [activeProviders, setActiveProviders] = useState<ActiveProvider[]>([]);
  const [mcpServices, setMCPServices] = useState<MCPService[]>([]);
  const [currentProvider, setCurrentProvider] = useState<{ provider: AIProvider | null; model: AIModel | null }>({ provider: null, model: null });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeChat();
    loadProviders();
    loadMCPServices();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const initializeChat = async () => {
    if (user) {
      await globalAIService.initialize(user.uid);
      const providerInfo = globalAIService.getCurrentProviderInfo();
      setCurrentProvider(providerInfo);
    }
  };

  const loadProviders = () => {
    const providers = aiProviderManager.getAvailableProviders();
    const activeList: ActiveProvider[] = providers.map(provider => ({
      id: provider.id,
      provider,
      model: provider.models[0], // Default to first model
      isActive: provider.id === currentProvider.provider?.id
    }));
    setActiveProviders(activeList);
  };

  const loadMCPServices = async () => {
    const services: MCPService[] = [
      {
        id: 'gmail',
        name: 'Gmail',
        icon: 'gmail',
        connected: await mcpManager.isServiceConnected('gmail'),
        tools: ['send_email', 'read_emails', 'search_emails', 'draft_email']
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        icon: 'google-calendar',
        connected: await mcpManager.isServiceConnected('google-calendar'),
        tools: ['create_event', 'list_events', 'update_event', 'delete_event']
      },
      {
        id: 'notion',
        name: 'Notion',
        icon: 'notion',
        connected: await mcpManager.isServiceConnected('notion'),
        tools: ['create_page', 'search_pages', 'update_page', 'query_database']
      },
      {
        id: 'slack',
        name: 'Slack',
        icon: 'slack',
        connected: await mcpManager.isServiceConnected('slack'),
        tools: ['send_message', 'list_channels', 'create_channel', 'invite_user']
      },
      {
        id: 'github',
        name: 'GitHub',
        icon: 'github',
        connected: await mcpManager.isServiceConnected('github'),
        tools: ['create_issue', 'list_repos', 'create_pr', 'search_code']
      },
      {
        id: 'linear',
        name: 'Linear',
        icon: 'linear',
        connected: await mcpManager.isServiceConnected('linear'),
        tools: ['create_issue', 'list_issues', 'update_issue', 'assign_issue']
      }
    ];
    setMCPServices(services);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (!currentProvider.provider || !currentProvider.model) {
      toast({
        title: 'No AI Provider Selected',
        description: 'Please select an AI provider in settings',
        variant: 'destructive'
      });
      return;
    }

    // Create user message with context
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        contextData: contextData ? {
          currentPage: contextData.currentPage,
          selectedText: contextData.selectedText,
          hasCalendarAccess: contextData.calendarEvents ? contextData.calendarEvents.length > 0 : false,
          hasEmailAccess: contextData.emails ? contextData.emails.length > 0 : false,
          connectedServices: mcpServices.filter(s => s.connected).map(s => s.id)
        } : undefined
      }
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setAttachments([]);
    setIsGenerating(true);

    try {
      // Prepare enhanced context for AI
      let enhancedPrompt = inputMessage;
      
      // Add context information
      if (contextData) {
        let contextInfo = '\n\n[Context Information]';
        
        if (contextData.currentPage) {
          contextInfo += `\nCurrent page: ${contextData.currentPage}`;
        }
        
        if (contextData.selectedText) {
          contextInfo += `\nSelected text: "${contextData.selectedText}"`;
        }
        
        if (contextData.userProfile) {
          contextInfo += `\nUser: ${contextData.userProfile.name || contextData.userProfile.email}`;
        }
        
        if (contextData.calendarEvents && contextData.calendarEvents.length > 0) {
          contextInfo += `\nUpcoming events: ${contextData.calendarEvents.slice(0, 3).map(e => e.title).join(', ')}`;
        }
        
        if (contextData.emails && contextData.emails.length > 0) {
          contextInfo += `\nRecent emails: ${contextData.emails.slice(0, 3).map(e => e.subject).join(', ')}`;
        }

        // Add connected services info
        const connectedServices = mcpServices.filter(s => s.connected);
        if (connectedServices.length > 0) {
          contextInfo += `\nConnected services: ${connectedServices.map(s => s.name).join(', ')}`;
          contextInfo += `\nAvailable actions: I can help you with ${connectedServices.map(s => s.tools.join(', ')).join(', ')}`;
        }
        
        enhancedPrompt += contextInfo;
      }

      // Generate AI response
      const response = await aiProviderManager.generateResponse(
        enhancedPrompt,
        currentProvider.provider.id,
        currentProvider.model.id,
        updatedMessages,
        {
          temperature: 0.7,
          maxTokens: 2000,
          attachments,
          systemPrompt: `You are an intelligent AI assistant with access to the user's calendar, emails, and various connected services. 
          You can help with:
          - Scheduling and calendar management
          - Email composition and management
          - File organization and analysis
          - Task and project management
          - General productivity assistance
          
          When the user asks for actions that require external services (like sending emails, creating calendar events, etc.), 
          provide clear instructions and offer to help execute them if the relevant service is connected.
          
          Connected services: ${mcpServices.filter(s => s.connected).map(s => s.name).join(', ')}`
        }
      );

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        metadata: {
          providerId: currentProvider.provider.id,
          modelId: currentProvider.model.id,
          responseTime: response.usage?.responseTime || 0,
          tokenCount: response.usage?.totalTokens || 0,
          cost: response.usage?.cost || 0,
          status: 'success'
        }
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Check if response suggests actions that can be automated
      await checkForAutomationOpportunities(response.content, userMessage.content);

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        metadata: {
          providerId: currentProvider.provider?.id,
          modelId: currentProvider.model?.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      setMessages([...updatedMessages, errorMessage]);
      
      toast({
        title: 'Error',
        description: 'Failed to generate AI response',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const checkForAutomationOpportunities = async (aiResponse: string, userInput: string) => {
    // Check if AI response suggests actions that can be automated
    const emailKeywords = ['send email', 'compose email', 'email to', 'write email'];
    const calendarKeywords = ['schedule', 'create event', 'book meeting', 'add to calendar'];
    
    if (emailKeywords.some(keyword => aiResponse.toLowerCase().includes(keyword)) && 
        mcpServices.find(s => s.id === 'gmail')?.connected) {
      // Offer to compose email automatically
      toast({
        title: 'Email Automation Available',
        description: 'I can help compose and send this email automatically. Would you like me to do that?',
        action: (
          <Button size="sm" onClick={() => handleEmailAutomation(userInput, aiResponse)}>
            Compose Email
          </Button>
        )
      });
    }
    
    if (calendarKeywords.some(keyword => aiResponse.toLowerCase().includes(keyword)) && 
        mcpServices.find(s => s.id === 'google-calendar')?.connected) {
      // Offer to create calendar event automatically
      toast({
        title: 'Calendar Automation Available',
        description: 'I can create this calendar event automatically. Would you like me to do that?',
        action: (
          <Button size="sm" onClick={() => handleCalendarAutomation(userInput, aiResponse)}>
            Create Event
          </Button>
        )
      });
    }
  };

  const handleEmailAutomation = async (userInput: string, aiResponse: string) => {
    try {
      const emailDetails = await globalAIService.composeEmail(userInput, {
        tone: 'professional',
        purpose: 'request'
      });
      
      // Here you would integrate with Gmail MCP to actually send the email
      toast({
        title: 'Email Composed',
        description: 'Email draft has been prepared. Review and send when ready.',
      });
    } catch (error) {
      toast({
        title: 'Email Automation Failed',
        description: 'Could not compose email automatically',
        variant: 'destructive'
      });
    }
  };

  const handleCalendarAutomation = async (userInput: string, aiResponse: string) => {
    try {
      const eventDetails = await globalAIService.parseEventDetails(userInput);
      
      // Here you would integrate with Google Calendar MCP to create the event
      toast({
        title: 'Event Details Parsed',
        description: 'Calendar event details extracted. Ready to create event.',
      });
    } catch (error) {
      toast({
        title: 'Calendar Automation Failed',
        description: 'Could not parse event details automatically',
        variant: 'destructive'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProviderChange = (providerId: string, modelId: string) => {
    const provider = activeProviders.find(p => p.id === providerId)?.provider;
    const model = provider?.models.find(m => m.id === modelId);
    
    if (provider && model) {
      setCurrentProvider({ provider, model });
      globalAIService.updateConfig({ providerId, modelId });
      
      // Update active status
      setActiveProviders(prev => prev.map(p => ({
        ...p,
        isActive: p.id === providerId
      })));
    }
  };

  const handleMCPServiceToggle = async (serviceId: string) => {
    try {
      const service = mcpServices.find(s => s.id === serviceId);
      if (!service) return;

      if (service.connected) {
        await mcpManager.disconnectService(serviceId);
      } else {
        await mcpManager.connectService(serviceId, {});
      }
      
      // Reload services
      await loadMCPServices();
      
      toast({
        title: service.connected ? 'Service Disconnected' : 'Service Connected',
        description: `${service.name} has been ${service.connected ? 'disconnected' : 'connected'}`,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: `Failed to ${mcpServices.find(s => s.id === serviceId)?.connected ? 'disconnect' : 'connect'} service`,
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: FileAttachment[] = Array.from(files).map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        uploadProgress: 100 // Simulate immediate upload for demo
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard'
    });
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                {currentProvider.provider ? (
                  <span className="flex items-center gap-1">
                    <ProviderIcon provider={currentProvider.provider.id} size="xs" />
                    {currentProvider.provider.displayName} • {currentProvider.model?.displayName}
                  </span>
                ) : (
                  'No provider selected'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connected Services Indicator */}
          <div className="flex items-center gap-1">
            {mcpServices.filter(s => s.connected).map(service => (
              <Badge key={service.id} variant="secondary" className="text-xs">
                <ProviderIcon provider={service.icon} size="xs" className="mr-1" />
                {service.name}
              </Badge>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-gray-50 dark:bg-gray-800">
          <EnhancedAISettings onProviderChange={handleProviderChange} />
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome to AI Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                I can help you with emails, calendar events, file analysis, and more!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline">📧 Email Management</Badge>
                <Badge variant="outline">📅 Calendar Events</Badge>
                <Badge variant="outline">📁 File Analysis</Badge>
                <Badge variant="outline">🔗 Service Integration</Badge>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="p-1">
                    {message.metadata?.providerId ? (
                      <ProviderIcon provider={message.metadata.providerId} size="sm" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.role === 'user'
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                )}
              >
                {message.role === 'assistant' && message.metadata && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">
                      {getProviderDisplayName(message.metadata.providerId || '')}
                    </span>
                    
                    {message.metadata.responseTime && (
                      <>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatResponseTime(message.metadata.responseTime)}</span>
                      </>
                    )}
                    
                    {message.metadata.tokenCount && (
                      <>
                        <span>•</span>
                        <span>{message.metadata.tokenCount} tokens</span>
                      </>
                    )}
                    
                    {message.metadata.cost && (
                      <>
                        <span>•</span>
                        <span>{formatCost(message.metadata.cost)}</span>
                      </>
                    )}
                    
                    {message.metadata.status === 'error' && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                )}
                
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 text-xs bg-black/10 dark:bg-white/10 rounded p-2"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>{attachment.name}</span>
                        <span className="text-gray-500">({(attachment.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.content)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <Activity className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentProvider.provider?.displayName} is thinking...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* File Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm font-medium">Attachments ({attachments.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm"
              >
                <FileText className="h-4 w-4" />
                <span>{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced File Panel */}
      {showFilePanel && (
        <div className="border-t bg-gray-50 dark:bg-gray-800">
          <EnhancedFileAttachment
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            className="max-h-96"
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... I can help with emails, calendar, files, and more!"
              disabled={isGenerating}
              className="min-h-[40px] resize-none"
            />
          </div>
          
          <Button
            onClick={() => setShowFilePanel(!showFilePanel)}
            variant="outline"
            size="sm"
            disabled={isGenerating}
            className="flex items-center gap-1"
          >
            <Paperclip className="h-4 w-4" />
            Add Files
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || isGenerating}
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Footer with Providers and MCP Services */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          {/* LLM Providers */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-1 text-xs"
            >
              <Brain className="h-3 w-3" />
              Providers ({activeProviders.filter(p => p.isActive).length})
              {showProviders ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            
            {showProviders && (
              <div className="flex items-center gap-1">
                {activeProviders.slice(0, 6).map((provider) => (
                  <Button
                    key={provider.id}
                    variant={provider.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleProviderChange(provider.id, provider.model.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <ProviderIcon provider={provider.id} size="xs" className="mr-1" />
                    {provider.provider.displayName}
                  </Button>
                ))}
                {activeProviders.length > 6 && (
                  <span className="text-xs text-muted-foreground">+{activeProviders.length - 6} more</span>
                )}
              </div>
            )}
          </div>

          {/* MCP Services */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMCPServices(!showMCPServices)}
              className="flex items-center gap-1 text-xs"
            >
              <Globe className="h-3 w-3" />
              Services ({mcpServices.filter(s => s.connected).length})
              {showMCPServices ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            
            {showMCPServices && (
              <div className="flex items-center gap-1">
                {mcpServices.map((service) => (
                  <Button
                    key={service.id}
                    variant={service.connected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMCPServiceToggle(service.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <ProviderIcon provider={service.icon} size="xs" className="mr-1" />
                    {service.name}
                    {service.connected && <CheckCircle className="h-2 w-2 ml-1" />}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />
    </div>
  );
}
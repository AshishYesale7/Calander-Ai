'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Plus, 
  X, 
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
  Settings,
  Sparkles,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderIcon, getProviderDisplayName } from '@/components/ui/provider-icons';
import { AIProvider, AIModel, ChatMessage } from '@/types/ai-providers';
import { aiProviderManager } from '@/services/ai-providers/aiProviderManager';
import { EnhancedFileAttachment } from './EnhancedFileAttachment';
import { FileAttachment } from '@/types/ai-providers';

interface ActiveModel {
  id: string;
  providerId: string;
  modelId: string;
  provider: AIProvider;
  model: AIModel;
  isResponding: boolean;
  responseTime?: number;
  tokenCount?: number;
  cost?: number;
}

interface ModelResponse {
  modelId: string;
  content: string;
  timestamp: number;
  responseTime: number;
  tokenCount: number;
  cost: number;
  status: 'success' | 'error' | 'streaming';
  error?: string;
}

interface MultiModelChatInterfaceProps {
  chatId: string;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  className?: string;
}

export function MultiModelChatInterface({
  chatId,
  messages,
  onMessagesChange,
  className
}: MultiModelChatInterfaceProps) {
  const [activeModels, setActiveModels] = useState<ActiveModel[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const availableProviders = aiProviderManager.getAvailableProviders();
    setProviders(availableProviders);
    
    // Initialize with default model if none selected
    if (activeModels.length === 0 && availableProviders.length > 0) {
      const defaultProvider = availableProviders.find(p => p.id === 'google') || availableProviders[0];
      const defaultModel = defaultProvider.models[0];
      
      addModel(defaultProvider.id, defaultModel.id);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addModel = (providerId: string, modelId: string) => {
    const provider = providers.find(p => p.id === providerId);
    const model = provider?.models.find(m => m.id === modelId);
    
    if (!provider || !model) return;

    const activeModelId = `${providerId}-${modelId}`;
    
    // Check if model is already active
    if (activeModels.some(am => am.id === activeModelId)) return;

    const newActiveModel: ActiveModel = {
      id: activeModelId,
      providerId,
      modelId,
      provider,
      model,
      isResponding: false
    };

    setActiveModels(prev => [...prev, newActiveModel]);
    setShowModelSelector(false);
  };

  const removeModel = (modelId: string) => {
    setActiveModels(prev => prev.filter(am => am.id !== modelId));
  };



  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (activeModels.length === 0) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    // Add user message
    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);

    // Clear input
    setInputMessage('');
    setAttachments([]);
    setIsGenerating(true);

    // Set all models as responding
    setActiveModels(prev => prev.map(am => ({ ...am, isResponding: true })));

    // Generate responses from all active models
    const responses: ModelResponse[] = [];
    
    await Promise.allSettled(
      activeModels.map(async (activeModel) => {
        const startTime = Date.now();
        
        try {
          const response = await aiProviderManager.generateResponse(
            inputMessage,
            activeModel.providerId,
            activeModel.modelId,
            updatedMessages,
            {
              temperature: 0.7,
              maxTokens: 2000,
              attachments
            }
          );

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          responses.push({
            modelId: activeModel.id,
            content: response.content,
            timestamp: endTime,
            responseTime,
            tokenCount: response.usage?.totalTokens || 0,
            cost: response.usage?.cost || 0,
            status: 'success'
          });

          // Update model stats
          setActiveModels(prev => prev.map(am => 
            am.id === activeModel.id 
              ? { 
                  ...am, 
                  isResponding: false, 
                  responseTime,
                  tokenCount: response.usage?.totalTokens || 0,
                  cost: response.usage?.cost || 0
                }
              : am
          ));

        } catch (error) {
          console.error(`Error generating response for ${activeModel.id}:`, error);
          
          responses.push({
            modelId: activeModel.id,
            content: '',
            timestamp: Date.now(),
            responseTime: Date.now() - startTime,
            tokenCount: 0,
            cost: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          setActiveModels(prev => prev.map(am => 
            am.id === activeModel.id 
              ? { ...am, isResponding: false }
              : am
          ));
        }
      })
    );

    // Create assistant messages for each response
    const assistantMessages: ChatMessage[] = responses.map(response => ({
      id: `msg-${response.timestamp}-${response.modelId}`,
      role: 'assistant',
      content: response.status === 'success' ? response.content : `Error: ${response.error}`,
      timestamp: response.timestamp,
      metadata: {
        providerId: activeModels.find(am => am.id === response.modelId)?.providerId,
        modelId: activeModels.find(am => am.id === response.modelId)?.modelId,
        responseTime: response.responseTime,
        tokenCount: response.tokenCount,
        cost: response.cost,
        status: response.status
      }
    }));

    // Add all assistant messages
    onMessagesChange([...updatedMessages, ...assistantMessages]);
    setIsGenerating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const selectResponse = (messageId: string) => {
    // Mark this response as selected and hide others from the same user message
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, metadata: { ...msg.metadata, selected: true } };
      }
      // If this is an assistant message from the same timestamp group, mark as not selected
      if (msg.role === 'assistant' && msg.metadata?.selected !== true) {
        return { ...msg, metadata: { ...msg.metadata, selected: false } };
      }
      return msg;
    });
    
    onMessagesChange(updatedMessages);
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
    <div className={cn("flex flex-col h-full", className)}>
      {/* Active Models Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Models ({activeModels.length}):
          </span>
          
          <div className="flex items-center gap-2 flex-wrap">
            {activeModels.map((activeModel) => (
              <div
                key={activeModel.id}
                className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 border rounded-full"
              >
                <ProviderIcon provider={activeModel.providerId} size="sm" />
                <span className="text-sm font-medium">{activeModel.model.displayName}</span>
                
                {activeModel.isResponding && (
                  <Activity className="h-3 w-3 animate-spin text-blue-500" />
                )}
                
                {activeModel.responseTime && (
                  <Badge variant="secondary" className="text-xs">
                    {formatResponseTime(activeModel.responseTime)}
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeModel(activeModel.id)}
                  className="h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Model
        </Button>
      </div>

      {/* Model Selector */}
      {showModelSelector && (
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
              >
                <option value="">Select Provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                disabled={!selectedProvider}
              >
                <option value="">Select Model</option>
                {selectedProvider && providers
                  .find(p => p.id === selectedProvider)
                  ?.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.displayName}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={() => {
                if (selectedProvider && selectedModel) {
                  addModel(selectedProvider, selectedModel);
                  setSelectedProvider('');
                  setSelectedModel('');
                }
              }}
              disabled={!selectedProvider || !selectedModel}
              size="sm"
            >
              Add Model
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModelSelector(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
                    <ProviderIcon provider={message.metadata?.providerId || ''} size="sm" />
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
                      {providers.find(p => p.id === message.metadata?.providerId)?.displayName}
                    </span>
                    <span>•</span>
                    <span>
                      {providers
                        .find(p => p.id === message.metadata?.providerId)
                        ?.models.find(m => m.id === message.metadata?.modelId)
                        ?.displayName}
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
                        <span>📎</span>
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyResponse(message.content)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectResponse(message.id)}
                      className="h-6 w-6 p-0"
                    >
                      <CheckCircle className="h-3 w-3" />
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
                  Generating responses from {activeModels.length} model{activeModels.length !== 1 ? 's' : ''}...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* File Attachments */}
      {attachments.length > 0 && (
        <div className="p-4 border-t">
          <EnhancedFileAttachment
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            className="max-h-32"
          />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${activeModels.length} model${activeModels.length !== 1 ? 's' : ''}...`}
              disabled={isGenerating || activeModels.length === 0}
              className="min-h-[40px] resize-none"
            />
          </div>
          
          <Button
            onClick={() => {
              // Toggle file attachment panel
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.multiple = true;
              fileInput.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) {
                  // Handle file selection
                  console.log('Files selected:', files);
                }
              };
              fileInput.click();
            }}
            variant="outline"
            size="sm"
            disabled={isGenerating}
          >
            📎
          </Button>
          
          <Button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || isGenerating || activeModels.length === 0}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {activeModels.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Add at least one AI model to start chatting
          </p>
        )}
      </div>
    </div>
  );
}
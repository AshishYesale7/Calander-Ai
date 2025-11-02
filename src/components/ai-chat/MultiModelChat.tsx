'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Clock, 
  DollarSign, 
  Zap, 
  Brain, 
  Check, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { AIResponse } from '@/types/ai-providers';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface MultiModelChatProps {
  responses: AIResponse[];
  selectedResponseId?: string;
  onSelectResponse: (responseId: string) => void;
}

export function MultiModelChat({ 
  responses, 
  selectedResponseId, 
  onSelectResponse 
}: MultiModelChatProps) {
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState<string | null>(null);

  const copyToClipboard = async (text: string, responseId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedResponse(responseId);
      setTimeout(() => setCopiedResponse(null), 2000);
      toast({
        title: 'Copied to clipboard',
        description: 'Response copied successfully'
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy response to clipboard',
        variant: 'destructive'
      });
    }
  };

  const getProviderLogo = (providerId: string) => {
    const logos: Record<string, string> = {
      'openai': '/logos/openai-logo.svg',
      'anthropic': '/logos/anthropic-logo.svg',
      'deepseek': '/logos/deepseek-logo.svg',
      'google': '/logos/google-logo.svg',
      'mistral': '/logos/mistral-logo.svg',
      'perplexity': '/logos/perplexity-logo.svg'
    };
    return logos[providerId] || '/logos/default-ai-logo.svg';
  };

  const getProviderName = (providerId: string) => {
    const names: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'deepseek': 'DeepSeek',
      'google': 'Google',
      'mistral': 'Mistral',
      'perplexity': 'Perplexity'
    };
    return names[providerId] || providerId;
  };

  const getSpeedColor = (latency: number) => {
    if (latency < 2000) return 'text-green-600';
    if (latency < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCostColor = (cost: number) => {
    if (cost < 0.01) return 'text-green-600';
    if (cost < 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Sort responses by quality metrics (you can customize this logic)
  const sortedResponses = [...responses].sort((a, b) => {
    // Prioritize selected response
    if (a.id === selectedResponseId) return -1;
    if (b.id === selectedResponseId) return 1;
    
    // Then by error status
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    
    // Then by response length (longer might be better)
    return b.content.length - a.content.length;
  });

  if (responses.length <= 1) {
    return null; // Don't show multi-model interface for single response
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bot className="h-4 w-4" />
        <span>Multiple AI responses available</span>
        <Badge variant="outline" className="text-xs">
          {responses.length} models
        </Badge>
      </div>

      <Tabs value={selectedResponseId || responses[0]?.id} onValueChange={onSelectResponse}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {sortedResponses.slice(0, 4).map((response) => (
            <TabsTrigger
              key={response.id}
              value={response.id}
              className={cn(
                "flex items-center gap-2 text-xs p-2",
                response.error && "opacity-50"
              )}
            >
              <img
                src={getProviderLogo(response.providerId)}
                alt={getProviderName(response.providerId)}
                className="w-4 h-4 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logos/default-ai-logo.svg';
                }}
              />
              <span className="truncate">{getProviderName(response.providerId)}</span>
              {response.id === selectedResponseId && (
                <Check className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedResponses.map((response) => (
          <TabsContent key={response.id} value={response.id} className="mt-3">
            <Card className={cn(
              "transition-all duration-200",
              response.id === selectedResponseId && "ring-2 ring-primary/20 bg-primary/5"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProviderLogo(response.providerId)}
                      alt={getProviderName(response.providerId)}
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logos/default-ai-logo.svg';
                      }}
                    />
                    <div>
                      <CardTitle className="text-base">
                        {getProviderName(response.providerId)}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className={getSpeedColor(response.latency)}>
                            {(response.latency / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className={getCostColor(response.cost)}>
                            ${response.cost.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>{response.tokens.total} tokens</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(response.content, response.id)}
                    >
                      {copiedResponse === response.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    
                    {response.id !== selectedResponseId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onSelectResponse(response.id)}
                      >
                        Use This
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {response.error ? (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      Error: {response.error}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-sm">
                        {expandedResponse === response.id || response.content.length <= 500
                          ? response.content
                          : `${response.content.substring(0, 500)}...`
                        }
                      </div>
                    </div>

                    {response.content.length > 500 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => 
                          setExpandedResponse(
                            expandedResponse === response.id ? null : response.id
                          )
                        }
                      >
                        {expandedResponse === response.id ? 'Show Less' : 'Show More'}
                      </Button>
                    )}

                    {/* Response Quality Indicators */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Input: {response.tokens.input} tokens</span>
                        <span>Output: {response.tokens.output} tokens</span>
                        <span>Model: {response.modelId}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Handle thumbs up
                            toast({
                              title: 'Feedback Recorded',
                              description: 'Thank you for your feedback!'
                            });
                          }}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Handle thumbs down
                            toast({
                              title: 'Feedback Recorded',
                              description: 'Thank you for your feedback!'
                            });
                          }}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Comparison Summary */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Fastest:</span>
              <div className="font-medium">
                {sortedResponses.reduce((fastest, current) => 
                  current.latency < fastest.latency ? current : fastest
                ).providerId}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Cheapest:</span>
              <div className="font-medium">
                {sortedResponses.reduce((cheapest, current) => 
                  current.cost < cheapest.cost ? current : cheapest
                ).providerId}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Longest:</span>
              <div className="font-medium">
                {sortedResponses.reduce((longest, current) => 
                  current.content.length > longest.content.length ? current : longest
                ).providerId}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Cost:</span>
              <div className="font-medium">
                ${sortedResponses.reduce((sum, response) => sum + response.cost, 0).toFixed(4)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
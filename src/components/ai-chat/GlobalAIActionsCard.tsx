'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  FileText, 
  Languages, 
  PenTool, 
  Search, 
  Lightbulb, 
  CheckCircle, 
  BarChart3,
  Copy,
  Download,
  Share,
  Settings,
  Loader2,
  Zap,
  Clock,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { globalAIService, AIOperation } from '@/services/globalAIService';
import { ProviderIcon, getProviderDisplayName } from '@/components/ui/provider-icons';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface GlobalAIActionsCardProps {
  selectedText?: string;
  onResult?: (result: string, operation: string) => void;
  className?: string;
}

export function GlobalAIActionsCard({ 
  selectedText = '', 
  onResult, 
  className 
}: GlobalAIActionsCardProps) {
  const { user } = useAuth();
  const [operations, setOperations] = useState<AIOperation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [inputText, setInputText] = useState(selectedText);
  const [result, setResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<{ provider: any; model: any }>({ provider: null, model: null });
  const [executionMetadata, setExecutionMetadata] = useState<any>(null);

  useEffect(() => {
    initializeAI();
    loadOperations();
  }, [user]);

  useEffect(() => {
    setInputText(selectedText);
  }, [selectedText]);

  const initializeAI = async () => {
    if (user) {
      await globalAIService.initialize(user.uid);
      const providerInfo = globalAIService.getCurrentProviderInfo();
      setCurrentProvider(providerInfo);
    }
  };

  const loadOperations = () => {
    const availableOperations = globalAIService.getAvailableOperations();
    setOperations(availableOperations);
  };

  const getOperationIcon = (operationId: string) => {
    const icons: Record<string, React.ReactNode> = {
      'summarize': <FileText className="h-4 w-4" />,
      'explain': <Search className="h-4 w-4" />,
      'rewrite': <PenTool className="h-4 w-4" />,
      'translate': <Languages className="h-4 w-4" />,
      'analyze': <BarChart3 className="h-4 w-4" />,
      'improve_writing': <Sparkles className="h-4 w-4" />,
      'generate_ideas': <Lightbulb className="h-4 w-4" />,
      'fact_check': <CheckCircle className="h-4 w-4" />
    };
    return icons[operationId] || <Zap className="h-4 w-4" />;
  };

  const executeOperation = async (operationId: string) => {
    if (!inputText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please provide some text to process',
        variant: 'destructive'
      });
      return;
    }

    setSelectedOperation(operationId);
    setIsProcessing(true);
    setResult('');
    setExecutionMetadata(null);

    try {
      const response = await globalAIService.executeOperation(operationId, inputText);
      
      if (response.success) {
        setResult(response.result!);
        setExecutionMetadata(response.metadata);
        onResult?.(response.result!, operationId);
        
        toast({
          title: 'Operation Completed',
          description: `Successfully processed with ${getProviderDisplayName(response.metadata?.providerId || '')}`,
        });
      } else {
        toast({
          title: 'Operation Failed',
          description: response.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('AI operation failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Operation failed',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setSelectedOperation(null);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast({
        title: 'Copied',
        description: 'Result copied to clipboard'
      });
    }
  };

  const shareResult = () => {
    if (navigator.share && result) {
      navigator.share({
        title: 'AI Generated Content',
        text: result
      });
    } else {
      copyResult();
    }
  };

  const downloadResult = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-result.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Powered by advanced AI models - Choose an operation below
            </CardDescription>
          </div>
          
          {currentProvider.provider && (
            <div className="flex items-center gap-2">
              <ProviderIcon provider={currentProvider.provider.id} size="sm" />
              <div className="text-right">
                <div className="text-xs font-medium">{currentProvider.provider.displayName}</div>
                <div className="text-xs text-muted-foreground">{currentProvider.model?.displayName}</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Text Area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Input Text</label>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter or paste text to process..."
            className="min-h-[100px] resize-none"
            disabled={isProcessing}
          />
        </div>

        {/* AI Operations Grid */}
        <div className="space-y-2">
          <label className="text-sm font-medium">AI Operations</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {operations.map((operation) => (
              <Button
                key={operation.id}
                variant={selectedOperation === operation.id ? "default" : "outline"}
                size="sm"
                onClick={() => executeOperation(operation.id)}
                disabled={isProcessing || !inputText.trim()}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                {selectedOperation === operation.id && isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  getOperationIcon(operation.id)
                )}
                <span className="text-xs font-medium">{operation.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeOperation('summarize')}
            disabled={isProcessing || !inputText.trim()}
            className="flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            Quick Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeOperation('improve_writing')}
            disabled={isProcessing || !inputText.trim()}
            className="flex items-center gap-1"
          >
            <PenTool className="h-3 w-3" />
            Improve Writing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeOperation('explain')}
            disabled={isProcessing || !inputText.trim()}
            className="flex items-center gap-1"
          >
            <Search className="h-3 w-3" />
            Explain
          </Button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing with {currentProvider.provider?.displayName}...
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Result</label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyResult}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareResult}
                  className="h-8 w-8 p-0"
                >
                  <Share className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadResult}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="max-h-[300px]">
              <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                {result}
              </div>
            </ScrollArea>

            {/* Execution Metadata */}
            {executionMetadata && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ProviderIcon provider={executionMetadata.providerId} size="xs" />
                  <span>{getProviderDisplayName(executionMetadata.providerId)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatResponseTime(executionMetadata.responseTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{executionMetadata.tokenCount} tokens</span>
                </div>
                {executionMetadata.cost > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCost(executionMetadata.cost)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Operation Descriptions */}
        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Tip:</strong> Select text anywhere in the app and it will automatically appear here. 
            Choose an AI operation to process your content with the currently selected AI model.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
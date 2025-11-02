// Mobile-Optimized Chat Component
// Responsive design with touch gestures and PWA features

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff,
  Settings, 
  Bot, 
  User, 
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  Menu,
  Search,
  Home,
  MessageSquare,
  FileText,
  Workflow,
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderIcon } from '@/components/ui/provider-icons';
import { ChatMessage, FileAttachment } from '@/types/ai-providers';
import { globalAIService } from '@/services/globalAIService';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MobileOptimizedChatProps {
  chatId?: string;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  className?: string;
}

export function MobileOptimizedChat({
  chatId = 'mobile-chat',
  initialMessages = [],
  onMessagesChange,
  className
}: MobileOptimizedChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice assistant integration
  const {
    voiceState,
    startWakeWordListening,
    stopWakeWordListening,
    speak,
    isVoiceSupported
  } = useVoiceAssistant({
    wakeWord: 'hey orb',
    autoListen: true
  });

  // Detect mobile keyboard
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, keyboardHeight]);

  // Handle messages change
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setAttachments([]);
    setIsGenerating(true);

    // Hide mobile keyboard
    inputRef.current?.blur();

    try {
      const response = await globalAIService.executeOperation('explain', inputMessage, {
        context: 'Mobile chat conversation'
      });

      if (response.success) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: response.result!,
          timestamp: Date.now(),
          metadata: {
            providerId: response.metadata?.providerId,
            modelId: response.metadata?.modelId,
            responseTime: response.metadata?.responseTime || 0,
            tokenCount: response.metadata?.tokenCount || 0,
            cost: response.metadata?.cost || 0,
            status: 'success'
          }
        };

        setMessages([...updatedMessages, assistantMessage]);

        // Speak response on mobile if voice is enabled
        if (voiceState.isWakeWordActive && 'speechSynthesis' in window) {
          speak(response.result!);
        }
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI response',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        uploadProgress: 100
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
      setShowAttachments(true);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - show providers
        setShowProviders(true);
      } else {
        // Swipe left - hide providers
        setShowProviders(false);
      }
    }

    setTouchStart(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    if (!isFullscreen) {
      // Enter fullscreen
      if (chatContainerRef.current?.requestFullscreen) {
        chatContainerRef.current.requestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleVoiceMode = () => {
    if (voiceState.isWakeWordActive) {
      stopWakeWordListening();
    } else {
      startWakeWordListening();
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-900",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
      style={{ 
        paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px',
        transition: 'padding-bottom 0.3s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <div>
            <h2 className="text-sm font-semibold">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {isGenerating ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isVoiceSupported() && (
            <Button
              variant={voiceState.isWakeWordActive ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceMode}
              className="h-8 w-8 p-0"
            >
              {voiceState.isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProviders(!showProviders)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Provider Selection (Mobile Drawer) */}
      {showProviders && (
        <div className="bg-gray-50 dark:bg-gray-800 border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">AI Providers</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProviders(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['openai', 'anthropic', 'google', 'mistral'].map((provider) => (
              <Button
                key={provider}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <ProviderIcon provider={provider} size="xs" />
                <span className="capitalize">{provider}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                Welcome to AI Assistant
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tap to type or use voice commands
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="text-xs">📱 Mobile Optimized</Badge>
                <Badge variant="outline" className="text-xs">🎤 Voice Ready</Badge>
                <Badge variant="outline" className="text-xs">📁 File Support</Badge>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 max-w-[85%]",
                message.role === 'user' ? 'ml-auto' : 'mr-auto'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="p-1">
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm",
                  message.role === 'user'
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                )}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 text-xs bg-black/10 dark:bg-white/10 rounded p-2"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.role === 'assistant' && message.metadata && (
                  <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                    {message.metadata.providerId && (
                      <ProviderIcon provider={message.metadata.providerId} size="xs" />
                    )}
                    {message.metadata.responseTime && (
                      <span>{(message.metadata.responseTime / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  AI is thinking...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm font-medium">Attachments ({attachments.length})</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-2 text-sm whitespace-nowrap"
              >
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-20">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Input */}
      <div className="p-3 border-t bg-white dark:bg-gray-900 sticky bottom-0">
        <div className="flex items-end gap-2">
          <Button
            onClick={handleFileUpload}
            variant="outline"
            size="sm"
            disabled={isGenerating}
            className="h-10 w-10 p-0 flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isGenerating}
              className="min-h-[40px] resize-none rounded-full"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && attachments.length === 0) || isGenerating}
            size="sm"
            className="h-10 w-10 p-0 flex-shrink-0 rounded-full"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Voice Status */}
        {voiceState.isWakeWordActive && (
          <div className="flex items-center justify-center mt-2">
            <Badge variant="secondary" className="text-xs">
              {voiceState.isListening ? (
                <>
                  <Mic className="h-3 w-3 mr-1 animate-pulse" />
                  Listening...
                </>
              ) : (
                <>
                  <MicOff className="h-3 w-3 mr-1" />
                  Say "Hey Orb"
                </>
              )}
            </Badge>
          </div>
        )}
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
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Paperclip, 
  Settings, 
  Plus, 
  Star, 
  Trash2, 
  Edit3, 
  FolderOpen,
  File,
  Image,
  Bot,
  User,
  Clock,
  DollarSign,
  Zap,
  Brain,
  X,
  Check,
  Copy,
  RefreshCw,
  Upload,
  Cloud,
  HardDrive
} from 'lucide-react';
import { AiChatSettings } from './AiChatSettings';
import { FileAttachmentPanel } from './FileAttachmentPanel';
import { ChatSidebar } from './ChatSidebar';
import { MultiModelChat } from './MultiModelChat';
import { aiProviderManager } from '@/services/ai-providers/aiProviderManager';
import { ChatSession, ChatMessage, AIResponse, FileAttachment } from '@/types/ai-providers';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface EnhancedAiAssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedAiAssistantChat({ isOpen, onClose }: EnhancedAiAssistantChatProps) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [activeProviders, setActiveProviders] = useState<string[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'files' | 'automation'>('chats');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadChatSessions();
      loadUserSettings();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    try {
      // Load chat sessions from Firebase
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const sessionsQuery = query(
        collection(db, 'chatSessions'),
        where('userId', '==', user?.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      
      setChatSessions(sessions);
      
      if (sessions.length > 0 && !currentSession) {
        setCurrentSession(sessions[0]);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      const settings = await aiProviderManager.loadUserSettings(user?.uid || '');
      const activeProviderIds = Object.keys(settings.providers).filter(
        id => settings.providers[id].isActive
      );
      setActiveProviders(activeProviderIds);
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const createNewChat = async () => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isStarred: false,
      activeProviders: activeProviders.slice(0, 1), // Start with one provider
      settings: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    
    // Save to Firebase
    await saveChatSession(newSession);
  };

  const saveChatSession = async (session: ChatSession) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await setDoc(doc(db, 'chatSessions', session.id), {
        ...session,
        userId: user?.uid
      });
    } catch (error) {
      console.error('Failed to save chat session:', error);
    }
  };

  const deleteChat = async (sessionId: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await deleteDoc(doc(db, 'chatSessions', sessionId));
      
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
        setCurrentSession(remainingSessions[0] || null);
      }
      
      toast({
        title: 'Chat Deleted',
        description: 'Chat session has been deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat session',
        variant: 'destructive'
      });
    }
  };

  const renameChat = async (sessionId: string, newTitle: string) => {
    const updatedSessions = chatSessions.map(session =>
      session.id === sessionId
        ? { ...session, title: newTitle, updatedAt: Date.now() }
        : session
    );
    
    setChatSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession({ ...currentSession, title: newTitle, updatedAt: Date.now() });
    }
    
    // Save to Firebase
    const updatedSession = updatedSessions.find(s => s.id === sessionId);
    if (updatedSession) {
      await saveChatSession(updatedSession);
    }
  };

  const toggleStarChat = async (sessionId: string) => {
    const updatedSessions = chatSessions.map(session =>
      session.id === sessionId
        ? { ...session, isStarred: !session.isStarred, updatedAt: Date.now() }
        : session
    );
    
    setChatSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession({ ...currentSession, isStarred: !currentSession.isStarred });
    }
    
    // Save to Firebase
    const updatedSession = updatedSessions.find(s => s.id === sessionId);
    if (updatedSession) {
      await saveChatSession(updatedSession);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!currentSession) {
      await createNewChat();
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    // Add user message to current session
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: Date.now()
    };

    // Auto-generate title from first message
    if (currentSession.messages.length === 0 && message.trim()) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      updatedSession.title = title;
    }

    setCurrentSession(updatedSession);
    setChatSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));

    // Clear input
    setMessage('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Get responses from active providers
      const providers = activeProviders.length > 0 ? activeProviders : ['google'];
      const responses: AIResponse[] = [];

      for (const providerId of providers) {
        try {
          const response = await aiProviderManager.generateResponse(
            message,
            providerId,
            'default', // Use default model for now
            {
              temperature: currentSession.settings.temperature,
              maxTokens: currentSession.settings.maxTokens,
              attachments: attachments.length > 0 ? attachments : undefined
            }
          );
          responses.push(response);
        } catch (error) {
          console.error(`Failed to get response from ${providerId}:`, error);
        }
      }

      if (responses.length > 0) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: responses[0].content, // Default to first response
          timestamp: Date.now(),
          responses,
          selectedResponse: responses[0].id
        };

        const finalSession = {
          ...updatedSession,
          messages: [...updatedSession.messages, assistantMessage],
          updatedAt: Date.now()
        };

        setCurrentSession(finalSession);
        setChatSessions(prev => prev.map(s => s.id === currentSession.id ? finalSession : s));
        
        // Save to Firebase
        await saveChatSession(finalSession);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addAttachment = (file: FileAttachment) => {
    setAttachments(prev => [...prev, file]);
  };

  const removeAttachment = (fileId: string) => {
    setAttachments(prev => prev.filter(f => f.id !== fileId));
  };

  const selectResponse = (messageId: string, responseId: string) => {
    if (!currentSession) return;

    const updatedMessages = currentSession.messages.map(msg =>
      msg.id === messageId
        ? {
            ...msg,
            selectedResponse: responseId,
            content: msg.responses?.find(r => r.id === responseId)?.content || msg.content
          }
        : msg
    );

    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      updatedAt: Date.now()
    };

    setCurrentSession(updatedSession);
    setChatSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
    saveChatSession(updatedSession);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-[95vw] h-[90vh] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chats" className="text-xs">Chats</TabsTrigger>
                <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
                <TabsTrigger value="automation" className="text-xs">Auto</TabsTrigger>
              </TabsList>

              <TabsContent value="chats" className="mt-4">
                <ChatSidebar
                  sessions={chatSessions}
                  currentSession={currentSession}
                  onSelectSession={setCurrentSession}
                  onNewChat={createNewChat}
                  onDeleteChat={deleteChat}
                  onRenameChat={renameChat}
                  onToggleStar={toggleStarChat}
                />
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <FileAttachmentPanel
                  onAttachFile={addAttachment}
                  attachments={attachments}
                  onRemoveAttachment={removeAttachment}
                />
              </TabsContent>

              <TabsContent value="automation" className="mt-4">
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Automation workflows coming soon...
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{currentSession?.title || 'New Chat'}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {activeProviders.map(providerId => (
                    <Badge key={providerId} variant="outline" className="text-xs">
                      {providerId}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentSession?.isStarred && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={createNewChat}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {currentSession?.messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map(attachment => (
                            <div key={attachment.id} className="flex items-center gap-2 text-xs opacity-70">
                              <File className="h-3 w-3" />
                              {attachment.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Model Responses */}
                  {msg.responses && msg.responses.length > 1 && (
                    <MultiModelChat
                      responses={msg.responses}
                      selectedResponseId={msg.selectedResponse}
                      onSelectResponse={(responseId) => selectResponse(msg.id, responseId)}
                    />
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="flex items-center gap-2 bg-muted rounded px-2 py-1 text-sm">
                    <File className="h-3 w-3" />
                    <span className="truncate max-w-32">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilePanel(!showFilePanel)}
                className="shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="resize-none"
                />
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={isLoading || (!message.trim() && attachments.length === 0)}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AiChatSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

'use client';

import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Mic, MicOff, Volume2, VolumeX, Sparkles, Wand2, Languages, FileText, Edit3 } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useApiKey } from '@/hooks/use-api-key';
import { answerWebAppQuestions, type WebAppQaInput, type WebAppQaOutput } from '@/ai/flows/webapp-qa-flow';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import LottieOrb from '../landing/LottieOrb';
import { generateDailyBriefing } from '@/ai/flows/generate-daily-briefing-flow';
import { useAuth } from '@/context/AuthContext';
import { useVoiceActivation } from '@/hooks/useVoiceActivation';
import { chromeAIService, textSelectionHandler, autoCorrectService } from '@/services/chromeAiService';
import { webappContextService } from '@/services/webappContextService';
import { aiFlowsIntegrationService } from '@/services/aiFlowsIntegration';
import type { OrbAIRequest, TextSelection } from '@/types/chrome-ai';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-white shadow-md",
          isUser
            ? "bg-blue-600 rounded-br-lg"
            : "bg-neutral-700 rounded-bl-lg"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
};

interface DashboardChatProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    initialMessage: string | null;
}

// Chrome AI Action Button Component
const ChromeAIActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  isLoading = false,
  variant = 'default'
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'primary';
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="sm"
        variant={variant === 'primary' ? 'default' : 'ghost'}
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          "h-8 w-8 p-0 rounded-full",
          variant === 'primary' && "bg-blue-600 hover:bg-blue-700 text-white",
          "transition-all duration-200 hover:scale-105"
        )}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

// Text Selection Popup Component
const TextSelectionPopup = ({ 
  selection, 
  onAction 
}: { 
  selection: TextSelection;
  onAction: (action: string, text: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.8, y: 10 }}
    className="fixed z-[300] bg-black/90 backdrop-blur-sm rounded-lg p-2 flex gap-1 border border-white/20"
    style={{
      left: selection.position.x - 100,
      top: selection.position.y - 60
    }}
  >
    <ChromeAIActionButton
      icon={Sparkles}
      label="Summarize"
      onClick={() => onAction('summarize', selection.text)}
    />
    <ChromeAIActionButton
      icon={Edit3}
      label="Rewrite"
      onClick={() => onAction('rewrite', selection.text)}
    />
    <ChromeAIActionButton
      icon={Languages}
      label="Translate"
      onClick={() => onAction('translate', selection.text)}
    />
    <ChromeAIActionButton
      icon={FileText}
      label="Proofread"
      onClick={() => onAction('proofread', selection.text)}
    />
  </motion.div>
);

export default function DashboardChat({ isOpen, setIsOpen, initialMessage }: DashboardChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isChromeAIEnabled, setIsChromeAIEnabled] = useState(false);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [webappContext, setWebappContext] = useState<any>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  const { apiKey } = useApiKey();
  const { user } = useAuth();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Enhanced voice activation with Chrome AI integration
  const {
    isListening,
    isListeningForCommand,
    isSpeaking,
    permissionStatus,
    requestPermissionAndStart,
    speak,
    stopSpeaking,
    startCommandListening
  } = useVoiceActivation({
    wakeWord: 'hey orb',
    onActivation: handleVoiceActivation,
    isEnabled: isVoiceMode,
    enableContinuousListening: true,
    onCommandReceived: handleVoiceCommand
  });

  // Voice activation handlers
  async function handleVoiceActivation() {
    setIsOpen(true);
    try {
      await speak("How can I help you?", { rate: 1.1, pitch: 1.1 });
      const command = await startCommandListening();
      if (command) {
        handleVoiceCommand(command);
      }
    } catch (error) {
      console.error("Voice activation error:", error);
    }
  }

  function handleVoiceCommand(command: string) {
    if (!command.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', content: command }]);
    handleAIResponse(chatHistory, command, true);
  }

  // Enhanced AI response with integrated AI flows
  const handleAIResponse = async (history: ChatMessage[], prompt: string, isVoiceCommand = false) => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use integrated AI flows service
      const result = await aiFlowsIntegrationService.processRequest({
        type: 'webapp-qa',
        prompt,
        userId: user.uid,
        apiKey,
        chatHistory: history.map(m => ({ role: m.role, content: m.content })),
        options: {
          useChrome: isChromeAIEnabled,
          fallbackToGenkit: true,
          enhancePrompt: true,
          contextType: undefined // Use full context
        }
      });

      if (result.success && result.response) {
        setChatHistory(prev => [...prev, { role: 'model', content: result.response! }]);

        // Speak response if it's a voice command
        if (isVoiceCommand && isVoiceMode) {
          await speak(result.response, { rate: 1.0, pitch: 1.0 });
        }
      } else {
        throw new Error(result.error || 'Failed to generate response');
      }

    } catch (e) {
      console.error(e);
      const errorMessage = "I'm sorry, I encountered an error and can't provide a response right now.";
      setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
      
      if (isVoiceCommand && isVoiceMode) {
        await speak(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Chrome AI action handlers using integrated service
  const handleChromeAIAction = async (operation: string, text: string) => {
    setIsProcessingAI(true);
    try {
      let result;

      // Use specialized methods from integrated service
      switch (operation) {
        case 'summarize':
          result = await aiFlowsIntegrationService.summarizeContent(text, user?.uid || '', {
            format: 'markdown',
            length: 'medium'
          });
          break;
        case 'translate':
          result = await aiFlowsIntegrationService.translateContent(text, 'es');
          break;
        case 'rewrite':
          result = await aiFlowsIntegrationService.rewriteContent(text, {
            tone: 'neutral',
            length: 'as-is'
          });
          break;
        case 'proofread':
          result = await aiFlowsIntegrationService.proofreadContent(text);
          break;
        default:
          // Fallback to direct Chrome AI service
          const request: OrbAIRequest = {
            operation: operation as any,
            text,
            context: JSON.stringify(webappContext),
            options: operation === 'translate' ? { targetLanguage: 'es' } : undefined
          };
          const response = await chromeAIService.processAIRequest(request);
          result = {
            success: response.success,
            response: response.result,
            error: response.error,
            source: 'chrome-ai' as const
          };
      }
      
      if (result.success && result.response) {
        // Add to chat history
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: `${operation.charAt(0).toUpperCase() + operation.slice(1)}: "${text}"` },
          { role: 'model', content: result.response }
        ]);

        // Replace selected text if applicable
        if (selectedText && ['rewrite', 'proofread', 'translate'].includes(operation)) {
          textSelectionHandler.replaceSelectedText(result.response);
        }

        // Speak result if voice mode is active
        if (isVoiceMode && !isSpeaking) {
          await speak(`Here's the ${operation} result: ${result.response}`);
        }
      } else {
        throw new Error(result.error || 'Chrome AI operation failed');
      }
    } catch (error) {
      console.error(`Chrome AI ${operation} error:`, error);
      setChatHistory(prev => [
        ...prev,
        { role: 'model', content: `Sorry, I couldn't ${operation} that text. ${error instanceof Error ? error.message : ''}` }
      ]);
    } finally {
      setIsProcessingAI(false);
      setSelectedText(null);
    }
  };

  const handleGetBriefing = async () => {
    if (!user) return;
    setIsOpen(true);
    setChatHistory(prev => [...prev, { role: 'user', content: "Give me my daily briefing." }]);
    setIsLoading(true);
    try {
      // Use integrated AI flows service for briefing
      const result = await aiFlowsIntegrationService.processRequest({
        type: 'daily-briefing',
        prompt: 'Generate my daily briefing',
        userId: user.uid,
        apiKey,
        options: {
          useChrome: isChromeAIEnabled,
          fallbackToGenkit: true,
          enhancePrompt: false // Briefing doesn't need prompt enhancement
        }
      });

      if (result.success && result.response) {
        setChatHistory(prev => [...prev, { role: 'model', content: result.response }]);

        // Speak briefing if voice mode is active
        if (isVoiceMode && !isSpeaking) {
          await speak(result.response);
        }
      } else {
        throw new Error(result.error || 'Failed to generate briefing');
      }
    } catch (e) {
      console.error(e);
      const errorMessage = "Sorry, I couldn't generate your briefing right now.";
      setChatHistory(prev => [...prev, { role: 'model', content: errorMessage }]);
      
      if (isVoiceMode && !isSpeaking) {
        await speak(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize Chrome AI and webapp context
  useEffect(() => {
    const initializeChromeAI = async () => {
      if (window.ai) {
        setIsChromeAIEnabled(true);
        console.log('Chrome AI APIs detected and enabled');
      }
    };

    const loadWebappContext = async () => {
      if (user) {
        try {
          const context = await webappContextService.getFullContext(user.uid);
          setWebappContext(context);
        } catch (error) {
          console.error('Failed to load webapp context:', error);
        }
      }
    };

    initializeChromeAI();
    loadWebappContext();
  }, [user]);

  // Text selection handler
  useEffect(() => {
    const unsubscribe = textSelectionHandler.onSelectionChange((selection) => {
      setSelectedText(selection);
    });

    return unsubscribe;
  }, []);

  // Initial message handler
  useEffect(() => {
    if (initialMessage) {
        const newHistory = [...chatHistory, { role: 'user', content: initialMessage }];
        setChatHistory(newHistory);
        handleAIResponse(chatHistory, initialMessage);
    }
  }, [initialMessage]);


  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const newHistory = [...chatHistory, { role: 'user', content: input }];
    setChatHistory(newHistory);
    setInput('');
    handleAIResponse(chatHistory, input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);
  
  useEffect(() => {
    if(isOpen) {
        setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleOrbClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && chatHistory.length === 0) {
        setChatHistory([{ role: 'model', content: "Hello! How can I help?"}])
    }
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={!isOpen}
      dragMomentum={false}
      className="fixed bottom-4 right-4 z-[200] flex flex-col items-end"
      style={{ position: 'fixed' }} // Ensure it's fixed for dragging
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2"
          >
            <div className="w-[320px] max-h-[60vh] flex flex-col frosted-glass rounded-t-2xl">
              <div
                  ref={scrollAreaRef}
                  className="flex-1 p-4 space-y-4 overflow-y-auto"
                >
                <AnimatePresence>
                  {chatHistory.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                  ))}
                </AnimatePresence>
                  {isLoading && (
                    <motion.div layout className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-2 text-white bg-neutral-700 rounded-bl-md">
                        <LoadingSpinner size="sm" />
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="p-2 border-t border-white/10">
                    <button
                        onClick={handleGetBriefing}
                        disabled={isLoading}
                        className="w-full text-xs text-center p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                        Get Daily Briefing
                    </button>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={cn(
          "relative bottom-chat-bar",
          isOpen && "is-open"
        )}
        onPointerDown={(e) => {
            if (isOpen) {
              e.stopPropagation();
            } else {
                dragControls.start(e);
            }
        }}
      >
        <div className="flex items-center w-full h-full p-2">
          <motion.div layout="position" onClick={handleOrbClick} className="cursor-pointer">
             <LottieOrb />
          </motion.div>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                  className="flex-1 px-3 flex items-center"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto', transition: { delay: 0.2 } }}
                  exit={{ opacity: 0, width: 0 }}
              >
                  <div className="flex-1 flex items-center gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListeningForCommand ? "Listening..." : "Ask anything..."}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 resize-none text-white placeholder:text-gray-400 text-base"
                        disabled={isListeningForCommand}
                    />
                    
                    {/* Chrome AI Controls */}
                    <TooltipProvider>
                      <div className="flex items-center gap-1">
                        {/* Voice Control */}
                        <ChromeAIActionButton
                          icon={isVoiceMode ? (isListening ? Mic : MicOff) : Mic}
                          label={isVoiceMode ? (isListening ? "Listening..." : "Voice Off") : "Enable Voice"}
                          onClick={() => {
                            if (!isVoiceMode) {
                              setIsVoiceMode(true);
                              requestPermissionAndStart();
                            } else {
                              setIsVoiceMode(false);
                            }
                          }}
                          variant={isVoiceMode ? "primary" : "default"}
                          isLoading={isListeningForCommand}
                        />
                        
                        {/* Speech Control */}
                        {isVoiceMode && (
                          <ChromeAIActionButton
                            icon={isSpeaking ? VolumeX : Volume2}
                            label={isSpeaking ? "Stop Speaking" : "Text to Speech"}
                            onClick={() => {
                              if (isSpeaking) {
                                stopSpeaking();
                              }
                            }}
                            isLoading={isSpeaking}
                          />
                        )}
                        
                        {/* Chrome AI Status */}
                        {isChromeAIEnabled && (
                          <ChromeAIActionButton
                            icon={Sparkles}
                            label="Chrome AI Enabled"
                            onClick={() => {}}
                            variant="primary"
                          />
                        )}
                      </div>
                    </TooltipProvider>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 p-2 hover:text-white"
              >
                <X className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Text Selection Popup */}
      <AnimatePresence>
        {selectedText && (
          <TextSelectionPopup
            selection={selectedText}
            onAction={handleChromeAIAction}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

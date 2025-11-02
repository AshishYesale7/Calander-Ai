// Advanced Voice Assistant Hook
// Integrates voice input/output with the AI chat system

import { useState, useEffect, useRef, useCallback } from 'react';
import { globalAIService } from '@/services/globalAIService';

export interface VoiceConfig {
  wakeWord: string;
  language: string;
  voiceId: string;
  autoListen: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isWakeWordActive: boolean;
  lastCommand: string;
  confidence: number;
  error: string | null;
}

export function useVoiceAssistant(config: Partial<VoiceConfig> = {}) {
  const defaultConfig: VoiceConfig = {
    wakeWord: 'hey orb',
    language: 'en-US',
    voiceId: 'default',
    autoListen: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    ...config
  };

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isWakeWordActive: false,
    lastCommand: '',
    confidence: 0,
    error: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const wakeWordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = defaultConfig.language;
        recognitionRef.current.maxAlternatives = 1;
      }

      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        synthesisRef.current = window.speechSynthesis;
      }
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  // Setup speech recognition event handlers
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      setVoiceState(prev => ({ ...prev, isListening: false }));
      
      // Restart listening if wake word mode is active
      if (voiceState.isWakeWordActive && defaultConfig.autoListen) {
        setTimeout(() => startWakeWordListening(), 1000);
      }
    };

    recognition.onerror = (event) => {
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: `Speech recognition error: ${event.error}` 
      }));
    };

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      
      if (latestResult.isFinal) {
        const transcript = latestResult[0].transcript.toLowerCase().trim();
        const confidence = latestResult[0].confidence;
        
        setVoiceState(prev => ({ 
          ...prev, 
          lastCommand: transcript, 
          confidence 
        }));

        if (voiceState.isWakeWordActive) {
          // Check for wake word
          if (transcript.includes(defaultConfig.wakeWord.toLowerCase())) {
            handleWakeWordDetected();
          }
        } else {
          // Process voice command
          handleVoiceCommand(transcript, confidence);
        }
      }
    };

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
    };
  }, [voiceState.isWakeWordActive, defaultConfig.wakeWord]);

  const startWakeWordListening = useCallback(() => {
    if (!recognitionRef.current) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not supported' 
      }));
      return;
    }

    try {
      setVoiceState(prev => ({ 
        ...prev, 
        isWakeWordActive: true, 
        error: null 
      }));
      
      recognitionRef.current.start();
    } catch (error) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: `Failed to start wake word listening: ${error}` 
      }));
    }
  }, []);

  const stopWakeWordListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setVoiceState(prev => ({ 
      ...prev, 
      isWakeWordActive: false, 
      isListening: false 
    }));

    if (wakeWordTimeoutRef.current) {
      clearTimeout(wakeWordTimeoutRef.current);
    }
  }, []);

  const handleWakeWordDetected = useCallback(() => {
    setVoiceState(prev => ({ 
      ...prev, 
      isWakeWordActive: false 
    }));

    // Play wake word confirmation sound
    speak("Yes?", { 
      rate: 1.2, 
      pitch: 1.1, 
      volume: 0.8 
    });

    // Start command listening with timeout
    setTimeout(() => {
      startCommandListening();
    }, 1000);
  }, []);

  const startCommandListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      setVoiceState(prev => ({ 
        ...prev, 
        isListening: true 
      }));
      
      recognitionRef.current.start();

      // Set command timeout
      commandTimeoutRef.current = setTimeout(() => {
        stopListening();
        speak("I didn't hear anything. Say 'Hey Orb' to try again.");
        
        if (defaultConfig.autoListen) {
          setTimeout(() => startWakeWordListening(), 2000);
        }
      }, 10000); // 10 second timeout

    } catch (error) {
      setVoiceState(prev => ({ 
        ...prev, 
        error: `Failed to start command listening: ${error}` 
      }));
    }
  }, [defaultConfig.autoListen]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setVoiceState(prev => ({ 
      ...prev, 
      isListening: false 
    }));

    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
  }, []);

  const handleVoiceCommand = useCallback(async (command: string, confidence: number) => {
    if (confidence < 0.7) {
      speak("I didn't understand that clearly. Could you repeat?");
      return;
    }

    setVoiceState(prev => ({ 
      ...prev, 
      isProcessing: true 
    }));

    try {
      // Clear command timeout
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }

      // Process command with AI
      const response = await globalAIService.executeOperation('explain', command, {
        context: 'Voice command processing',
        customPrompt: `Process this voice command and provide a helpful response. Command: "${command}". Respond conversationally as if speaking to the user.`
      });

      if (response.success) {
        // Speak the response
        await speak(response.result!);
        
        // Return to wake word listening if auto-listen is enabled
        if (defaultConfig.autoListen) {
          setTimeout(() => startWakeWordListening(), 1000);
        }
      } else {
        speak("I'm sorry, I couldn't process that command. Please try again.");
      }

    } catch (error) {
      speak("I encountered an error processing your command.");
      setVoiceState(prev => ({ 
        ...prev, 
        error: `Command processing error: ${error}` 
      }));
    } finally {
      setVoiceState(prev => ({ 
        ...prev, 
        isProcessing: false 
      }));
    }
  }, [defaultConfig.autoListen]);

  const speak = useCallback((text: string, options: Partial<VoiceConfig> = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!synthesisRef.current) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      synthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.speechRate || defaultConfig.speechRate;
      utterance.pitch = options.speechPitch || defaultConfig.speechPitch;
      utterance.volume = options.speechVolume || defaultConfig.speechVolume;
      utterance.lang = defaultConfig.language;

      // Set voice if available
      const voices = synthesisRef.current.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.name.includes(options.voiceId || defaultConfig.voiceId) ||
        voice.lang === defaultConfig.language
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      };

      utterance.onend = () => {
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        resolve();
      };

      utterance.onerror = (event) => {
        setVoiceState(prev => ({ 
          ...prev, 
          isSpeaking: false, 
          error: `Speech synthesis error: ${event.error}` 
        }));
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      synthesisRef.current.speak(utterance);
    });
  }, [defaultConfig]);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    setVoiceState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const processTextWithVoice = useCallback(async (text: string, operation: string = 'explain') => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await globalAIService.executeOperation(operation, text);
      
      if (response.success) {
        await speak(response.result!);
        return response.result!;
      } else {
        await speak("I couldn't process that text. Please try again.");
        return null;
      }
    } catch (error) {
      await speak("I encountered an error processing the text.");
      return null;
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [speak]);

  const getAvailableVoices = useCallback(() => {
    if (!synthesisRef.current) return [];
    return synthesisRef.current.getVoices();
  }, []);

  const isVoiceSupported = useCallback(() => {
    return !!(recognitionRef.current && synthesisRef.current);
  }, []);

  return {
    voiceState,
    startWakeWordListening,
    stopWakeWordListening,
    startCommandListening,
    stopListening,
    speak,
    stopSpeaking,
    processTextWithVoice,
    getAvailableVoices,
    isVoiceSupported,
    config: defaultConfig
  };
}
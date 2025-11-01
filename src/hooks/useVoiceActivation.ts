
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseVoiceActivationProps {
  wakeWord: string;
  onActivation: () => void;
  isEnabled: boolean;
  onCommandReceived?: (command: string) => void;
  enableContinuousListening?: boolean;
}

interface VoiceResponse {
  text: string;
  audioUrl?: string;
}

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export const useVoiceActivation = ({ 
  wakeWord, 
  onActivation, 
  isEnabled, 
  onCommandReceived,
  enableContinuousListening = false 
}: UseVoiceActivationProps) => {
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const commandRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    if (recognitionRef.current || !isEnabled) return;
    
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase();
        if (event.results[i].isFinal && transcript.includes(wakeWord.toLowerCase())) {
          onActivation();
        }
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermissionStatus('denied');
        cleanup();
      }
    };
    
    recognition.onend = () => {
      if (isEnabled && permissionStatus === 'granted') {
        setTimeout(() => {
            if (recognitionRef.current && isEnabled) {
                 try {
                    recognitionRef.current.start();
                 } catch (e: any) {
                     if (e.name !== 'InvalidStateError') {
                        console.error("Could not restart recognition:", e);
                     }
                 }
            }
        }, 500);
      } else {
        setIsListening(false);
      }
    };
    
    try {
      recognition.start();
      setIsListening(true);
    } catch(e: any) {
        if (e.name !== 'InvalidStateError') {
            console.error("Could not start recognition:", e);
        }
    }

  }, [isEnabled, wakeWord, onActivation, permissionStatus, cleanup]);
  
  useEffect(() => {
    if (isEnabled) {
      if (permissionStatus === 'granted') {
        startListening();
      }
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isEnabled, permissionStatus, startListening, cleanup]);

  const requestPermissionAndStart = async () => {
    if (!SpeechRecognition) {
      toast({ title: "Not Supported", description: "Your browser does not support speech recognition.", variant: "destructive" });
      return;
    }
     if (permissionStatus === 'denied') {
      toast({ title: "Permission Blocked", description: "You need to enable microphone access in your browser settings.", variant: "destructive" });
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (err) {
      setPermissionStatus('denied');
      toast({ title: "Permission Denied", description: "Microphone access is required for voice commands.", variant: "destructive" });
    }
  };

  const listenForCommand = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!SpeechRecognition) {
            reject("Speech recognition not supported.");
            return;
        }

        // Stop the wake word listener temporarily
        cleanup();

        const commandRecognition = new SpeechRecognition();
        commandRecognition.continuous = false;
        commandRecognition.interimResults = false;

        commandRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            resolve(transcript);
        };

        commandRecognition.onerror = (event) => {
            console.error("Command recognition error:", event.error);
            reject(event.error);
        };
        
        commandRecognition.onend = () => {
            // Restart the main wake word listener after the command is processed
            if (isEnabled) {
                startListening();
            }
        };

        try {
            commandRecognition.start();
        } catch (e) {
            reject("Failed to start command recognition.");
        }
    });
  };

  // Enhanced speech synthesis function
  const speak = useCallback((text: string, options?: { voice?: string; rate?: number; pitch?: number }): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject('Speech synthesis not supported');
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current = utterance;

      // Configure voice options
      if (options?.voice) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name.includes(options.voice!));
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Pause listening while speaking to avoid feedback
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        speechSynthesisRef.current = null;
        // Resume listening after speaking
        if (isEnabled && permissionStatus === 'granted') {
          setTimeout(() => startListening(), 500);
        }
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        speechSynthesisRef.current = null;
        reject(event.error);
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isEnabled, permissionStatus, startListening]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      speechSynthesisRef.current = null;
    }
  }, []);

  // Enhanced command listening with continuous mode
  const startCommandListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!SpeechRecognition) {
        reject("Speech recognition not supported.");
        return;
      }

      // Stop wake word listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const commandRecognition = new SpeechRecognition();
      commandRecognitionRef.current = commandRecognition;
      
      commandRecognition.continuous = enableContinuousListening;
      commandRecognition.interimResults = true;
      commandRecognition.maxAlternatives = 3;

      let finalTranscript = '';
      let timeoutId: NodeJS.Timeout;

      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          commandRecognition.stop();
          if (finalTranscript.trim()) {
            resolve(finalTranscript.trim());
          } else {
            reject('No command received');
          }
        }, 5000); // 5 second timeout
      };

      commandRecognition.onstart = () => {
        setIsListeningForCommand(true);
        resetTimeout();
      };

      commandRecognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Reset timeout on new speech
        if (interimTranscript || finalTranscript) {
          resetTimeout();
        }

        // Call command received callback for real-time processing
        if (onCommandReceived && (finalTranscript || interimTranscript)) {
          onCommandReceived(finalTranscript + interimTranscript);
        }
      };

      commandRecognition.onerror = (event) => {
        console.error("Command recognition error:", event.error);
        setIsListeningForCommand(false);
        if (timeoutId) clearTimeout(timeoutId);
        reject(event.error);
      };

      commandRecognition.onend = () => {
        setIsListeningForCommand(false);
        commandRecognitionRef.current = null;
        if (timeoutId) clearTimeout(timeoutId);
        
        // Restart wake word listening
        if (isEnabled && permissionStatus === 'granted') {
          setTimeout(() => startListening(), 500);
        }
        
        if (finalTranscript.trim()) {
          resolve(finalTranscript.trim());
        }
      };

      try {
        commandRecognition.start();
      } catch (e) {
        setIsListeningForCommand(false);
        reject("Failed to start command recognition.");
      }
    });
  }, [isEnabled, permissionStatus, startListening, onCommandReceived, enableContinuousListening]);

  // Stop command listening
  const stopCommandListening = useCallback(() => {
    if (commandRecognitionRef.current) {
      commandRecognitionRef.current.stop();
      commandRecognitionRef.current = null;
      setIsListeningForCommand(false);
    }
  }, []);

  // Cleanup function enhancement
  const enhancedCleanup = useCallback(() => {
    cleanup();
    stopCommandListening();
    stopSpeaking();
  }, [cleanup, stopCommandListening, stopSpeaking]);

  // Enhanced effect cleanup
  useEffect(() => {
    return enhancedCleanup;
  }, [enhancedCleanup]);

  return { 
    isListening, 
    isListeningForCommand,
    isSpeaking,
    permissionStatus, 
    requestPermissionAndStart, 
    listenForCommand,
    startCommandListening,
    stopCommandListening,
    speak,
    stopSpeaking
  };
};

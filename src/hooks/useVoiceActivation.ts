
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseVoiceActivationProps {
  wakeWord: string;
  onActivation: () => void;
  isEnabled: boolean;
}

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));

export const useVoiceActivation = ({ wakeWord, onActivation, isEnabled }: UseVoiceActivationProps) => {
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  // Clean up the recognition instance
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

  // Main logic to start listening
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
                    // Check if it's not already running
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
  
  // Effect to manage the listening state based on the isEnabled prop
  useEffect(() => {
    if (isEnabled) {
      if (permissionStatus === 'granted') {
        startListening();
      }
    } else {
      cleanup();
    }
    
    // Return cleanup function to be called when component unmounts or dependencies change
    return cleanup;
  }, [isEnabled, permissionStatus, startListening, cleanup]);

  // The function to be called by a user action to request permission
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
      // This is a common way to trigger the permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // We don't need the stream, just the permission
      setPermissionStatus('granted');
      // The useEffect will now automatically call startListening
    } catch (err) {
      setPermissionStatus('denied');
      toast({ title: "Permission Denied", description: "Microphone access is required for voice commands.", variant: "destructive" });
    }
  };

  return { isListening, permissionStatus, requestPermissionAndStart };
};

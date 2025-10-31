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
    if (isListening || !isEnabled) return;
    
    // Create a new recognition instance
    cleanup(); // Clean up any previous instance
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase();
        if (event.results[i].isFinal && transcript.includes(wakeWord.toLowerCase())) {
          onActivation();
          // Optional: stop listening after activation to prevent re-triggering
          // cleanup();
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
      // The service can sometimes stop on its own, so we restart it if it's supposed to be enabled.
      if (isEnabled && permissionStatus === 'granted') {
        setTimeout(() => {
            if (recognitionRef.current && isEnabled) {
                 try {
                    recognitionRef.current.start();
                 } catch (e) {
                     // Could fail if already started, which is fine.
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
    } catch(e) {
        console.error("Could not start recognition:", e);
    }

  }, [isListening, isEnabled, cleanup, wakeWord, onActivation, permissionStatus]);
  
  // Effect to manage the listening state based on the isEnabled prop
  useEffect(() => {
    if (isEnabled) {
      if (permissionStatus === 'granted') {
        startListening();
      } else if (permissionStatus === 'denied') {
        // Don't do anything if permission was already denied
      } else { // 'prompt' state
        // The user has to initiate the first permission request
      }
    } else {
      cleanup();
    }
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
      startListening();
    } catch (err) {
      setPermissionStatus('denied');
      toast({ title: "Permission Denied", description: "Microphone access is required for voice commands.", variant: "destructive" });
    }
  };

  return { isListening, permissionStatus, requestPermissionAndStart };
};

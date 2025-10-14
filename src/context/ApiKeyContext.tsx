'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth
import { saveUserGeminiApiKey, getUserGeminiApiKey } from '@/services/userService'; // Import new service
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

const API_KEY_STORAGE_KEY = 'futuresight-gemini-api-key';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isMounted: boolean;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const getInitialApiKeyFromLocalStorage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error(`Error reading from localStorage key “${API_KEY_STORAGE_KEY}”:`, error);
    return null;
  }
};

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(getInitialApiKeyFromLocalStorage);
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading: authLoading } = useAuth(); // Get user from AuthContext
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // This new effect syncs Firestore with local state on user login
  useEffect(() => {
    const isPublicPage = pathname === '/' || pathname.startsWith('/auth');

    // Only run the sync logic on authenticated app pages, not public ones
    if (isMounted && user && !authLoading && !isPublicPage) {
        const syncKeyFromFirestore = async () => {
            try {
                const firestoreKey = await getUserGeminiApiKey(user.uid);
                const localKey = getInitialApiKeyFromLocalStorage();
                
                // Firestore is the source of truth if it has a key
                if (firestoreKey) {
                    if (firestoreKey !== localKey) {
                        localStorage.setItem(API_KEY_STORAGE_KEY, firestoreKey);
                        setApiKeyState(firestoreKey);
                    }
                } else if (localKey) {
                    // If local has a key but firestore doesn't, sync local to firestore
                    await saveUserGeminiApiKey(user.uid, localKey);
                }
            } catch (error: any) {
                if (error.message.includes('Failed to fetch')) {
                    // This is likely an offline error, so we don't show a toast.
                    console.warn("Could not sync API key, likely offline.");
                } else {
                    console.error("Failed to sync API key from Firestore:", error);
                    toast({
                        title: 'Sync Error',
                        description: 'Could not load your saved API key from the cloud.',
                        variant: 'destructive',
                    });
                }
            }
        };
        syncKeyFromFirestore();
    }
  }, [isMounted, user, authLoading, toast, pathname]);


  const setApiKey = useCallback((key: string | null) => {
    try {
      const trimmedKey = key ? key.trim() : null;
      if (trimmedKey) {
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
      setApiKeyState(trimmedKey);

      // Also save to Firestore if user is logged in
      if (user) {
        saveUserGeminiApiKey(user.uid, trimmedKey).catch(error => {
            console.error("Failed to save API key to Firestore:", error);
            toast({
                title: 'Sync Error',
                description: 'Could not save your API key to the cloud. It is saved on this device only.',
                variant: 'destructive',
            });
        });
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${API_KEY_STORAGE_KEY}”:`, error);
    }
  }, [user, toast]);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isMounted }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

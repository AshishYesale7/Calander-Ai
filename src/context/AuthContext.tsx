
'use client';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { Preloader } from '@/components/ui/Preloader';
import { AlertCircle } from 'lucide-react';
import { getUserSubscription } from '@/services/subscriptionService';
import type { UserSubscription } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  subscription: UserSubscription | null;
  isSubscribed: boolean;
  refreshSubscription: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isFirebaseConfigured = !!auth;

const MissingConfiguration = () => (
  <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-8">
    <div className="text-center max-w-2xl bg-card border border-destructive/50 p-8 rounded-lg shadow-lg">
      <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
      <h1 className="text-2xl font-bold text-destructive mb-2">Configuration Error</h1>
      <p className="mb-4 text-card-foreground/80">
        The application cannot connect to Firebase. This is because one or more
        required API keys are missing from your environment configuration.
      </p>
      <p className="mb-6 text-card-foreground/80">
        Please copy your Firebase project credentials into the <strong>.env</strong> file at the root of this project to continue.
      </p>
      <div className="bg-muted text-left p-4 rounded-md text-sm text-muted-foreground overflow-x-auto">
        <p className="font-mono">GEMINI_API_KEY=...</p>
        <p className="font-mono">NEXT_PUBLIC_FIREBASE_API_KEY=...</p>
        <p className="font-mono">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...</p>
        <p className="font-mono">NEXT_PUBLIC_FIREBASE_PROJECT_ID=...</p>
        <p className="font-mono">NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...</p>
        <p className="font-mono">NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...</p>
        <p className="font-mono">NEXT_PUBLIC_FIREBASE_APP_ID=...</p>
      </div>
    </div>
  </div>
);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isSubscribed = !!subscription && 
    (subscription.status === 'active' || subscription.status === 'trial') && 
    (subscription.endDate && new Date(subscription.endDate) > new Date());

  const fetchSubscription = useCallback(async (uid: string) => {
    try {
        const userSub = await getUserSubscription(uid);
        setSubscription(userSub);
    } catch (error) {
        console.error("Failed to fetch user subscription:", error);
        setSubscription(null);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (user) {
        await fetchSubscription(user.uid);
    }
  }, [user, fetchSubscription]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const refreshedUser = auth.currentUser;
      setUser(refreshedUser);
    }
  }, []);


  useEffect(() => {
    setMounted(true);
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchSubscription(currentUser.uid);
      } else {
        setSubscription(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchSubscription]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#15161f' }}>
        <Preloader />
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return <MissingConfiguration />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#15161f' }}>
        <Preloader />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, subscription, isSubscribed, refreshSubscription, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

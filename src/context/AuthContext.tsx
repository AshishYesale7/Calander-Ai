
'use client';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { Preloader } from '@/components/ui/Preloader';
import { AlertCircle } from 'lucide-react';
import { getUserSubscription } from '@/services/subscriptionService';
import { getUserProfile, createUserProfile } from '@/services/userService';
import type { UserSubscription, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

// The user object in the context will now be the combination of Auth user and Firestore profile
type AppUser = User & UserProfile;

// New type for the simplified user info we store for the switcher
interface KnownUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  subscription: UserSubscription | null;
  isSubscribed: boolean;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  refreshSubscription: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // New properties for account switching
  knownUsers: KnownUser[];
  addKnownUser: (user: User) => void;
  removeKnownUser: (uid: string) => void;
  switchUser: (email: string) => Promise<void>; // New function for switching
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isFirebaseConfigured = !!auth;

const KNOWN_USERS_STORAGE_KEY = 'future-sight-known-users';

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
  const [user, setUser] = useState<AppUser | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [knownUsers, setKnownUsers] = useState<KnownUser[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem(KNOWN_USERS_STORAGE_KEY);
      if (storedUsers) {
        setKnownUsers(JSON.parse(storedUsers));
      }
    }
  }, []);

  const addKnownUser = (userToAdd: User) => {
    setKnownUsers(prev => {
      const existingUser = prev.find(u => u.uid === userToAdd.uid);
      const newUserList = existingUser
        ? prev.map(u => u.uid === userToAdd.uid ? { ...u, displayName: userToAdd.displayName, photoURL: userToAdd.photoURL, email: userToAdd.email } : u)
        : [...prev, { uid: userToAdd.uid, email: userToAdd.email, displayName: userToAdd.displayName, photoURL: userToAdd.photoURL }];
        
      localStorage.setItem(KNOWN_USERS_STORAGE_KEY, JSON.stringify(newUserList));
      return newUserList;
    });
  };
  
  const removeKnownUser = (uid: string) => {
    setKnownUsers(prev => {
        const newUserList = prev.filter(u => u.uid !== uid);
        localStorage.setItem(KNOWN_USERS_STORAGE_KEY, JSON.stringify(newUserList));
        return newUserList;
    });
  };

  const isSubscribed = !!subscription && 
    (subscription.status === 'active' || subscription.status === 'trial') && 
    (subscription.endDate && new Date(subscription.endDate) > new Date());

  const fetchFullUserProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setUser(null);
      setSubscription(null);
      setOnboardingCompleted(true);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      const [profile, userSub] = await Promise.all([
        getUserProfile(firebaseUser.uid),
        getUserSubscription(firebaseUser.uid)
      ]);

      const userProfile = profile || await createUserProfile(firebaseUser);

      const fullUser = { ...firebaseUser, ...userProfile };
      setUser(fullUser);
      setSubscription(userSub);
      setOnboardingCompleted(userProfile.onboardingCompleted ?? false);

      // Add user to known users list upon successful full profile fetch
      addKnownUser(firebaseUser);

    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      if (auth) {
        await signOut(auth);
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await fetchFullUserProfile(auth.currentUser);
    }
  }, [fetchFullUserProfile]);

  const refreshSubscription = useCallback(async () => {
    if (user) {
      setDataLoading(true);
      try {
        const userSub = await getUserSubscription(user.uid);
        setSubscription(userSub);
      } catch (error) {
        console.error("Failed to fetch user subscription:", error);
        setSubscription(null);
      } finally {
        setDataLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await fetchFullUserProfile(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [fetchFullUserProfile]);

  const switchUser = async (email: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be signed in to switch accounts.", variant: "destructive" });
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: email });

    try {
      // Re-authenticate with the selected account. This will handle the sign-in flow.
      await reauthenticateWithPopup(user, provider);
      // The onAuthStateChanged listener will automatically handle updating the user context
      // and reloading the app state. We just need to give it a moment to complete.
      toast({ title: "Switching Accounts...", description: `Successfully signed in as ${email}.` });
      // Reloading the page is a robust way to ensure all context and data is fresh for the new user.
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Account switch error:", error);
       // If the user cancels the popup, it's not a "real" error we need to bother them with.
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      toast({ title: "Switch Failed", description: error.message || "Could not switch accounts.", variant: "destructive" });
    }
  };
  
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
  
  const loading = authLoading || dataLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#15161f' }}>
        <Preloader />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, subscription, isSubscribed, onboardingCompleted, setOnboardingCompleted, refreshSubscription, refreshUser, knownUsers, addKnownUser, removeKnownUser, switchUser }}>
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

    
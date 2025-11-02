

'use client';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut, GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { Preloader } from '@/components/ui/Preloader';
import { AlertCircle } from 'lucide-react';
import { getUserSubscription } from '@/services/subscriptionService';
import { getUserProfile, createUserProfile, updateUserProfile } from '@/services/userService';
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
  updateUserRole: (role: 'student' | 'professional') => void; // New function
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
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
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
      setOnboardingCompleted(true); // Guests don't need onboarding
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
      setOnboardingCompleted(userProfile.onboardingCompleted);

      addKnownUser(firebaseUser);

    } catch (error) {
      console.error("Failed to fetch full user profile:", error);
      // ** CHANGE **: Instead of signing out, we'll just log the error.
      // The user remains logged in with their existing session data.
      // This prevents logouts due to temporary network issues.
      toast({
        title: "Sync Error",
        description: "Could not fetch latest profile data. You are still logged in.",
        variant: "destructive"
      });
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  const refreshUser = useCallback(async () => {
    if (auth && auth.currentUser) {
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
    
    // Development bypass - provide mock user if enabled
    const devBypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
    if (devBypassAuth) {
      const mockUser: AppUser = {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        displayName: 'Development User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: 'mock-refresh-token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({
          token: 'mock-id-token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          signInProvider: 'mock',
          signInSecondFactor: null,
          claims: {},
        }),
        reload: async () => {},
        toJSON: () => ({}),
        // UserProfile properties
        userType: 'professional',
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
        deletionStatus: null,
      };
      
      setUser(mockUser);
      setSubscription({
        userId: 'dev-user-123',
        planId: 'pro',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        autoRenew: true,
      });
      setOnboardingCompleted(true);
      setAuthLoading(false);
      setDataLoading(false);
      return;
    }
    
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
    if (!auth) {
        toast({ title: "Error", description: "Authentication service is not available.", variant: "destructive" });
        return;
    }
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ login_hint: email, prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Switched Account", description: `Successfully signed in as ${email}.` });
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Account switch error:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        toast({ title: "Switch Cancelled", description: "You closed the sign-in window.", variant: "default" });
      } else {
        toast({ title: "Switch Failed", description: error.message || "Could not switch accounts.", variant: "destructive" });
      }
    }
  };

  const updateUserRole = async (role: 'student' | 'professional') => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { userType: role });
      toast({
        title: 'Role Switched!',
        description: `You are now in ${role} mode. The app will reload.`,
      });
      // Force a reload to apply all UI changes based on the new role
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not switch your role. Please try again.',
        variant: 'destructive',
      });
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
    <AuthContext.Provider value={{ user, loading, subscription, isSubscribed, onboardingCompleted, setOnboardingCompleted, refreshSubscription, refreshUser, updateUserRole, knownUsers, addKnownUser, removeKnownUser, switchUser }}>
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


'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCodingUsernames, saveCodingUsernames } from '@/services/userService';
import type { AllPlatformsUserData } from '@/ai/flows/fetch-coding-stats-flow';
import { allPlugins } from '@/data/plugins';
import CodefolioLogin from '@/components/extensions/codefolio/CodefolioLogin';

type Plugin = (typeof allPlugins)[0];

interface PluginContextType {
  activePlugin: Plugin | null;
  setActivePlugin: (plugin: Plugin | null) => void;
  closePlugin: () => void;
  isCodefolioLoggedIn: boolean;
  isCheckingLogin: boolean;
  handleCodefolioLogin: (data: AllPlatformsUserData) => void;
  isLoginViewActive: boolean; // New state to explicitly control login view
}

export const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const PluginProvider = ({ children }: { children: ReactNode }) => {
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);
  const [isCodefolioLoggedIn, setIsCodefolioLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [isLoginViewActive, setIsLoginViewActive] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkLoginStatus = useCallback(async () => {
    if (!user) {
      setIsCodefolioLoggedIn(false);
      setIsCheckingLogin(false);
      return;
    }
    setIsCheckingLogin(true);
    try {
      const data = await getCodingUsernames(user.uid);
      const hasUsernames = data && Object.values(data).some(v => v);
      setIsCodefolioLoggedIn(!!hasUsernames);
    } catch (error) {
      console.error("Failed to check Codefolio login status:", error);
      setIsCodefolioLoggedIn(false);
    } finally {
      setIsCheckingLogin(false);
    }
  }, [user]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  const handleOpenPlugin = useCallback((plugin: Plugin | null) => {
    if (plugin?.name === 'Codefolio Ally') {
      if (isCheckingLogin) return; // Don't do anything while checking
      if (isCodefolioLoggedIn) {
        setActivePlugin(plugin);
        setIsLoginViewActive(false);
      } else {
        // Show login component if not logged in
        setActivePlugin(null); // No active plugin, but show the login view
        setIsLoginViewActive(true);
      }
    } else {
      setActivePlugin(plugin);
      setIsLoginViewActive(false);
    }
  }, [isCodefolioLoggedIn, isCheckingLogin]);

  const handleCodefolioLogin = useCallback((data: AllPlatformsUserData) => {
    if (!user) {
      toast({ title: "Error", description: "You must be signed in to save usernames.", variant: "destructive" });
      return;
    }
    const usernamesToSave = {
      codeforces: data.codeforces?.username,
      leetcode: data.leetcode?.username,
      codechef: data.codechef?.username,
    };
    const definedUsernames = Object.fromEntries(
      Object.entries(usernamesToSave).filter(([, value]) => value !== undefined && value !== null)
    );

    saveCodingUsernames(user.uid, definedUsernames).then(() => {
      setIsCodefolioLoggedIn(true);
      setIsLoginViewActive(false);
      setActivePlugin(allPlugins.find(p => p.name === 'Codefolio Ally')!);
      toast({ title: "Success", description: "Usernames saved and data fetched!" });
    }).catch(err => {
      toast({ title: "Error", description: `Could not save usernames: ${err.message}`, variant: "destructive" });
    });
  }, [user, toast]);

  const closePlugin = useCallback(() => {
    setActivePlugin(null);
    setIsLoginViewActive(false);
    checkLoginStatus(); // Re-check login status when a plugin is closed
  }, [checkLoginStatus]);

  return (
    <PluginContext.Provider value={{ 
        activePlugin, 
        setActivePlugin: handleOpenPlugin, 
        closePlugin,
        isCodefolioLoggedIn,
        isCheckingLogin,
        handleCodefolioLogin,
        isLoginViewActive
    }}>
      {children}
    </PluginContext.Provider>
  );
};

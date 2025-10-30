
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCodingUsernames, saveCodingUsernames, getInstalledPlugins, saveInstalledPlugins } from '@/services/userService';
import type { AllPlatformsUserData } from '@/ai/flows/fetch-coding-stats-flow';
import { allPlugins, DEFAULT_PLUGINS } from '@/data/plugins';
import CodefolioLogin from '@/components/extensions/codefolio/CodefolioLogin';

type Plugin = (typeof allPlugins)[0];

interface PluginContextType {
  activePlugin: Plugin | null;
  setActivePlugin: (plugin: Plugin | null) => void;
  closePlugin: () => void;
  isCodefolioLoggedIn: boolean;
  isCheckingLogin: boolean;
  handleCodefolioLogin: (data: AllPlatformsUserData) => void;
  isLoginViewActive: boolean;
  openLoginView: () => void;
  installedPlugins: Set<string>;
  installPlugin: (pluginName: string) => Promise<void>;
  uninstallPlugin: (pluginName: string) => Promise<void>;
}

export const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const PluginProvider = ({ children }: { children: ReactNode }) => {
  const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);
  const [isCodefolioLoggedIn, setIsCodefolioLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [isLoginViewActive, setIsLoginViewActive] = useState(false);
  const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set(DEFAULT_PLUGINS));
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
    if (user) {
      checkLoginStatus();
      getInstalledPlugins(user.uid).then(plugins => {
        if (plugins !== null) {
          setInstalledPlugins(new Set(plugins));
        } else {
          const defaultSet = new Set(DEFAULT_PLUGINS);
          setInstalledPlugins(defaultSet);
          saveInstalledPlugins(user.uid, Array.from(defaultSet));
        }
      });
    } else {
        setInstalledPlugins(new Set(DEFAULT_PLUGINS));
    }
  }, [user, checkLoginStatus]);

  const updatePluginsInDb = async (newPluginSet: Set<string>) => {
    if (user) {
      try {
        await saveInstalledPlugins(user.uid, Array.from(newPluginSet));
      } catch (error) {
        toast({ title: "Sync Error", description: "Could not save plugin changes to the cloud.", variant: "destructive" });
        // Optional: revert state if DB save fails
        getInstalledPlugins(user.uid).then(plugins => {
          if (plugins) setInstalledPlugins(new Set(plugins));
        });
      }
    }
  };

  const installPlugin = async (pluginName: string) => {
    const newSet = new Set(installedPlugins).add(pluginName);
    setInstalledPlugins(newSet);
    toast({ title: "Plugin Installed", description: `${pluginName} has been added.` });
    await updatePluginsInDb(newSet);
  };

  const uninstallPlugin = async (pluginName: string) => {
    const newSet = new Set(installedPlugins);
    newSet.delete(pluginName);
    setInstalledPlugins(newSet);
    toast({ title: "Plugin Uninstalled", description: `${pluginName} has been removed.` });
    await updatePluginsInDb(newSet);
  };
  
  const openLoginView = useCallback(() => {
    setActivePlugin(null);
    setIsLoginViewActive(true);
  }, []);

  const handleOpenPlugin = useCallback((plugin: Plugin | null) => {
    if (plugin?.name === 'Codefolio Ally') {
      if (isCheckingLogin) return; 
      if (isCodefolioLoggedIn) {
        setActivePlugin(plugin);
        setIsLoginViewActive(false);
      } else {
        openLoginView();
      }
    } else {
      setActivePlugin(plugin);
      setIsLoginViewActive(false);
    }
  }, [isCodefolioLoggedIn, isCheckingLogin, openLoginView]);

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
    checkLoginStatus(); 
  }, [checkLoginStatus]);

  return (
    <PluginContext.Provider value={{ 
        activePlugin, 
        setActivePlugin: handleOpenPlugin, 
        closePlugin,
        isCodefolioLoggedIn,
        isCheckingLogin,
        handleCodefolioLogin,
        isLoginViewActive,
        openLoginView,
        installedPlugins,
        installPlugin,
        uninstallPlugin,
    }}>
      {children}
    </PluginContext.Provider>
  );
};

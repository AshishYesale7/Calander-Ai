
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '@/services/userService';

type Theme = 'light' | 'dark';
type CustomTheme = Record<string, string>;
export type GlassEffect = 'frosted' | 'water-droplets' | 'subtle-shadow' | 'grainyFrosted';

// NEW Type for settings
export interface GlassEffectSettings {
  frosted: {
    blur: number; // in pixels
  };
  waterDroplets: {
    blur: number; // in pixels
    saturate: number; // in percent
    brightness: number; // in percent
  };
  subtleShadow: {
    opacity: number; // 0 to 1
  };
  grainyFrosted: {
    blur: number; // in pixels
    noiseOpacity: number; // 0 to 1
  };
}

const THEME_STORAGE_KEY = 'futuresight-theme';
const BACKGROUND_IMAGE_STORAGE_KEY = 'futuresight-background-image';
const BACKGROUND_COLOR_STORAGE_KEY = 'futuresight-background-color';
const BACKGROUND_VIDEO_STORAGE_KEY = 'futuresight-background-video';
const CUSTOM_THEME_STORAGE_KEY = 'futuresight-custom-theme';
const GLASS_EFFECT_STORAGE_KEY = 'futuresight-glass-effect';
const GLASS_SETTINGS_STORAGE_KEY = 'futuresight-glass-settings';
const DEFAULT_BACKGROUND_IMAGE = 'https://r4.wallpaperflare.com/wallpaper/126/117/95/quote-motivational-digital-art-typography-wallpaper-5856bc0a6f2cf779de90d962a2d90bb0.jpg';

const DEFAULT_GLASS_EFFECT_SETTINGS: GlassEffectSettings = {
  frosted: { blur: 16 },
  waterDroplets: { blur: 6, saturate: 180, brightness: 90 },
  subtleShadow: { opacity: 0.15 },
  grainyFrosted: { blur: 10, noiseOpacity: 0.05 },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  backgroundImage: string | null;
  setBackgroundImage: (url: string | null) => void;
  backgroundColor: string | null;
  setBackgroundColor: (color: string | null) => void;
  backgroundVideo: string | null;
  setBackgroundVideo: (url: string | null) => void;
  customTheme: CustomTheme | null;
  setCustomTheme: (theme: CustomTheme | null) => void;
  glassEffect: GlassEffect;
  setGlassEffect: (effect: GlassEffect) => void;
  glassEffectSettings: GlassEffectSettings;
  setGlassEffectSettings: (settings: GlassEffectSettings) => void;
  resetCustomizations: () => void;
  isMounted: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      return defaultValue;
    }
    const parsedValue = JSON.parse(storedValue);
    if (typeof defaultValue === 'object' && defaultValue !== null && typeof parsedValue === 'object' && parsedValue !== null) {
      return { ...defaultValue, ...parsedValue };
    }
    return parsedValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};


export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => getInitialState<Theme>(THEME_STORAGE_KEY, 'dark'));
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_IMAGE_STORAGE_KEY, DEFAULT_BACKGROUND_IMAGE));
  const [backgroundColor, setBackgroundColorState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_COLOR_STORAGE_KEY, null));
  const [backgroundVideo, setBackgroundVideoState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_VIDEO_STORAGE_KEY, null));
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(() => getInitialState<CustomTheme | null>(CUSTOM_THEME_STORAGE_KEY, null));
  const [glassEffect, setGlassEffectState] = useState<GlassEffect>(() => getInitialState<GlassEffect>(GLASS_EFFECT_STORAGE_KEY, 'water-droplets'));
  const [glassEffectSettings, setGlassEffectSettingsState] = useState<GlassEffectSettings>(() => getInitialState<GlassEffectSettings>(GLASS_SETTINGS_STORAGE_KEY, DEFAULT_GLASS_EFFECT_SETTINGS));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch cover photo on user change
  useEffect(() => {
      if (user) {
          getUserProfile(user.uid).then(profile => {
              if (profile && profile.coverPhotoURL) {
                  // Determine if the URL is a video or image
                  if (profile.coverPhotoURL.match(/\.(mp4|webm|mov)$/i)) {
                    setBackgroundVideoState(profile.coverPhotoURL);
                    setBackgroundImageState(null);
                  } else {
                    setBackgroundImageState(profile.coverPhotoURL);
                    setBackgroundVideoState(null);
                  }
              } else {
                  // If user has no cover photo, fall back to locally stored or default.
                  const localBg = getInitialState<string | null>(BACKGROUND_IMAGE_STORAGE_KEY, DEFAULT_BACKGROUND_IMAGE);
                  setBackgroundImageState(localBg);
                  setBackgroundVideoState(null);
              }
          });
      }
  }, [user]);

  const setItemInStorage = <T,>(key: string, value: T | null) => {
    if (isMounted) {
      if (typeof value === 'string' && value.startsWith('data:')) {
        return;
      }

      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Error setting localStorage key “${key}”:`, error);
        }
      }
    }
  };

  useEffect(() => setItemInStorage(THEME_STORAGE_KEY, theme), [theme, isMounted]);
  useEffect(() => setItemInStorage(BACKGROUND_IMAGE_STORAGE_KEY, backgroundImage), [backgroundImage, isMounted]);
  useEffect(() => setItemInStorage(BACKGROUND_VIDEO_STORAGE_KEY, backgroundVideo), [backgroundVideo, isMounted]);
  useEffect(() => setItemInStorage(BACKGROUND_COLOR_STORAGE_KEY, backgroundColor), [backgroundColor, isMounted]);
  useEffect(() => setItemInStorage(CUSTOM_THEME_STORAGE_KEY, customTheme), [customTheme, isMounted]);
  useEffect(() => setItemInStorage(GLASS_EFFECT_STORAGE_KEY, glassEffect), [glassEffect, isMounted]);
  useEffect(() => setItemInStorage(GLASS_SETTINGS_STORAGE_KEY, glassEffectSettings), [glassEffectSettings, isMounted]);


  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);
  
  const setBackgroundImage = useCallback((url: string | null) => {
    setBackgroundImageState(url);
    setBackgroundColorState(null);
    setBackgroundVideoState(null);
    if (user && (!url || !url.startsWith('data:'))) { // Only sync remote URLs
        updateUserProfile(user.uid, { coverPhotoURL: url }).catch(err => console.error("Failed to sync background to profile", err));
    }
  }, [user]);
  
  const setBackgroundColor = useCallback((color: string | null) => {
    setBackgroundColorState(color);
    setBackgroundImageState(null);
    setBackgroundVideoState(null);
     if (user) {
        updateUserProfile(user.uid, { coverPhotoURL: null }).catch(err => console.error("Failed to sync background to profile", err));
    }
  }, [user]);

  const setBackgroundVideo = useCallback((url: string | null) => {
    setBackgroundVideoState(url);
    setBackgroundImageState(null);
    setBackgroundColorState(null);
    if (user && (!url || !url.startsWith('data:'))) { // Only sync remote URLs
        updateUserProfile(user.uid, { coverPhotoURL: url }).catch(err => console.error("Failed to sync video background to profile", err));
    }
  }, [user]);
  
  const setCustomTheme = useCallback((theme: CustomTheme | null) => {
    setCustomThemeState(theme);
  }, []);

  const setGlassEffect = useCallback((effect: GlassEffect) => {
    setGlassEffectState(effect);
  }, []);

  const setGlassEffectSettings = useCallback((settings: GlassEffectSettings) => {
    setGlassEffectSettingsState(settings);
  }, []);

  const resetCustomizations = useCallback(() => {
    setBackgroundImageState(DEFAULT_BACKGROUND_IMAGE);
    setBackgroundColorState(null);
    setBackgroundVideoState(null);
    setCustomThemeState(null);
    setGlassEffectState('frosted');
    setGlassEffectSettingsState(DEFAULT_GLASS_EFFECT_SETTINGS);
    if (user) {
        updateUserProfile(user.uid, { coverPhotoURL: DEFAULT_BACKGROUND_IMAGE }).catch(err => console.error("Failed to reset profile background", err));
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, toggleTheme, 
      backgroundImage, setBackgroundImage, 
      backgroundColor, setBackgroundColor,
      backgroundVideo, setBackgroundVideo,
      customTheme, setCustomTheme,
      glassEffect, setGlassEffect,
      glassEffectSettings, setGlassEffectSettings,
      resetCustomizations,
      isMounted 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

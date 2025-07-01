'use client';

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
const CUSTOM_THEME_STORAGE_KEY = 'futuresight-custom-theme';
const GLASS_EFFECT_STORAGE_KEY = 'futuresight-glass-effect';
const GLASS_SETTINGS_STORAGE_KEY = 'futuresight-glass-settings';
const DEFAULT_BACKGROUND_IMAGE = 'https://r4.wallpaperflare.com/wallpaper/113/431/804/science-fiction-digital-art-concept-art-artwork-fantasy-art-hd-wallpaper-68368da8e0100c58d06ca1fec8e2e4fa.jpg';

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
  const [theme, setThemeState] = useState<Theme>(() => getInitialState<Theme>(THEME_STORAGE_KEY, 'dark'));
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_IMAGE_STORAGE_KEY, DEFAULT_BACKGROUND_IMAGE));
  const [backgroundColor, setBackgroundColorState] = useState<string | null>(() => getInitialState<string | null>(BACKGROUND_COLOR_STORAGE_KEY, null));
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(() => getInitialState<CustomTheme | null>(CUSTOM_THEME_STORAGE_KEY, null));
  const [glassEffect, setGlassEffectState] = useState<GlassEffect>(() => getInitialState<GlassEffect>(GLASS_EFFECT_STORAGE_KEY, 'water-droplets'));
  const [glassEffectSettings, setGlassEffectSettingsState] = useState<GlassEffectSettings>(() => getInitialState<GlassEffectSettings>(GLASS_SETTINGS_STORAGE_KEY, DEFAULT_GLASS_EFFECT_SETTINGS));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setItemInStorage = <T,>(key: string, value: T | null) => {
    if (isMounted) {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  };

  useEffect(() => setItemInStorage(THEME_STORAGE_KEY, theme), [theme, isMounted]);
  useEffect(() => setItemInStorage(BACKGROUND_IMAGE_STORAGE_KEY, backgroundImage), [backgroundImage, isMounted]);
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
    // When a new image is set, it becomes the source of truth.
    // The color must be cleared to allow the image to be visible.
    setBackgroundImageState(url);
    setBackgroundColorState(null);
  }, []);
  
  const setBackgroundColor = useCallback((color: string | null) => {
    // When a color is set, it becomes the source of truth.
    // The image must be cleared to allow the color to be visible.
    setBackgroundColorState(color);
    setBackgroundImageState(null);
  }, []);
  
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
    // Reset restores the default image and clears any custom color.
    setBackgroundImageState(DEFAULT_BACKGROUND_IMAGE);
    setBackgroundColorState(null);
    setCustomThemeState(null);
    setGlassEffectState('frosted');
    setGlassEffectSettingsState(DEFAULT_GLASS_EFFECT_SETTINGS);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, toggleTheme, 
      backgroundImage, setBackgroundImage, 
      backgroundColor, setBackgroundColor,
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

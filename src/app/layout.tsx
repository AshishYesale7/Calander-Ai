'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { usePathname } from 'next/navigation';
import type { ReactNode} from 'react';
import { useEffect } from 'react';
import { ApiKeyProvider } from '@/context/ApiKeyContext';
import { TimezoneProvider } from '@/context/TimezoneContext';

function AppThemeApplicator({ children }: { children: ReactNode }) {
  const { 
    theme: userPreferredTheme, 
    backgroundImage, 
    backgroundColor, 
    customTheme, 
    glassEffect, 
    glassEffectSettings, 
    isMounted 
  } = useTheme();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth/');

  useEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      
      // 1. Set Light/Dark mode class
      root.classList.remove('light', 'dark');
      const themeClass = isAuthPage ? 'dark' : userPreferredTheme;
      if (typeof themeClass === 'string') {
        root.classList.add(themeClass);
      }
      
      // 2. Apply custom theme colors as CSS variables
      if (customTheme) {
        Object.entries(customTheme).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      } else {
        // Clear custom theme variables when not in use
        const themeKeys = ['--background', '--foreground', '--card', '--primary', '--accent']; // Add all your theme keys here
        themeKeys.forEach(key => root.style.removeProperty(key));
      }

      // 3. Apply background color first
      document.body.style.backgroundColor = backgroundColor || '';

      // 4. Apply background image, which will sit on top of the color
      if (backgroundImage) {
        document.body.style.backgroundImage = `url("${backgroundImage}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = '';
      }

      // 5. Apply glass effect data attribute
      if (glassEffect) {
        root.setAttribute('data-glass-effect', glassEffect);
      } else {
        root.removeAttribute('data-glass-effect');
      }
      
      // 6. Apply dynamic glass effect settings as CSS variables
      if (glassEffectSettings) {
        // Check for each setting property before applying to prevent runtime errors
        if (glassEffectSettings.frosted) {
          root.style.setProperty('--glass-blur', `${glassEffectSettings.frosted.blur}px`);
        }
        if (glassEffectSettings.waterDroplets) {
          root.style.setProperty('--glass-saturate', `${glassEffectSettings.waterDroplets.saturate / 100}`);
          root.style.setProperty('--glass-brightness', `${glassEffectSettings.waterDroplets.brightness / 100}`);
        }
        if (glassEffectSettings.subtleShadow) {
          root.style.setProperty('--shadow-opacity', `${glassEffectSettings.subtleShadow.opacity}`);
        }
        if (glassEffectSettings.grainyFrosted) {
          root.style.setProperty('--grainy-blur', `${glassEffectSettings.grainyFrosted.blur}px`);
          root.style.setProperty('--grainy-noise-opacity', `${glassEffectSettings.grainyFrosted.noiseOpacity}`);
        }
      }

    }
  }, [pathname, userPreferredTheme, isAuthPage, backgroundImage, backgroundColor, customTheme, glassEffect, glassEffectSettings, isMounted]);

  // Clean up body styles on unmount or if background is removed
  useEffect(() => {
    return () => {
      if (isMounted) {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '';
      }
    };
  }, [isMounted]);

  // Effect to register the Firebase messaging service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      
      // Ensure all firebase config values are present before registering
      if (Object.values(firebaseConfig).every(Boolean)) {
        const queryParams = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
        const swUrl = `/firebase-messaging-sw.js?${queryParams}`;

        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('Firebase service worker registered with scope:', registration.scope);
          })
          .catch(err => {
            console.error('Service worker registration failed:', err);
          });
      } else {
        console.warn("Firebase configuration is incomplete. Service worker not registered.");
      }
    }
  }, []);

  // Effect to disable right-click, copy, and certain keyboard shortcuts
  useEffect(() => {
    const disabledEvent = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
        return false;
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
        // "I" key (Ctrl+Shift+I)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            disabledEvent(e);
        }
        // "J" key (Ctrl+Shift+J)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            disabledEvent(e);
        }
        // "S" key (Ctrl+S or Cmd+S)
        if (e.keyCode === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            disabledEvent(e);
        }
        // "U" key (Ctrl+U)
        if (e.ctrlKey && e.keyCode === 85) {
            disabledEvent(e);
        }
        // "F12" key
        if (e.keyCode === 123) {
            disabledEvent(e);
        }
        // "C" key (Ctrl+C)
        if (e.ctrlKey && e.keyCode === 67) {
            disabledEvent(e);
        }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown, false);

    return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCut);
        document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, []);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const faviconSvg = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color: rgba(255,255,255,0.4)" />
          <stop offset="100%" style="stop-color: rgba(200,200,255,0.1)" />
        </linearGradient>
        <linearGradient id="topBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: rgba(255,160,122,0.8)" />
          <stop offset="100%" style="stop-color: rgba(255,140,105,0.6)" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="15" fill="rgba(40, 40, 60, 0.8)"/>
      <rect x="10" y="10" width="80" height="80" rx="15" fill="url(#glassGradient)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1.5"/>
      <path d="M10 25 C10 16.7157 16.7157 10 25 10 H 75 C 83.2843 10 90 16.7157 90 25 V 30 H 10 Z" fill="url(#topBarGradient)"/>
      <circle cx="25" cy="20" r="3" fill="rgba(255,255,255,0.5)" />
      <circle cx="75" cy="20" r="3" fill="rgba(255,255,255,0.5)" />
      <text x="50" y="68" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle">24</text>
    </svg>
  `;
  const faviconDataUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Calendar.ai</title>
        <meta name="description" content="Your AI-powered calendar and planning assistant." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href={faviconDataUrl} />
        <link rel="shortcut icon" href={faviconDataUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ApiKeyProvider>
              <TimezoneProvider>
                <AppThemeApplicator>
                  {children}
                  <Toaster />
                </AppThemeApplicator>
              </TimezoneProvider>
            </ApiKeyProvider>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

  
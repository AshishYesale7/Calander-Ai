
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


  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Calendar.ai</title>
        <meta name="description" content="Your AI-powered calendar and planning assistant." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ApiKeyProvider>
              <AppThemeApplicator>
                {children}
                <Toaster />
              </AppThemeApplicator>
            </ApiKeyProvider>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

// Official Provider Icons Component
// This component provides consistent official icons for all AI providers across the webapp

import React from 'react';
import { cn } from '@/lib/utils';

interface ProviderIconProps {
  provider: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export function ProviderIcon({ provider, size = 'md', className }: ProviderIconProps) {
  const sizeClass = sizeClasses[size];
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="currentColor"
              d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
            />
          </svg>
        </div>
      );

    case 'anthropic':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-orange-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#D97706"
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#D97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'google':
    case 'gemini':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
      );

    case 'mistral':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-orange-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#FF7000"
              d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.5L18.5 8v8L12 19.5 5.5 16V8L12 4.5z"
            />
            <circle cx="12" cy="12" r="3" fill="#FF7000" />
          </svg>
        </div>
      );

    case 'perplexity':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-blue-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#1FB6FF"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        </div>
      );

    case 'meta':
    case 'llama':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-blue-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#1877F2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        </div>
      );

    case 'xai':
    case 'grok':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-black rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="white"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
        </div>
      );

    case 'moonshot':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-purple-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#8B5CF6"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        </div>
      );

    case 'qwen':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-red-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#DC2626"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
            />
          </svg>
        </div>
      );

    case 'deepseek':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-indigo-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#4F46E5"
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#4F46E5"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    // MCP Service Icons
    case 'google-calendar':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#4285F4"
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
            />
          </svg>
        </div>
      );

    case 'gmail':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#EA4335"
              d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
            />
          </svg>
        </div>
      );

    case 'notion':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#000000"
              d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
            />
          </svg>
        </div>
      );

    case 'slack':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#E01E5A"
              d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"
            />
            <path
              fill="#36C5F0"
              d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
            />
            <path
              fill="#2EB67D"
              d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"
            />
            <path
              fill="#ECB22E"
              d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
            />
            <path
              fill="#E01E5A"
              d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z"
            />
            <path
              fill="#36C5F0"
              d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
            />
            <path
              fill="#2EB67D"
              d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z"
            />
            <path
              fill="#ECB22E"
              d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
            />
          </svg>
        </div>
      );

    case 'github':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#181717"
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
        </div>
      );

    case 'linear':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#5E6AD2"
              d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-3.288 3.288-3.288-3.288a1.2 1.2 0 0 1 1.697-1.697L12 6.151l-.689.312a1.2 1.2 0 0 1 1.697 1.697z"
            />
          </svg>
        </div>
      );

    case 'discord':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#5865F2"
              d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"
            />
          </svg>
        </div>
      );

    case 'google-drive':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path fill="#0F9D58" d="m10 16 4 4H6l-4-4z"/>
            <path fill="#F1C232" d="m20 16-4-4H8l4 4z"/>
            <path fill="#4285F4" d="M8 12 4 6h8l4 6z"/>
          </svg>
        </div>
      );

    case 'onedrive':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#0078D4"
              d="M18.71 8.21a5.78 5.78 0 00-10.74.6 3.75 3.75 0 00-.26 7.52h9.43a4.28 4.28 0 001.57-8.12z"
            />
          </svg>
        </div>
      );

    case 'dropbox':
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#0061FF"
              d="M6 2L12 6 6 10l-6-4zm6 4l6-4 6 4-6 4zm6 8l-6 4-6-4 6-4zm-6 4l-6-4-6 4 6 4z"
            />
          </svg>
        </div>
      );

    default:
      // Fallback generic AI icon
      return (
        <div className={cn(sizeClass, 'flex items-center justify-center bg-gray-100 rounded', className)}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              fill="#6B7280"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        </div>
      );
  }
}

// Utility function to get provider display name
export function getProviderDisplayName(provider: string): string {
  const displayNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'gemini': 'Gemini',
    'mistral': 'Mistral',
    'perplexity': 'Perplexity',
    'meta': 'Meta',
    'llama': 'Llama',
    'xai': 'xAI',
    'grok': 'Grok',
    'moonshot': 'Moonshot AI',
    'qwen': 'Qwen',
    'deepseek': 'DeepSeek',
    'google-calendar': 'Google Calendar',
    'gmail': 'Gmail',
    'notion': 'Notion',
    'slack': 'Slack',
    'github': 'GitHub',
    'linear': 'Linear',
    'discord': 'Discord',
    'google-drive': 'Google Drive',
    'onedrive': 'OneDrive',
    'dropbox': 'Dropbox'
  };
  
  return displayNames[provider.toLowerCase()] || provider;
}

// Utility function to get provider color theme
export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    'openai': 'text-green-600',
    'anthropic': 'text-orange-600',
    'google': 'text-blue-600',
    'gemini': 'text-blue-600',
    'mistral': 'text-orange-600',
    'perplexity': 'text-blue-600',
    'meta': 'text-blue-600',
    'xai': 'text-black',
    'moonshot': 'text-purple-600',
    'qwen': 'text-red-600',
    'deepseek': 'text-indigo-600',
    'gmail': 'text-red-600',
    'google-calendar': 'text-blue-600',
    'notion': 'text-black',
    'slack': 'text-purple-600',
    'github': 'text-gray-800',
    'linear': 'text-indigo-600',
    'discord': 'text-indigo-600'
  };
  
  return colors[provider.toLowerCase()] || 'text-gray-600';
}
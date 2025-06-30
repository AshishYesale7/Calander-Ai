
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PreloaderProps {
  className?: string;
}

export function Preloader({ className }: PreloaderProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg xmlns="http://www.w3.org/2000/svg" width="59.072" height="26.388" viewBox="0 0 59.072 26.388">
        <defs>
            <linearGradient id="preloader-grad1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#705bff" />
              <stop offset="33%" stopColor="#322c7e" />
              <stop offset="67%" stopColor="#7881da" />
              <stop offset="100%" stopColor="#52dfac" />
            </linearGradient>
            <linearGradient id="preloader-grad2" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#e23838" />
              <stop offset="33%" stopColor="#973999" />
              <stop offset="67%" stopColor="#009cdf" />
              <stop offset="100%" stopColor="#5ebd3e" />
            </linearGradient>
        </defs>
        {/* Background Path */}
        <path className="preloader-path-bg" stroke="url(#preloader-grad1)" d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z" transform="translate(-268.104 -242.681)" />
        {/* Animated Path */}
        <path className="preloader-path-animated" stroke="url(#preloader-grad2)" d="M281.3,267.819a11.944,11.944,0,0,1,0-23.888c10.85,0,21.834,23.888,32.684,23.888a11.944,11.944,0,0,0,0-23.888C303.171,243.931,292.109,267.819,281.3,267.819Z" transform="translate(-268.104 -242.681)" />
      </svg>
    </div>
  );
}

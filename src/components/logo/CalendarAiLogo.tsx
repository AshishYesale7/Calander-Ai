import { cn } from '@/lib/utils';

export const CalendarAiLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-8 w-8", className)}
    aria-label="Career Calender Logo"
  >
    <defs>
      <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.4)' }} />
        <stop offset="100%" style={{ stopColor: 'rgba(200,200,255,0.1)' }} />
      </linearGradient>
      <linearGradient id="topBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'rgba(255,160,122,0.8)' }} />
        <stop offset="100%" style={{ stopColor: 'rgba(255,140,105,0.6)' }} />
      </linearGradient>
      <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      </filter>
      <clipPath id="clipPath">
        <rect x="10" y="10" width="80" height="80" rx="15" />
      </clipPath>
    </defs>

    <rect
      x="10"
      y="10"
      width="80"
      height="80"
      rx="15"
      fill="rgba(150, 150, 180, 0.1)"
      filter="url(#blurFilter)"
    />

    <rect
      x="10"
      y="10"
      width="80"
      height="80"
      rx="15"
      fill="url(#glassGradient)"
      stroke="rgba(255, 255, 255, 0.3)"
      strokeWidth="1.5"
    />

    <path
      d="M10 25 C10 16.7157 16.7157 10 25 10 H 75 C 83.2843 10 90 16.7157 90 25 V 30 H 10 Z"
      fill="url(#topBarGradient)"
    />

    <circle cx="25" cy="20" r="3" fill="rgba(255,255,255,0.5)" />
    <circle cx="75" cy="20" r="3" fill="rgba(255,255,255,0.5)" />

    <text
      x="50"
      y="68"
      fontFamily="Arial, sans-serif"
      fontSize="40"
      fontWeight="bold"
      fill="white"
      textAnchor="middle"
      style={{
        textShadow: '0px 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      24
    </text>

    <path
      d="M11 11 H 89 C 83,25 70,85 11,89 Z"
      fill="rgba(255,255,255,0.15)"
      clipPath="url(#clipPath)"
      style={{ filter: 'blur(1px)' }}
    />
  </svg>
);

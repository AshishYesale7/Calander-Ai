
'use client';
import { cn } from '@/lib/utils';

export const PixelMonsterLogo = ({ className }: { className?: string }) => (
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={cn("h-16 w-16", className)} style={{ imageRendering: 'pixelated' }}>
        <rect fill="#a855f7" x="24" y="16" width="16" height="8"/>
        <rect fill="#a855f7" x="16" y="24" width="32" height="8"/>
        <rect fill="#a855f7" x="8" y="32" width="48" height="8"/>
        <rect fill="#a855f7" x="16" y="40" width="8" height="8"/>
        <rect fill="#a855f7" x="40" y="40" width="8" height="8"/>
        <rect fill="white" x="24" y="24" width="8" height="8"/>
        <rect fill="white" x="40" y="24" width="8" height="8"/>
        <rect fill="#a855f7" x="0" y="24" width="8" height="8"/>
        <rect fill="#a855f7" x="56" y="24" width="8" height="8"/>
    </svg>
);

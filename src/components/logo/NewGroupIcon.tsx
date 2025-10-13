
'use client';
import { cn } from '@/lib/utils';

export const NewGroupIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        <path d="M20.49 16.51c.31-.25.51-.62.51-1.01V13h-2v2.51c0 .4-.2.76-.51 1.01l-4.5 3.51L16 22l4.49-3.49z"/>
        <path d="M3.51 16.51c-.31-.25-.51-.62-.51-1.01V13h2v2.51c0 .4.2.76.51 1.01l4.5 3.51L8 22l-4.49-3.49z"/>
    </svg>
);


'use client';
import { cn } from '@/lib/utils';

export const ChatIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)}>
        <path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM13 14H11V12H13V14ZM13 10H11V6H13V10Z" />
    </svg>
);

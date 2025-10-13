'use client';
import { cn } from '@/lib/utils';

export const UpdatesIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)}>
        <circle cx="12" cy="12" r="10" />
    </svg>
);

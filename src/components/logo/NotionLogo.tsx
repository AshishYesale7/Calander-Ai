
import { cn } from '@/lib/utils';

export const NotionLogo = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 256 256" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMidYMid" 
        className={cn("h-12 w-12", className)}
    >
        <path d="M116.333 216h23.333V40h-23.333v176Zm-56-11.667h23.333V51.667H60.333v152.666Zm112 0h23.333V51.667h-23.333v152.666Z" fill="currentColor"></path>
    </svg>
);

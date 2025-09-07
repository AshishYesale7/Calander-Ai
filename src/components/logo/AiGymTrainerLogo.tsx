
import { cn } from '@/lib/utils';
import { Dumbbell } from 'lucide-react';

export const AiGymTrainerLogo = ({ className }: { className?: string }) => (
    <Dumbbell className={cn("h-12 w-12", className)} />
);

    
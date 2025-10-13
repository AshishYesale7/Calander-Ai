
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Sparkles, User, UserCheck } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface CustomizeAvatarModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (newAvatarUrl: string) => void;
}

const MALE_AVATAR_URL = 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=626&ext=jpg&ga=GA1.1.2082379227.1717027200&semt=sph';
const FEMALE_AVATAR_URL = 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436185.jpg?size=626&ext=jpg';


export default function CustomizeAvatarModal({ isOpen, onOpenChange, onSave }: CustomizeAvatarModalProps) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedGender) return;
    setIsSaving(true);
    const avatarUrl = selectedGender === 'male' ? MALE_AVATAR_URL : FEMALE_AVATAR_URL;
    await onSave(avatarUrl);
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            <Sparkles className="mr-2 h-5 w-5" /> Customize Your Avatar
          </DialogTitle>
          <DialogDescription>
            Choose a base avatar to represent you across the app.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
                <button 
                    onClick={() => setSelectedGender('male')}
                    className={cn(
                        "rounded-full border-4 p-1 transition-all duration-200",
                        selectedGender === 'male' ? 'border-accent' : 'border-transparent hover:border-accent/50'
                    )}
                >
                    <Avatar className="h-28 w-28">
                        <AvatarImage src={MALE_AVATAR_URL} alt="Male Avatar" />
                        <AvatarFallback><User/></AvatarFallback>
                    </Avatar>
                </button>
                <span className={cn("font-semibold text-sm", selectedGender === 'male' ? 'text-accent' : 'text-muted-foreground')}>Male</span>
            </div>
             <div className="flex flex-col items-center gap-2">
                <button 
                    onClick={() => setSelectedGender('female')}
                    className={cn(
                        "rounded-full border-4 p-1 transition-all duration-200",
                        selectedGender === 'female' ? 'border-accent' : 'border-transparent hover:border-accent/50'
                    )}
                >
                    <Avatar className="h-28 w-28">
                        <AvatarImage src={FEMALE_AVATAR_URL} alt="Female Avatar" />
                        <AvatarFallback><User/></AvatarFallback>
                    </Avatar>
                </button>
                <span className={cn("font-semibold text-sm", selectedGender === 'female' ? 'text-accent' : 'text-muted-foreground')}>Female</span>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
           <Button onClick={handleSave} disabled={!selectedGender || isSaving}>
            {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : <UserCheck className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Avatar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

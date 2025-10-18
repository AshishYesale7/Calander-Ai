
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkUsernameAvailability, updateUserProfile } from '@/services/userService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  Bell,
  Camera,
  Check,
  CheckCircle,
  Link as LinkIcon,
  MapPin,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  onFinish: () => void;
}

const slideVariants = {
  hidden: { opacity: 0, x: 300 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -300 },
};

export default function OnboardingModal({ onFinish }: OnboardingModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Slide 1 state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.email?.split('@')[0] || '');
    }
  }, [user]);

  useEffect(() => {
    if (username.length > 3) {
      setIsCheckingUsername(true);
      const timer = setTimeout(async () => {
        const isAvailable = await checkUsernameAvailability(username);
        setIsUsernameAvailable(isAvailable);
        setIsCheckingUsername(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsUsernameAvailable(null);
    }
  }, [username]);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!displayName || !username || !selectedGender || !isUsernameAvailable) {
        toast({ title: 'Profile Incomplete', description: 'Please fill all fields and ensure username is available.', variant: 'destructive' });
        return;
      }
      setIsSaving(true);
      try {
        const avatarUrl = selectedGender === 'male' ? '/assets/male-avatar.png' : '/assets/female-avatar.png';
        await updateUserProfile(user!.uid, { displayName, username, photoURL: avatarUrl });
        // Removed `await refreshUser()` to prevent page reload
        setCurrentStep(2);
      } catch (error: any) {
        toast({ title: 'Error Saving Profile', description: error.message, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const requestPermission = async (permissionName: 'notifications' | 'camera' | 'location') => {
    try {
        if (permissionName === 'notifications' && 'Notification' in window) {
            await Notification.requestPermission();
        } else if (permissionName === 'camera' && navigator.mediaDevices) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());
        } else if (permissionName === 'location' && navigator.geolocation) {
            await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        }
        toast({ title: `${permissionName.charAt(0).toUpperCase() + permissionName.slice(1)} Enabled`, description: 'Permission granted successfully.' });
    } catch (error) {
        toast({ title: 'Permission Denied', description: `You can enable it later from browser settings.`, variant: 'default' });
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    await updateUserProfile(user!.uid, { onboardingCompleted: true });
    setCurrentStep(3);
    setTimeout(() => {
        onFinish();
    }, 3000);
  };
  
  const hasGoogleProvider = user?.providerData.some(p => p.providerId === 'google.com');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="frosted-glass sm:max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8">
              <h2 className="font-headline text-2xl font-semibold text-primary mb-2">Welcome to Calendar.ai!</h2>
              <p className="text-muted-foreground mb-6">Let's set up your profile to get you started.</p>
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <button onClick={() => setSelectedGender('male')} className={cn("rounded-full border-4 p-1 transition-all", selectedGender === 'male' ? 'border-accent' : 'border-transparent hover:border-accent/50')}>
                            <Image src="/assets/male-avatar.png" alt="Male Avatar" width={80} height={80} className="rounded-full" />
                        </button>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <button onClick={() => setSelectedGender('female')} className={cn("rounded-full border-4 p-1 transition-all", selectedGender === 'female' ? 'border-accent' : 'border-transparent hover:border-accent/50')}>
                            <Image src="/assets/female-avatar.png" alt="Female Avatar" width={80} height={80} className="rounded-full" />
                        </button>
                    </div>
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g., Ashish Yesale" />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g., ashish" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? <LoadingSpinner size="sm" /> : isUsernameAvailable === true ? <Check className="h-5 w-5 text-green-500" /> : isUsernameAvailable === false ? <X className="h-5 w-5 text-destructive" /> : null}
                    </div>
                  </div>
                  {isUsernameAvailable === false && <p className="text-xs text-destructive mt-1">Username is already taken.</p>}
                </div>
                 {!hasGoogleProvider && (
                    <Button variant="outline" className="w-full">
                        <LinkIcon className="mr-2 h-4 w-4" /> Connect Google Account
                    </Button>
                 )}
              </div>
              <Button onClick={handleNextStep} disabled={isSaving || !displayName || !username || !selectedGender || isUsernameAvailable === false} className="w-full mt-8">
                {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : null}
                Next
              </Button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8">
               <h2 className="font-headline text-2xl font-semibold text-primary mb-2">Permissions</h2>
               <p className="text-muted-foreground mb-6">Grant access to enable key features. These are optional and can be changed later.</p>
               <div className="space-y-3">
                   <Button variant="outline" className="w-full justify-start h-14" onClick={() => requestPermission('notifications')}><Bell className="mr-4 h-5 w-5 text-accent"/><div><p>Enable Notifications</p><p className="text-xs text-muted-foreground text-left">For event reminders.</p></div></Button>
                   <Button variant="outline" className="w-full justify-start h-14" onClick={() => requestPermission('camera')}><Camera className="mr-4 h-5 w-5 text-accent"/><div><p>Camera & Mic Access</p><p className="text-xs text-muted-foreground text-left">For video/voice calls.</p></div></Button>
                   <Button variant="outline" className="w-full justify-start h-14" onClick={() => requestPermission('location')}><MapPin className="mr-4 h-5 w-5 text-accent"/><div><p>Location Access</p><p className="text-xs text-muted-foreground text-left">For contextual suggestions.</p></div></Button>
               </div>
               <Button onClick={handleFinish} className="w-full mt-8">Finish</Button>
            </motion.div>
          )}

           {currentStep === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-8 md:p-12 text-center">
               <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
               <h2 className="font-headline text-2xl font-semibold text-primary mb-2">Setup Complete!</h2>
               <p className="text-muted-foreground">Your 30-day free trial has started. Enjoy full access to all features.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

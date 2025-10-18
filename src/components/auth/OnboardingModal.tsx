
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

const avatars = [
    { id: 'male-sunglasses', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740' },
    { id: 'female-glasses', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436185.jpg?w=740' },
    { id: 'male-green-hoodie', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-green-hoodie_23-2149436191.jpg?w=740' },
    { id: 'female-yellow-shirt', url: 'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg?w=740' },
    { id: 'male-rainbow-glasses', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436190.jpg?w=740' },
];


export default function OnboardingModal({ onFinish }: OnboardingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Slide 1 state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

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
      if (!displayName || !username || !selectedAvatarUrl || !isUsernameAvailable) {
        toast({ title: 'Profile Incomplete', description: 'Please fill all fields and choose an avatar.', variant: 'destructive' });
        return;
      }
      setIsSaving(true);
      try {
        await updateUserProfile(user!.uid, { displayName, username, photoURL: selectedAvatarUrl });
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
              <p className="text-muted-foreground mb-6">Let's set up your profile. All fields are required.</p>
              <div className="space-y-6">
                 <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g., Ashish Yesale" className="mt-2 bg-black/50 h-11" />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="relative mt-2">
                    <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g., ashish" className="bg-black/50 h-11"/>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? <LoadingSpinner size="sm" /> : isUsernameAvailable === true ? <Check className="h-5 w-5 text-green-500" /> : isUsernameAvailable === false ? <X className="h-5 w-5 text-destructive" /> : null}
                    </div>
                  </div>
                  {isUsernameAvailable === false && <p className="text-xs text-destructive mt-1">Username is already taken.</p>}
                </div>
                <div>
                  <Label>Choose Your Avatar</Label>
                   <div className="mt-3 grid grid-cols-3 gap-4">
                       {avatars.map((avatar) => (
                           <button key={avatar.id} onClick={() => setSelectedAvatarUrl(avatar.url)} className={cn("relative aspect-square rounded-full border-4 p-1 transition-all", selectedAvatarUrl === avatar.url ? 'border-accent' : 'border-transparent hover:border-accent/50')}>
                               <Image src={avatar.url} alt={avatar.id} width={96} height={96} className="rounded-full bg-muted/30" />
                           </button>
                       ))}
                        <button onClick={() => toast({title: 'Coming Soon', description: 'Custom avatar uploads will be available soon.'})} className="aspect-square rounded-full bg-black/30 border-2 border-dashed border-border/50 flex items-center justify-center hover:border-accent transition-colors">
                           <User className="h-8 w-8 text-muted-foreground" />
                        </button>
                   </div>
                </div>
              </div>
              <Button onClick={handleNextStep} disabled={isSaving || !displayName || !username || !selectedAvatarUrl || isUsernameAvailable === false} className="w-full mt-8 h-12 text-base">
                {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : null}
                Continue
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


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { checkUsernameAvailability, updateUserProfile, saveUserFCMToken } from '@/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { User, Check, X, Bell, Video, MapPin, Sparkles, CheckCircle, Gift, Crown } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { auth, messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

const MALE_AVATAR_URL = 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=626&ext=jpg&ga=GA1.1.2082379227.1717027200&semt=sph';
const FEMALE_AVATAR_URL = 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436185.jpg?size=626&ext=jpg';

const onboardingSchema = z.object({
  displayName: z.string().min(3, { message: "Display name must be at least 3 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
  gender: z.enum(['male', 'female'], { required_error: "Please select a gender." }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  onFinish: () => void;
}

export default function OnboardingModal({ onFinish }: OnboardingModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const isPhoneUser = user?.providerData.length === 1 && user.providerData[0].providerId === 'phone';
  const [isGoogleLinked, setIsGoogleLinked] = useState(!isPhoneUser);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      username: user?.email?.split('@')[0] || '',
      gender: undefined,
    },
  });

  const usernameValue = form.watch('username');

  const checkUsername = useCallback(async (name: string) => {
    if (name.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setIsCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailability(name);
      setUsernameAvailable(isAvailable);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (usernameValue) checkUsername(usernameValue);
    }, 500);
    return () => clearTimeout(debounce);
  }, [usernameValue, checkUsername]);
  
  const handleGoogleConnect = async () => {
    if (!user) return;
    const provider = new GoogleAuthProvider();
    try {
        await linkWithPopup(user, provider);
        await refreshUser();
        setIsGoogleLinked(true);
        toast({ title: 'Success', description: 'Google account connected!' });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to connect Google account.', variant: 'destructive'});
    }
  };

  const handleStep1Submit = async (values: OnboardingFormValues) => {
    if (!user) return;
    if (!usernameAvailable) {
      toast({ title: "Username not available", description: "Please choose a different username.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const avatarUrl = values.gender === 'male' ? MALE_AVATAR_URL : FEMALE_AVATAR_URL;
      await updateUserProfile(user.uid, {
        displayName: values.displayName,
        username: values.username,
        photoURL: user.photoURL || avatarUrl, // Use Google's photo if available, otherwise set default
      });
      await refreshUser();
      setStep(2);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const requestPermission = async (permissionName: 'notifications' | 'camera' | 'geolocation') => {
      try {
        if (permissionName === 'notifications' && 'Notification' in window && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted' && user && messaging) {
                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                if(vapidKey) {
                    const token = await getToken(messaging, { vapidKey });
                    await saveUserFCMToken(user.uid, token);
                    toast({ title: 'Notifications Enabled!' });
                }
            }
        } else if (permissionName === 'camera' && navigator.mediaDevices) {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            toast({ title: 'Camera & Mic Access Granted' });
        } else if (permissionName === 'geolocation' && navigator.geolocation) {
            await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
            toast({ title: 'Location Access Granted' });
        }
      } catch (err) {
         toast({ title: `Permission Denied`, description: `You can enable it later in your browser settings.`, variant: 'destructive' });
      }
  };
  
  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    await updateUserProfile(user.uid, { onboardingCompleted: true });
    setStep(3);
    setTimeout(() => {
        onFinish();
    }, 3000); // Wait 3 seconds on the final screen
  }

  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md frosted-glass p-0 overflow-hidden" hideCloseButton={true}>
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {step === 1 && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleStep1Submit)}>
                            <DialogHeader className="p-6">
                                <DialogTitle className="font-headline text-xl text-primary">Welcome to Calendar.ai!</DialogTitle>
                                <DialogDescription>Let's set up your profile. All fields are required.</DialogDescription>
                            </DialogHeader>
                            <div className="p-6 pt-0 space-y-4">
                                <FormField control={form.control} name="displayName" render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input id="displayName" placeholder="e.g., Jane Doe" {...field} />
                                        {form.formState.errors.displayName && <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>}
                                    </div>
                                )}/>
                                <FormField control={form.control} name="username" render={({ field }) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <div className="relative">
                                            <Input id="username" placeholder="e.g., janedoe" {...field} />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                {isCheckingUsername ? <LoadingSpinner size="sm"/> : usernameAvailable === true ? <Check className="h-5 w-5 text-green-500" /> : usernameAvailable === false ? <X className="h-5 w-5 text-destructive"/> : null}
                                            </div>
                                        </div>
                                         {form.formState.errors.username && <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>}
                                    </div>
                                )}/>
                                <Controller control={form.control} name="gender" render={({ field }) => (
                                   <div>
                                       <Label>Choose Your Avatar</Label>
                                       <div className="flex justify-center gap-6 mt-2">
                                          <div className="flex flex-col items-center gap-2">
                                              <button type="button" onClick={() => field.onChange('male')} className={cn("rounded-full border-4 p-1 transition-all", field.value === 'male' ? 'border-accent' : 'border-transparent hover:border-accent/50')}>
                                                <Avatar className="h-20 w-20"><AvatarImage src={MALE_AVATAR_URL}/><AvatarFallback><User/></AvatarFallback></Avatar>
                                              </button>
                                          </div>
                                          <div className="flex flex-col items-center gap-2">
                                               <button type="button" onClick={() => field.onChange('female')} className={cn("rounded-full border-4 p-1 transition-all", field.value === 'female' ? 'border-accent' : 'border-transparent hover:border-accent/50')}>
                                                <Avatar className="h-20 w-20"><AvatarImage src={FEMALE_AVATAR_URL}/><AvatarFallback><User/></AvatarFallback></Avatar>
                                               </button>
                                          </div>
                                       </div>
                                       {form.formState.errors.gender && <p className="text-xs text-destructive text-center mt-2">{form.formState.errors.gender.message}</p>}
                                   </div>
                                )}/>
                                 {isPhoneUser && !isGoogleLinked && (
                                     <div className="pt-2 text-center">
                                         <Label className="text-destructive font-bold">Action Required</Label>
                                         <p className="text-xs text-muted-foreground mb-2">To use all features, please connect your Google account.</p>
                                         <Button type="button" onClick={handleGoogleConnect} variant="outline" className="w-full">
                                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>
                                            Connect with Google
                                        </Button>
                                     </div>
                                 )}
                            </div>
                            <DialogFooter className="p-6 pt-2">
                                <Button type="submit" className="w-full" disabled={isSaving || !isGoogleLinked}>
                                    {isSaving ? <LoadingSpinner size="sm"/> : 'Continue'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
                
                {step === 2 && (
                    <>
                       <DialogHeader className="p-6 text-center">
                          <DialogTitle className="font-headline text-xl text-primary">Enable Extra Features</DialogTitle>
                          <DialogDescription>Grant permissions for a better experience. You can change these later.</DialogDescription>
                       </DialogHeader>
                       <div className="p-6 pt-0 space-y-4">
                           <div className="p-3 border rounded-lg flex items-center justify-between">
                               <div><h4 className="font-semibold text-sm">Notifications</h4><p className="text-xs text-muted-foreground">Get reminders for events.</p></div>
                               <Button size="sm" variant="outline" onClick={() => requestPermission('notifications')}><Bell className="h-4 w-4 mr-2"/>Enable</Button>
                           </div>
                           <div className="p-3 border rounded-lg flex items-center justify-between">
                               <div><h4 className="font-semibold text-sm">Camera & Mic</h4><p className="text-xs text-muted-foreground">For video calls with friends.</p></div>
                               <Button size="sm" variant="outline" onClick={() => requestPermission('camera')}><Video className="h-4 w-4 mr-2"/>Enable</Button>
                           </div>
                           <div className="p-3 border rounded-lg flex items-center justify-between">
                               <div><h4 className="font-semibold text-sm">Location</h4><p className="text-xs text-muted-foreground">For weather and local events.</p></div>
                               <Button size="sm" variant="outline" onClick={() => requestPermission('geolocation')}><MapPin className="h-4 w-4 mr-2"/>Enable</Button>
                           </div>
                       </div>
                       <DialogFooter className="p-6 pt-2">
                           <Button className="w-full" onClick={handleFinish} disabled={isSaving}>
                             {isSaving ? <LoadingSpinner size="sm"/> : 'Finish'}
                           </Button>
                       </DialogFooter>
                    </>
                )}
                
                {step === 3 && (
                    <div className="p-8 text-center flex flex-col items-center justify-center h-96">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }} transition={{ type: 'spring', stiffness: 300, damping: 10 }}>
                          <Gift className="h-20 w-20 text-accent mb-4"/>
                        </motion.div>
                        <h2 className="text-2xl font-bold font-headline text-primary">You're All Set!</h2>
                        <p className="text-muted-foreground mt-2">Your 30-day free trial has started. Explore all the features Calendar.ai has to offer.</p>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}



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
  Briefcase,
  GraduationCap,
  Sparkles,
  User,
  X,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Card, CardHeader, CardContent } from '../ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface OnboardingModalProps {
  onFinish: () => void;
}

const slideVariants = {
  hidden: { opacity: 0, x: 300 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -300 },
};

const avatarOptions = [
    { id: 'male-sunglasses', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740' },
    { id: 'female-glasses', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436185.jpg?w=740' },
    { id: 'male-green-hoodie', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-green-hoodie_23-2149436191.jpg?w=740' },
    { id: 'female-yellow-shirt', url: 'https://img.freepik.com/free-psd/3d-illustration-person_23-2149436192.jpg?w=740' },
    { id: 'male-rainbow-glasses', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436190.jpg?w=740' },
    { id: 'male2', url: 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?w=740' },
    { id: 'female2', url: 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671140.jpg?w=740' },
    { id: 'male3', url: 'https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740' },
];

const studentFeatures = [
    { name: 'Exam Preparation Tracking', included: true },
    { name: 'Career Goal Roadmaps', included: true },
    { name: 'AI-Powered Daily Planning', included: true },
    { name: 'Competitive Programming Stats', included: true },
    { name: 'Skill Gap Analysis', included: true },
];

const professionalFeatures = [
    { name: 'Advanced Project Management', included: true },
    { name: 'Team Collaboration Tools', included: true },
    { name: 'Career Goal Roadmaps', included: true },
    { name: 'AI-Powered Daily Planning', included: true },
    { name: 'Skill Gap Analysis', included: true },
];

const FeatureList = ({ features }: { features: { name: string, included: boolean }[] }) => (
    <ul className="space-y-2 text-left">
        {features.filter(f => f.included).map(feature => (
            <li key={feature.name} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm text-foreground/90">
                    {feature.name}
                </span>
            </li>
        ))}
    </ul>
);


export default function OnboardingModal({ onFinish }: OnboardingModalProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Step 1: Role Selection
  const [userType, setUserType] = useState<'student' | 'professional' | null>(null);

  // Step 2: Profile Setup
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
        if (!userType) {
            toast({ title: 'Role Required', description: 'Please select whether you are a student or a professional.', variant: 'destructive'});
            return;
        }
        setIsSaving(true);
        try {
            await updateUserProfile(user!.uid, { userType });
            setCurrentStep(2);
        } catch (error: any) {
            toast({ title: 'Error Saving Role', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    } else if (currentStep === 2) {
      if (!displayName || !username || !selectedAvatarUrl || !isUsernameAvailable) {
        toast({ title: 'Profile Incomplete', description: 'Please fill all fields and choose an avatar.', variant: 'destructive' });
        return;
      }
      setIsSaving(true);
      try {
        await updateUserProfile(user!.uid, { displayName, username, photoURL: selectedAvatarUrl });
        setCurrentStep(3);
      } catch (error: any) {
        toast({ title: 'Error Saving Profile', description: error.message, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const handleConnectGoogle = async () => {
    if (!user) return;
    const provider = new GoogleAuthProvider();
    try {
        await linkWithPopup(user, provider);
        await refreshUser();
        toast({ title: 'Google Account Linked', description: 'Your Google account has been successfully connected.'});
    } catch (error: any) {
        toast({ title: 'Error Linking Account', description: error.message, variant: 'destructive'});
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
    setCurrentStep(4);
    setTimeout(() => {
        onFinish();
    }, 3000);
  };
  
  const hasGoogleProvider = user?.providerData.some(p => p.providerId === 'google.com');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="frosted-glass sm:max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8">
              <h2 className="font-headline text-xl font-semibold text-primary mb-1 text-center">Choose Your Role</h2>
              <p className="text-muted-foreground text-sm mb-6 text-center">Select your path to personalize your experience.</p>
                <Accordion type="single" collapsible value={userType || ''} onValueChange={(value) => setUserType(value as 'student' | 'professional')}>
                    <AccordionItem value="student" className="border rounded-lg mb-4 data-[state=open]:border-accent data-[state=open]:ring-1 data-[state=open]:ring-accent">
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center gap-4 text-left">
                                <GraduationCap className="h-8 w-8 text-accent"/>
                                <div>
                                    <h3 className="font-semibold text-lg">Student</h3>
                                    <p className="text-xs text-muted-foreground">For learners and exam preppers.</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                             <div className="p-4 bg-background/50 rounded-md border">
                                <FeatureList features={studentFeatures} />
                             </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="professional" className="border rounded-lg data-[state=open]:border-accent data-[state=open]:ring-1 data-[state=open]:ring-accent">
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center gap-4 text-left">
                                <Briefcase className="h-8 w-8 text-accent"/>
                                <div>
                                    <h3 className="font-semibold text-lg">Professional</h3>
                                    <p className="text-xs text-muted-foreground">For career-focused individuals.</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                             <div className="p-4 bg-background/50 rounded-md border">
                                <FeatureList features={professionalFeatures} />
                             </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
              <Button onClick={handleNextStep} disabled={isSaving || !userType} className="w-full mt-8 h-11 text-base">
                {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : null}
                Next
              </Button>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8 max-w-lg mx-auto">
              <h2 className="font-headline text-xl font-semibold text-primary mb-1">Set up your profile</h2>
              <p className="text-muted-foreground text-sm mb-6">Let's get your account ready.</p>
              <div className="space-y-4">
                 <div>
                  <Label htmlFor="displayName" className="text-xs">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g., Your Name" className="mt-1 bg-black/50 h-10" />
                </div>
                <div>
                  <Label htmlFor="username" className="text-xs">Username</Label>
                  <div className="relative mt-1">
                    <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g., your_username" className="bg-black/50 h-10"/>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? <LoadingSpinner size="sm" /> : isUsernameAvailable === true ? <Check className="h-5 w-5 text-green-500" /> : isUsernameAvailable === false ? <X className="h-5 w-5 text-destructive" /> : null}
                    </div>
                  </div>
                  {isUsernameAvailable === false && <p className="text-xs text-destructive mt-1">Username is already taken.</p>}
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Choose Your Avatar</Label>
                  <ScrollArea className="h-40">
                    <div className="grid grid-cols-3 gap-4 pr-3">
                        {avatarOptions.map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => setSelectedAvatarUrl(avatar.url)}
                            className={cn(
                              "relative aspect-square w-full rounded-full border-2 p-1 transition-all flex items-center justify-center",
                              selectedAvatarUrl === avatar.url
                                ? 'border-accent'
                                : 'border-transparent hover:border-accent/50'
                            )}
                          >
                            <Image
                              src={avatar.url}
                              alt={avatar.id}
                              width={80}
                              height={80}
                              className="rounded-full bg-muted/30"
                            />
                          </button>
                        ))}
                        <button
                          onClick={() => toast({ title: 'Coming Soon' })}
                          className="aspect-square w-full rounded-full bg-black/30 border-2 border-dashed border-border/50 flex items-center justify-center hover:border-accent transition-colors"
                        >
                          <User className="h-8 w-8 text-muted-foreground" />
                        </button>
                    </div>
                  </ScrollArea>
                </div>
                {!hasGoogleProvider && (
                    <div className="pt-2">
                         <Button variant="outline" className="w-full" onClick={handleConnectGoogle}>
                             <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>
                            Connect Google Account
                        </Button>
                    </div>
                )}
              </div>
              <Button onClick={handleNextStep} disabled={isSaving || !displayName || !username || !selectedAvatarUrl || isUsernameAvailable === false} className="w-full mt-6 h-11 text-base">
                {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : null}
                Next
              </Button>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8 max-w-lg mx-auto">
               <h2 className="font-headline text-xl font-semibold text-primary mb-2">Permissions</h2>
               <p className="text-muted-foreground text-sm mb-6">Grant access to enable key features. These are optional and can be changed later.</p>
               <div className="space-y-3">
                   <Button variant="outline" className="w-full justify-start h-14" onClick={() => requestPermission('notifications')}><Bell className="mr-4 h-5 w-5 text-accent"/><div><p>Enable Notifications</p><p className="text-xs text-muted-foreground text-left">For event reminders.</p></div></Button>
                   <Button variant="outline" className="w-full justify-start h-14" onClick={() => requestPermission('camera')}><Camera className="mr-4 h-5 w-5 text-accent"/><div><p>Camera & Mic Access</p><p className="text-xs text-muted-foreground text-left">For video/voice calls.</p></div></Button>
                   
               </div>
               <Button onClick={handleFinish} className="w-full mt-8 h-11 text-base">Finish Setup</Button>
            </motion.div>
          )}

           {currentStep === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="p-8 md:p-12 text-center max-w-lg mx-auto">
               <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
               <h2 className="font-headline text-xl font-semibold text-primary mb-2">Setup Complete!</h2>
               <p className="text-muted-foreground text-sm">Your 30-day free trial has started. Enjoy full access to all features.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

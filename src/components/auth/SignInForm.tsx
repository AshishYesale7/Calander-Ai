
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, linkWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Smartphone, Mail, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getUserProfile, reclaimUserAccount } from '@/services/userService';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';


const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

declare global {
  interface Window {
    // This is now only used to hold the confirmation result, not the verifier.
    confirmationResult?: ConfirmationResult;
  }
}

export default function SignInForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [view, setView] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // New state for multi-step reclamation
  const [reclamationState, setReclamationState] = useState<'prompt' | 'confirmed' | 'cancelled' | null>(null);
  const [pendingReclamationUser, setPendingReclamationUser] = useState<{ uid: string; email: string } | null>(null);


  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
        router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Success', description: 'Signed in successfully.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data === 'auth-success-google' || event.data === 'auth-success-notion') {
        setTimeout(() => window.location.reload(), 2000);
      }
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => {
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/tasks');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        if (!auth) throw new Error("Firebase Auth is not initialized.");
        const result = await signInWithPopup(auth, provider);
        
        const profile = await getUserProfile(result.user.uid);
        if (profile?.deletionStatus === 'PENDING_DELETION') {
            setPendingReclamationUser({ uid: result.user.uid, email: result.user.email || ''});
            setReclamationState('prompt');
        } else {
            toast({ title: 'Success!', description: 'Signed in with Google successfully.' });
            router.push('/dashboard');
        }

    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            toast({ title: 'Sign-in cancelled', description: 'You closed the Google Sign-In window.', variant: 'default' });
        } else if (error.code === 'auth/account-exists-with-different-credential') {
             const email = error.customData.email;
             const methods = await fetchSignInMethodsForEmail(auth, email);
             toast({
                title: 'Account Exists',
                description: `You've previously signed in with ${methods.join(', ')}. Please use that method to sign in.`,
                variant: 'destructive',
                duration: 9000,
            });
        } else {
            toast({ title: 'Error', description: error.message || 'Failed to sign in with Google.', variant: 'destructive' });
        }
    } finally {
      setLoading(false); 
    }
  };
  
  const handleReclaimAccount = async () => {
    if (!pendingReclamationUser) return;
    setLoading(true);
    try {
      await reclaimUserAccount(pendingReclamationUser.uid);
      setReclamationState('confirmed');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reclaim account. Please contact support.', variant: 'destructive' });
      setReclamationState(null);
      setPendingReclamationUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReclamation = async () => {
    if (auth) await auth.signOut();
    setReclamationState(null);
    setPendingReclamationUser(null);
    router.push('/');
  };

  useEffect(() => {
    if (reclamationState === 'confirmed') {
      const timer = setTimeout(() => {
        // Redirect to dashboard after showing the confirmation
        router.push('/dashboard');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [reclamationState, router]);


  const handleSendOtp = async () => {
    if (!auth) {
      toast({ title: 'Error', description: 'Firebase Auth not initialized.', variant: 'destructive' });
      return;
    }
    const fullPhoneNumber = typeof phoneNumber === 'string' ? phoneNumber : '';
    if (!fullPhoneNumber || !isValidPhoneNumber(fullPhoneNumber)) {
        toast({ title: 'Invalid Phone Number', description: 'Please enter a complete and valid phone number in international format (e.g., +1...).', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => { console.log("reCAPTCHA callback") },
        'expired-callback': () => {
            toast({ title: 'reCAPTCHA Expired', description: 'Please try sending the OTP again.', variant: 'destructive' });
        }
      });
      
      let confirmationResult: ConfirmationResult;
      if (auth.currentUser) {
          setIsLinking(true);
          confirmationResult = await linkWithPhoneNumber(auth.currentUser, fullPhoneNumber, verifier);
          toast({ title: 'OTP Sent', description: 'Check your phone to link your number.' });
      } else {
          setIsLinking(false);
          confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
          toast({ title: 'OTP Sent', description: 'Please check your phone for the verification code.' });
      }
      window.confirmationResult = confirmationResult;
      setShowOtpInput(true);

    } catch (error: any) {
      if (error.code === 'auth/billing-not-enabled') {
        toast({
            title: 'Service Not Available',
            description: "Phone sign-in is not enabled for this project. Please contact the administrator or sign in using another method.",
            variant: 'destructive',
            duration: 8000
        });
      } else if (error.code === 'auth/credential-already-in-use') {
         toast({
            title: 'Number In Use',
            description: "This phone number is already linked to another account.",
            variant: 'destructive'
        });
      }
      else {
        console.error("Phone Auth Error:", error);
        toast({ title: 'Error', description: error.message || 'Failed to send OTP. Please refresh the page and try again.', variant: 'destructive' });
      }
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
        toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit OTP.', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
      if (!window.confirmationResult) {
          throw new Error("No confirmation result found. Please send OTP again.");
      }
      await window.confirmationResult.confirm(otp);
      
      if (isLinking) {
         toast({ title: 'Success', description: 'Phone number linked successfully.' });
      } else {
         toast({ title: 'Success', description: 'Signed in successfully.' });
      }

      router.push('/dashboard');
    } catch (error: any) {
       if (error.code === 'auth/invalid-verification-code') {
           toast({
               title: 'Invalid Code',
               description: 'The verification code is incorrect. Please try again.',
               variant: 'destructive',
           });
       } else {
           console.error("OTP Verification Error:", error);
           toast({
               title: 'Error',
               description: error.message || 'An unknown error occurred during verification.',
               variant: 'destructive',
           });
       }
    } finally {
        setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
        <Card className="frosted-glass p-6 md:p-8 flex items-center justify-center h-[560px]">
             <LoadingSpinner size="lg" />
        </Card>
    );
  }

  return (
    <>
    <Card className="frosted-glass p-6 md:p-8 w-full max-w-sm ml-0 md:ml-12 lg:ml-24">
      <div className="flex justify-center mb-6">
        <Image
          src="https://t4.ftcdn.net/jpg/10/33/68/61/360_F_1033686185_RvraYXkGXH40OtR1nhmmQaIIbQQqHN5m.jpg"
          alt="Logo"
          width={100}
          height={100}
          className="rounded-full border-2 border-white/50 dark:border-white/20 shadow-lg"
          data-ai-hint="colorful logo"
        />
      </div>
      <CardContent className="p-0">
         <div className="flex justify-center gap-2 mb-6">
          <Button variant={view === 'email' ? 'default' : 'outline'} onClick={() => setView('email')}><Mail className="mr-2 h-4 w-4" /> Email</Button>
          <Button variant={view === 'phone' ? 'default' : 'outline'} onClick={() => setView('phone')}><Smartphone className="mr-2 h-4 w-4" /> Phone</Button>
        </div>
        
        {view === 'email' && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Input 
                        placeholder="Email" 
                        {...field} 
                        className="bg-transparent text-foreground border-0 border-b-2 border-border rounded-none px-1 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-primary placeholder:text-muted-foreground"
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <div className="relative">
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            {...field} 
                            className="bg-transparent text-foreground border-0 border-b-2 border-border rounded-none px-1 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-primary placeholder:text-muted-foreground"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full bg-accent/70 hover:bg-accent/80 text-white h-12 text-lg rounded-full border border-white/30" disabled={loading}>
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </Button>
            </form>
            </Form>
        )}

        {view === 'phone' && (
            <div className="space-y-8">
             {!showOtpInput ? (
                <div className="space-y-8">
                    <div className="space-y-2 phone-input-container">
                      <Label htmlFor="phone-number" className="block text-sm font-medium text-foreground">Phone Number</Label>
                      <PhoneInput
                        id="phone-number"
                        international
                        defaultCountry="US"
                        countryCallingCodeEditable={true}
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                      />
                    </div>
                    <Button onClick={handleSendOtp} className="w-full bg-accent/70 hover:bg-accent/80 text-white h-12 text-lg rounded-full border border-white/30" disabled={loading}>
                     {loading ? 'SENDING OTP...' : 'SEND OTP'}
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="block text-sm font-medium text-foreground">Enter OTP</Label>
                      <Input 
                        id="otp"
                        type="number"
                        placeholder="6-digit code" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="bg-transparent text-foreground border-0 border-b-2 border-border rounded-none px-1 py-2 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-primary placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button onClick={handleVerifyOtp} className="w-full bg-accent/70 hover:bg-accent/80 text-white h-12 text-lg rounded-full border border-white/30" disabled={loading}>
                        {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
                    </Button>
                </div>
            )}
            </div>
        )}

        <div id="recaptcha-container" className="my-4"></div>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>
            Sign in with Google
        </Button>
        <div className="mt-6 text-center">
          <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Forgot Password?
          </Link>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
      <AlertDialog open={!!pendingReclamationUser}>
        <AlertDialogContent className="frosted-glass">
            {reclamationState === 'prompt' && (
                <>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reclaim Your Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            An account with {pendingReclamationUser?.email} was recently deleted. You have 30 days to reclaim it before the data is permanently erased.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={handleCancelReclamation}>Cancel & Sign Out</Button>
                        <Button onClick={handleReclaimAccount} disabled={loading}>
                            {loading ? <LoadingSpinner size="sm" /> : 'Yes, Reclaim My Account'}
                        </Button>
                    </AlertDialogFooter>
                </>
            )}
            {reclamationState === 'confirmed' && (
                 <div className="flex flex-col items-center justify-center p-4 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <AlertDialogTitle className="mb-2">Welcome Back!</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your account has been successfully restored. Redirecting you to the dashboard...
                    </AlertDialogDescription>
                </div>
            )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

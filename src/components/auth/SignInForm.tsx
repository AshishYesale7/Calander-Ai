
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
import { Eye, EyeOff, Smartphone, Mail, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';

import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


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
  
  const [view, setView] = useState<'email' | 'phone'>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

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
      if (event.data === 'auth-success') {
        window.location.reload();
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

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");

      if (auth.currentUser) {
          await linkWithPopup(auth.currentUser, provider);
          toast({ title: 'Success', description: 'Your Google account has been linked.' });
          // No need to redirect, just let them stay in settings.
          return;
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const state = Buffer.from(JSON.stringify({ userId: user.uid })).toString('base64');
      const authUrl = `/api/auth/google/redirect?state=${encodeURIComponent(state)}`;
      window.open(authUrl, '_blank', 'width=500,height=600');
      toast({ title: 'Connecting Google Account...', description: 'Please authorize access in the popup window.' });

    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("Sign-in popup closed by user.");
            toast({ title: 'Sign-in cancelled', description: 'You closed the Google Sign-In window.', variant: 'default' });
        } else if (error.code === 'auth/account-exists-with-different-credential') {
             const email = error.customData.email;
             const methods = await fetchSignInMethodsForEmail(auth, email);
             toast({
                title: 'Account Exists',
                description: `You've previously signed in with ${methods.join(', ')}. Please use that method to sign in first, then link your accounts from the settings page.`,
                variant: 'destructive',
                duration: 9000,
            });
        } else {
            toast({
                title: 'Error',
                description: error.message || 'Failed to sign in with Google.',
                variant: 'destructive',
            });
        }
    } finally {
      setLoading(false); 
    }
  };

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
      // Create a new RecaptchaVerifier instance on demand.
      // The container 'recaptcha-container' must be visible in the DOM.
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
       console.error(error);
       toast({ title: 'Error', description: error.message || 'Invalid OTP. Please try again.', variant: 'destructive' });
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
        <div className="space-y-8">
             {!showOtpInput ? (
                <div className="space-y-4">
                    <Alert variant="default" className="bg-primary/10 border-primary/30">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-semibold">Demo Login</AlertTitle>
                        <AlertDescription className="text-primary/90 text-xs">
                        Use the demo credentials below: <br />
                        <strong>Phone:</strong> +91 9699981300 <br />
                        <strong>OTP:</strong> 123456
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2 phone-input-container">
                      <Label htmlFor="phone-number" className="block text-sm font-medium text-foreground">Phone Number</Label>
                      <PhoneInput
                        id="phone-number"
                        international
                        defaultCountry="IN"
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

        <div id="recaptcha-container" className="my-4"></div>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

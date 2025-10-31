
'use client';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { createUserProfile } from '@/services/userService';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { signInWithYahoo } from '@/services/yahooAuthService';
import { GoogleIcon, MicrosoftIcon } from './SignInForm';


const YahooIcon = () => <svg xmlns="http://www.w3.org/2000/svg" aria-label="Yahoo!" role="img" viewBox="0 0 512 512" className="mr-2 h-5 w-5"><rect width="512" height="512" rx="15%" fill="#5f01d1"></rect><g fill="#ffffff"><path d="M203 404h-62l25-59-69-165h63l37 95 37-95h62m58 76h-69l62-148h69"></path><circle cx="303" cy="308" r="38"></circle></g></svg>;
const AppleIcon = () => <svg fill="#000000" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" className="mr-2 h-5 w-5 fill-current"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M265.1,142.1 c9.4-11.4,25.4-20.1,39.1-21.1c2.3,15.6-4.1,30.8-12.5,41.6c-9,11.6-24.5,20.5-39.5,20C249.6,167.7,256.6,152.4,265.1,142.1z M349.4,339.9c-10.8,16.4-26,36.9-44.9,37.1c-16.8,0.2-21.1-10.9-43.8-10.8c-22.7,0.1-27.5,11-44.3,10.8 c-18.9-0.2-33.3-18.7-44.1-35.1c-30.2-46-33.4-99.9-14.7-128.6c13.2-20.4,34.1-32.3,53.8-32.3c20,0,32.5,11,49.1,11 c16,0,25.8-11,48.9-11c17.5,0,36,9.5,49.2,26c-43.2,23.7-36.2,85.4,7.5,101.9C360,322.1,357.1,328.1,349.4,339.9z"></path> </g></svg>;


declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface SignUpFormProps {
  avatarUrl: string;
}

export default function SignUpForm({ avatarUrl }: SignUpFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  
  // Phone auth state
  const [phone, setPhone] = useState<string | undefined>();
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countdown, setCountdown] = useState(0);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);


  useEffect(() => {
    if (!authLoading && user) {
        router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data === 'auth-success-google' || event.data === 'auth-success-microsoft') {
        setTimeout(() => window.location.reload(), 1000);
      }
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => {
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  const handleProviderSignUp = async (providerName: 'google' | 'microsoft' | 'yahoo' | 'apple') => {
     if (providerName === 'apple') {
        toast({
            title: 'Service Not Available',
            description: 'Sign up with Apple is not available at this time. Please use another method.',
            variant: 'default',
        });
        return;
    }
    setLoading(providerName);

    try {
        let provider: GoogleAuthProvider | OAuthProvider;
        if (providerName === 'google') {
            provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            provider.addScope('https://www.googleapis.com/auth/calendar.events');
            provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
            provider.addScope('https://www.googleapis.com/auth/tasks');
        } else if (providerName === 'microsoft') {
            provider = new OAuthProvider('microsoft.com');
            provider.setCustomParameters({ tenant: 'common', prompt: 'select_account' });
            const scopes = [
                'openid', 'profile', 'email', 'offline_access', 'User.Read',
                'AccessReview.ReadWrite.All', 'Analytics.Read', 'AppCertTrustConfiguration.ReadWrite.All',
                'Calendars.ReadWrite', 'Calendars.ReadWrite.Shared', 
                'Contacts.ReadWrite.Shared',
                'Files.ReadWrite.All',
                'Mail.Read', 'Mail.Read.Shared', 'Mail.ReadBasic', 'Mail.ReadBasic.Shared', 
                'Mail.ReadWrite', 'Mail.ReadWrite.Shared', 'Mail.Send', 'Mail.Send.Shared',
                'Notes.ReadWrite.All',
                'Notifications.ReadWrite.CreatedByApp',
                'OnlineMeetings.ReadWrite', 'OnlineMeetingTranscript.Read.All',
                'Tasks.ReadWrite', 'Tasks.ReadWrite.Shared',
                'TeamMember.ReadWriteNonOwnerRole.All',
                'VirtualAppointment.Read', 'VirtualAppointment.ReadWrite', 'VirtualAppointmentNotification.Send',
            ];
            scopes.forEach(scope => provider.addScope(scope));
        } else if (providerName === 'yahoo') {
            provider = new OAuthProvider('yahoo.com');
            provider.addScope('email');
            provider.addScope('profile');
        }

        if (!provider) throw new Error("Invalid provider");
        
        // This is the new logic to handle account linking
        if (auth.currentUser) {
            // If there's already a user (e.g., from phone auth), link the new provider
            const credential = await linkWithCredential(auth.currentUser, provider as any); // Type assertion needed here.
            toast({ title: 'Account Linked!', description: `Successfully linked your ${providerName} account.` });
        } else {
             // Otherwise, this is a fresh sign-in/sign-up
            await signInWithPopup(auth, provider);
            toast({ title: 'Sign In Successful!', description: 'Welcome to Calendar.ai.' });
        }
        
        router.push('/dashboard');

    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            toast({ title: `Sign-up Cancelled`, description: `You closed the ${providerName} sign-up window.`, variant: 'default' });
        } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
          const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
          const consoleUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`;
          toast({
            title: 'Action Required',
            description: (
              <div>
                <p>This sign-in method isn't fully configured. Please add the provider's OAuth details (like Client ID or Services ID) in your <a href={consoleUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">Firebase Console</a>.</p>
              </div>
            ),
            variant: 'destructive',
            duration: 15000,
          });
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            const email = error.customData.email;
            toast({
                title: 'Account Exists',
                description: `An account with ${email} already exists. Please go to the login page to sign in.`,
                variant: 'destructive',
                duration: 8000,
            });
            router.push(`/auth/signin?email=${encodeURIComponent(email)}`);
        } else {
            toast({ title: 'Error', description: error.message || `Failed to sign up with ${providerName}.`, variant: 'destructive' });
        }
    } finally {
        setLoading(null);
    }
  };

  const setupRecaptcha = () => {
    if (!auth || !recaptchaContainerRef.current) return;
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
      size: 'normal',
    });
    return window.recaptchaVerifier.render();
  };

  const handleSendOtp = async (isResend = false) => {
    if (isResend && countdown > 0) return;
    if (!phone || !isValidPhoneNumber(phone)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    setLoading('phone');
    try {
      await setupRecaptcha();
      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmationResult;
      
      if (!isResend) {
        setStep('otp');
        toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
        setCountdown(60);
      } else {
        toast({ title: "OTP Resent", description: "A new code has been sent to your phone." });
        setCountdown(30);
      }
    } catch (error: any) {
      console.error("Phone sign-up error:", error);
      toast({ title: 'Error', description: error.message || "Failed to send OTP.", variant: 'destructive' });
      setCountdown(0);
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }
    const confirmationResult = window.confirmationResult;
    if (!confirmationResult) {
      toast({ title: "Verification Expired", description: "Please request a new OTP.", variant: "destructive" });
      setStep('phone');
      return;
    }
    setLoading('otp');
    try {
      const userCredential = await confirmationResult.confirm(otp);
      // The onAuthStateChanged listener handles profile creation.
      toast({ title: "Sign In Successful!", description: "Welcome to Calendar.ai." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("OTP verification error:", error);
      if (error.code === 'auth/invalid-verification-code') {
          toast({ title: "Verification Failed", description: "The code you entered is incorrect. Please try again.", variant: "destructive" });
      } else {
          toast({ title: "Verification Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
      }
    } finally {
      setLoading(null);
    }
  };

  if (authLoading || user) {
      return (
          <Card className="frosted-glass p-6 md:p-8 flex items-center justify-center h-[520px]">
               <LoadingSpinner size="lg" />
          </Card>
      );
  }

  return (
    <Card className="frosted-glass p-6 md:p-8 w-full max-w-sm ml-0 md:ml-12 lg:ml-24">
      <div className="flex justify-center mb-6">
        <Image
          src={avatarUrl}
          alt="Logo"
          width={60}
          height={60}
          className="rounded-full border-2 border-white/50 dark:border-white/20 shadow-lg"
          data-ai-hint="abstract logo"
        />
      </div>
      <CardContent className="p-0">
        <h1 className="text-2xl font-bold text-center text-primary mb-2">Create an Account</h1>
        <p className="text-center text-muted-foreground mb-8">Join using your favorite provider.</p>

        {step === 'phone' ? (
          <div className="space-y-4">
              <div className="space-y-2 phone-input-container">
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneInput
                      id="phone"
                      international
                      defaultCountry="US"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={setPhone}
                  />
              </div>
              <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
              <Button type="button" className="w-full" onClick={() => handleSendOtp(false)} disabled={!!loading}>
                  {loading === 'phone' ? <LoadingSpinner size="sm" /> : "Send OTP"}
              </Button>
          </div>
        ) : (
           <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code"
                    />
                </div>
                <div className="text-right text-sm">
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">Resend OTP in {countdown}s</span>
                  ) : (
                    <Button variant="link" className="p-0 h-auto" onClick={() => handleSendOtp(true)} disabled={loading === 'phone'}>
                      Resend OTP
                    </Button>
                  )}
                </div>
                <Button type="button" className="w-full" onClick={handleVerifyOtp} disabled={!!loading}>
                    {loading === 'otp' ? <LoadingSpinner size="sm" /> : "Verify & Sign Up"}
                </Button>
                <Button variant="link" onClick={() => setStep('phone')}>Back</Button>
            </div>
        )}
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-4">
            <Button variant="outline" type="button" className="w-full h-12" onClick={() => handleProviderSignUp('google')} disabled={!!loading}>
                {loading === 'google' ? <LoadingSpinner size="sm" /> : <GoogleIcon />} Sign up with Google
            </Button>
            <Button variant="outline" type="button" className="w-full h-12" onClick={() => handleProviderSignUp('microsoft')} disabled={!!loading}>
                {loading === 'microsoft' ? <LoadingSpinner size="sm" /> : <MicrosoftIcon />} Sign up with Microsoft
            </Button>
            <Button variant="outline" type="button" className="w-full h-12" onClick={() => handleProviderSignUp('yahoo')} disabled={!!loading}>
                {loading === 'yahoo' ? <LoadingSpinner size="sm" /> : <YahooIcon />} Sign up with Yahoo
            </Button>
            <Button variant="outline" type="button" className="w-full h-12" onClick={() => handleProviderSignUp('apple')} disabled={!!loading}>
                {loading === 'apple' ? <LoadingSpinner size="sm" /> : <AppleIcon />} Sign up with Apple
            </Button>
        </div>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}


'use client';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
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

const GoogleIcon = () => <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" className="mr-2 h-4 w-4"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#4285F4" d="M14.9 8.161c0-.476-.039-.954-.121-1.422h-6.64v2.695h3.802a3.24 3.24 0 01-1.407 2.127v1.75h2.269c1.332-1.22 2.097-3.02 2.097-5.15z"></path><path fill="#34A853" d="M8.14 15c1.898 0 3.499-.62 4.665-1.69l-2.268-1.749c-.631.427-1.446.669-2.395.669-1.836 0-3.393-1.232-3.952-2.888H1.85v1.803A7.044 7.044 0 008.14 15z"></path><path fill="#FBBC04" d="M4.187 9.342a4.17 4.17 0 010-2.68V4.859H1.849a6.97 6.97 0 000 6.286l2.338-1.803z"></path><path fill="#EA4335" d="M8.14 3.77a3.837 3.837 0 012.7 1.05l2.01-1.999a6.786 6.786 0 00-4.71-1.82 7.042 7.042 0 00-6.29 3.858L4.186 6.66c.556-1.658 2.116-2.89 3.952-2.89z"></path></g></svg>;
const MicrosoftIcon = () => <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 fill-current"><path d="M11.4 21.9H2.1V12.6h9.3V21.9zm0-18.6H2.1v9.3h9.3V3.3zm9.3 0v9.3h9.3V3.3h-9.3zm0 18.6v-9.3h9.3v9.3h-9.3z"></path></svg>;
const YahooIcon = () => <svg xmlns="http://www.w3.org/2000/svg" aria-label="Yahoo!" role="img" viewBox="0 0 512 512" className="mr-2 h-4 w-4"><rect width="512" height="512" rx="15%" fill="#5f01d1"></rect><g fill="#ffffff"><path d="M203 404h-62l25-59-69-165h63l37 95 37-95h62m58 76h-69l62-148h69"></path><circle cx="303" cy="308" r="38"></circle></g></svg>;
const AppleIcon = () => <svg role="img" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4 fill-current"><g><path d="M265.1,142.1 c9.4-11.4,25.4-20.1,39.1-21.1c2.3,15.6-4.1,30.8-12.5,41.6c-9,11.6-24.5,20.5-39.5,20C249.6,167.7,256.6,152.4,265.1,142.1z M349.4,339.9c-10.8,16.4-26,36.9-44.9,37.1c-16.8,0.2-21.1-10.9-43.8-10.8c-22.7,0.1-27.5,11-44.3,10.8 c-18.9-0.2-33.3-18.7-44.1-35.1c-30.2-46-33.4-99.9-14.7-128.6c13.2-20.4,34.1-32.3,53.8-32.3c20,0,32.5,11,49.1,11 c16,0,25.8-11,48.9-11c17.5,0,36,9.5,49.2,26c-43.2,23.7-36.2,85.4,7.5,101.9C360,322.1,357.1,328.1,349.4,339.9z"></path></g></svg>;

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  
  // Phone auth state
  const [phone, setPhone] = useState<string | undefined>();
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!authLoading && user) {
        router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data === 'auth-success-google') {
        setTimeout(() => window.location.reload(), 2000);
      }
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => {
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  const handleSignUp = async (provider: GoogleAuthProvider | OAuthProvider) => {
    const providerId = provider.providerId.split('.')[0];
    setLoading(providerId);

    try {
      if (!auth) throw new Error("Firebase Auth is not initialized.");
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
      toast({ title: 'Account Created!', description: 'Welcome to Calendar.ai.' });
      router.push('/dashboard');
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            toast({ title: `Sign-up cancelled`, description: `You closed the ${providerId} Sign-Up window.`, variant: 'default' });
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
            toast({ title: 'Error', description: error.message || `Failed to sign up with ${providerId}.`, variant: 'destructive' });
        }
    } finally {
        setLoading(null);
    }
  };

  const handleGoogleSignUp = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    handleSignUp(provider);
  };
  
  const handleMicrosoftSignUp = () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.addScope('email');
    provider.addScope('profile');
    handleSignUp(provider);
  };
  
  const handleYahooSignUp = () => {
    const provider = new OAuthProvider('yahoo.com');
    provider.addScope('email');
    provider.addScope('profile');
    handleSignUp(provider);
  };

  const handleAppleSignUp = () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    handleSignUp(provider);
  };

  const setupRecaptcha = () => {
    if (!auth || !recaptchaContainerRef.current) return;
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
      size: 'normal',
    });
    window.recaptchaVerifier.render();
  };

  const handleSendOtp = async () => {
    if (!phone || !isValidPhoneNumber(phone)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    setLoading('phone');
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmationResult;
      setStep('otp');
      toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
    } catch (error: any) {
      console.error("Phone sign-up error:", error);
      toast({ title: 'Error', description: error.message || "Failed to send OTP.", variant: 'destructive' });
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
      await createUserProfile(userCredential.user);
      toast({ title: "Account Created!", description: "Welcome to Calendar.ai." });
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
          src="https://t4.ftcdn.net/jpg/10/33/68/61/360_F_1033686185_RvraYXkGXH40OtR1nhmmQaIIbQQqHN5m.jpg"
          alt="Logo"
          width={100}
          height={100}
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
              <Button type="button" className="w-full" onClick={handleSendOtp} disabled={!!loading}>
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
            <Button variant="outline" type="button" className="w-full h-12" onClick={handleGoogleSignUp} disabled={!!loading}>
                {loading === 'google' ? <LoadingSpinner size="sm" /> : <GoogleIcon />} Sign up with Google
            </Button>
            <Button variant="outline" type="button" className="w-full h-12" onClick={handleMicrosoftSignUp} disabled={!!loading}>
                {loading === 'microsoft' ? <LoadingSpinner size="sm" /> : <MicrosoftIcon />} Sign up with Microsoft
            </Button>
            <Button variant="outline" type="button" className="w-full h-12" onClick={handleYahooSignUp} disabled={!!loading}>
                {loading === 'yahoo' ? <LoadingSpinner size="sm" /> : <YahooIcon />} Sign up with Yahoo
            </Button>
            <Button variant="outline" type="button" className="w-full h-12" onClick={handleAppleSignUp} disabled={!!loading}>
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

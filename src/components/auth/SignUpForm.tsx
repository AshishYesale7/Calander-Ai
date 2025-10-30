
'use client';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { createUserProfile } from '@/services/userService';

const GoogleIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>;
const MicrosoftIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Microsoft</title><path d="M11.4 21.9H2.1V12.6h9.3V21.9zm0-18.6H2.1v9.3h9.3V3.3zm9.3 0v9.3h9.3V3.3h-9.3zm0 18.6v-9.3h9.3v9.3h-9.3z" fill="currentColor"/></svg>;
const YahooIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Yahoo!</title><path d="M10.114 22.846c-.525 0-.85-.42-.683-.98l4.43-14.634c.167-.56-.125-.939-.683-.939H7.65c-.558 0-.83.402-.666.96l2.924 9.924c.166.558-.084.939-.642.939H3.456c-.558 0-.83.402-.666.96l2.924 9.924c.166.558.46.683.858.683h6.542zm10.204-16.41c0-.558-.425-.83-.983-.83h-5.25c-.558 0-.83.4-.667.96l5.225 17.66c.166.56.442.83.983.83h5.25c.558 0 .83-.4.667-.96z" fill="currentColor"/></svg>;
const AppleIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Apple</title><path d="M17.478.015C15.82-.475 12.285.355 10.59 2.155c-1.68 1.785-2.655 4.335-2.22 6.885 1.98-1.2 4.395-1.92 6.96-1.635 1.335.15 2.895.735 4.29 1.935-1.785.96-3.375 2.37-4.5 4.155-1.14 1.785-1.575 3.84-1.2 5.925 1.56.285 3.255-.165 4.785-1.185 1.545-.99 2.655-2.67 3.375-4.515.15-.36.21-.735.21-1.125 0-1.875-2.4-4.395-2.4-4.41-3.15-2.58-6.195-2.535-6.21-2.535-.18 0-3.345.03-5.595 2.1-1.56 1.485-2.85 3.96-2.85 6.66 0 4.335 2.82 6.27 5.535 6.27 2.115 0 3.51-1.125 5.595-1.125 2.085 0 3.33 1.125 5.61 1.125 2.745 0 5.235-2.4 5.235-6.36 0-3.285-2.235-5.52-4.44-6.81.18-.3.33-.615.465-.945z" fill="currentColor"/></svg>;

export default function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

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

  if (authLoading || user) {
      return (
          <Card className="frosted-glass p-6 md:p-8 flex items-center justify-center h-[420px]">
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

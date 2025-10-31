
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, Eraser, Trash2, Shield, PhoneAuthProvider, User } from 'lucide-react';
import { exportUserData, importUserData, formatUserData } from '@/services/dataBackupService';
import { anonymizeUserAccount } from '@/services/userService';
import { saveAs } from 'file-saver';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, reauthenticateWithPopup, reauthenticateWithCredential, signInWithPhoneNumber, type ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { GoogleIcon } from '../auth/SignInForm';

declare global {
  interface Window {
    reauthRecaptchaVerifier?: RecaptchaVerifier;
    reauthConfirmationResult?: ConfirmationResult;
  }
}

export default function DangerZoneSettings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [actionToConfirm, setActionToConfirm] = useState<'delete' | 'format' | null>(null);
    const [isReauthenticating, setIsReauthenticating] = useState(false);
    const [reauthStep, setReauthStep] = useState<'prompt' | 'otp' | 'verifying'>('prompt');
    const [reauthOtp, setReauthOtp] = useState('');
    const reauthRecaptchaContainerRef = useRef<HTMLDivElement>(null);
    
    const hasGoogleProvider = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
    const hasPhoneProvider = !!user?.phoneNumber;

    const handleExportData = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            const data = await exportUserData(user.uid);
            saveAs(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `futuresight-backup-${new Date().toISOString().split('T')[0]}.json`);
            toast({ title: 'Export Complete' });
        } catch (error) {
            toast({ title: 'Export Failed', variant: 'destructive' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !user) return;
        setIsImporting(true);
        try {
          const data = JSON.parse(await e.target.files[0].text());
          await importUserData(user.uid, data);
          toast({ title: 'Import successful', description: 'Reloading...' });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
          toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
        } finally {
          setIsImporting(false);
        }
    };

    const executeConfirmedAction = async () => {
      if (!user) return;
      setIsReauthenticating(true);
      try {
        if (actionToConfirm === 'delete') {
            await anonymizeUserAccount(user.uid);
            toast({ title: 'Account Deletion Initiated', description: 'Your account is scheduled for deletion in 30 days.' });
            await auth.signOut();
            window.location.href = '/';
        } else if (actionToConfirm === 'format') {
            await formatUserData(user.uid);
            toast({ title: 'Data Formatted', description: 'Your account data has been cleared. Reloading...' });
            setTimeout(() => window.location.reload(), 2000);
        }
      } catch (error: any) {
        toast({ title: `Error: ${actionToConfirm} failed`, description: error.message, variant: 'destructive' });
      } finally {
        setIsReauthenticating(false);
        setActionToConfirm(null);
      }
    };
    
    const reauthenticateAndExecute = async () => {
        if (!user) return;
        setIsReauthenticating(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await reauthenticateWithPopup(user, provider);
            await executeConfirmedAction();
        } catch (error: any) {
            toast({ title: 'Authentication Failed', description: 'Could not confirm your identity.', variant: 'destructive' });
        } finally {
            setIsReauthenticating(false);
            if((error as any).code !== 'auth/popup-closed-by-user') setActionToConfirm(null);
        }
    };

    const handleSendReauthOtp = async () => {
        if (!auth || !user?.phoneNumber) return;
        if (!reauthRecaptchaContainerRef.current) {
            console.error("reCAPTCHA container not found");
            return;
        }

        setIsReauthenticating(true);
        try {
            if (window.reauthRecaptchaVerifier) window.reauthRecaptchaVerifier.clear();
            const verifier = new RecaptchaVerifier(auth, reauthRecaptchaContainerRef.current, { size: 'normal' });
            window.reauthRecaptchaVerifier = verifier;
            window.reauthConfirmationResult = await signInWithPhoneNumber(auth, user.phoneNumber, verifier);
            setReauthStep('verifying');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to send OTP for verification.', variant: 'destructive' });
            setReauthStep('prompt'); // Go back to prompt on error
        } finally {
            setIsReauthenticating(false);
        }
    };

    const handleVerifyReauthOtp = async () => {
        const confirmationResult = window.reauthConfirmationResult;
        if (!confirmationResult || !reauthOtp || reauthOtp.length !== 6 || !auth.currentUser) return;
        
        setIsReauthenticating(true);
        try {
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, reauthOtp);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await executeConfirmedAction();
        } catch (error: any) {
            toast({ title: 'OTP Verification Failed', description: 'The code was incorrect.', variant: 'destructive' });
        } finally {
            setIsReauthenticating(false);
        }
    };
    
    return (
        <>
            <div className="space-y-6">
                <div className="space-y-3">
                    <h3 className="font-medium flex items-center"><Download className="mr-2 h-4 w-4" /> Data Management</h3>
                    <p className="text-sm text-muted-foreground">Export all your app data to a JSON file, or import a backup to restore your account.</p>
                    <div className="flex gap-2">
                        <Button onClick={handleExportData} variant="outline" disabled={isExporting} className="w-full">
                            {isExporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                            {isExporting ? 'Exporting...' : 'Export My Data'}
                        </Button>
                        <Button onClick={handleImportClick} variant="outline" disabled={isImporting} className="w-full">
                            {isImporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isImporting ? 'Importing...' : 'Import from Backup'}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                    </div>
                </div>

                <div className="space-y-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                    <h3 className="font-medium flex items-center text-destructive"><Shield className="mr-2 h-4 w-4" /> Danger Zone</h3>
                    <p className="text-sm text-destructive/80">These actions are irreversible and may require identity verification.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/20 hover:text-destructive w-full">
                                    <Eraser className="mr-2 h-4 w-4" /> Format All Data
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="frosted-glass">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Format all account data?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete all your goals, skills, custom events, and other content but keep your account and subscription active. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => setActionToConfirm('format')}>Format Data</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="frosted-glass">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will schedule your account and all data for permanent deletion in 30 days. You can log back in within this period to reclaim your account. This action cannot be undone after 30 days.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => setActionToConfirm('delete')}>Yes, delete my account</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => { if (!open) { setActionToConfirm(null); setReauthStep('prompt'); } }}>
                <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Please Confirm Your Identity</AlertDialogTitle>
                        <AlertDialogDescription>For your security, please verify your identity to confirm this action.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        {reauthStep === 'prompt' && (
                             <div className="space-y-4">
                                {hasGoogleProvider && (
                                    <Button onClick={reauthenticateAndExecute} disabled={isReauthenticating} className="w-full">
                                        {isReauthenticating && <LoadingSpinner size="sm" className="mr-2"/>}
                                        <GoogleIcon /> Continue with Google
                                    </Button>
                                )}
                                {hasGoogleProvider && hasPhoneProvider && <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div></div>}
                                {hasPhoneProvider && (
                                    <Button onClick={() => setReauthStep('otp')} className="w-full" disabled={isReauthenticating}>
                                        <User className="mr-2 h-4 w-4" /> Verify with Phone Number
                                    </Button>
                                )}
                                {!hasGoogleProvider && !hasPhoneProvider && <p className="text-sm text-destructive text-center">No verifiable sign-in method found.</p>}
                            </div>
                        )}
                        {reauthStep === 'otp' && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground text-center">An OTP will be sent to your registered number ({user?.phoneNumber}).</p>
                                <Button onClick={handleSendReauthOtp} className="w-full" disabled={isReauthenticating}>
                                    {isReauthenticating && <LoadingSpinner size="sm" className="mr-2" />} Send Verification Code
                                </Button>
                                <div id="reauth-recaptcha-container" ref={reauthRecaptchaContainerRef} className="flex justify-center"></div>
                            </div>
                        )}
                        {reauthStep === 'verifying' && (
                             <div className="space-y-4">
                                <Label htmlFor="reauth-otp">Enter OTP</Label>
                                <Input id="reauth-otp" value={reauthOtp} onChange={(e) => setReauthOtp(e.target.value)} placeholder="6-digit code" />
                                <Button onClick={handleVerifyReauthOtp} className="w-full" disabled={isReauthenticating}>
                                    {isReauthenticating && <LoadingSpinner size="sm" className="mr-2" />} Verify and Continue
                                </Button>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setActionToConfirm(null); setReauthStep('prompt'); }}>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


      
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Globe, Unplug, CheckCircle, Smartphone, Trash2, Bell, Send, Upload, Download, Eraser } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth, messaging } from '@/lib/firebase';
import { GoogleAuthProvider, linkWithPopup, RecaptchaVerifier, linkWithPhoneNumber, type ConfirmationResult, deleteUser, reauthenticateWithPopup, PhoneAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
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
import { getToken } from 'firebase/messaging';
import { createNotification } from '@/services/notificationService';
import { NotionLogo } from '../logo/NotionLogo';
import { saveUserFCMToken, anonymizeUserAccount, permanentlyDeleteUserData } from '@/services/userService';
import { exportUserData, importUserData, formatUserData } from '@/services/dataBackupService';
import { saveAs } from 'file-saver';


declare global {
  interface Window {
    recaptchaVerifierSettings?: RecaptchaVerifier;
    confirmationResultSettings?: ConfirmationResult;
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { apiKey: currentApiKey, setApiKey } = useApiKey();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [isNotionConnected, setIsNotionConnected] = useState<boolean | null>(null);

  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [linkingPhoneState, setLinkingPhoneState] = useState<'input' | 'otp-sent' | 'loading' | 'success'>('input');
  const [phoneForLinking, setPhoneForLinking] = useState<string | undefined>();
  const [otpForLinking, setOtpForLinking] = useState('');
  
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  
  // New state for re-authentication flow
  const [actionToConfirm, setActionToConfirm] = useState<'delete' | 'format' | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthStep, setReauthStep] = useState<'prompt' | 'otp' | 'verifying'>('prompt');
  const [reauthPhone, setReauthPhone] = useState<string | undefined>('');
  const [reauthOtp, setReauthOtp] = useState('');
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFormatConfirmOpen, setIsFormatConfirmOpen] = useState(false);

  const hasGoogleProvider = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
  const hasPhoneProvider = !!user?.phoneNumber;

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);


  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (testIntervalRef.current) clearInterval(testIntervalRef.current);
    };
  }, []);
  
  const clearRecaptcha = (containerId: string) => {
    const verifier = (window as any)[`recaptchaVerifier_${containerId}`];
    if (verifier) {
      verifier.clear();
    }
    const container = document.getElementById(containerId);
    if(container) {
        container.innerHTML = '';
    }
  };

  const setupRecaptcha = useCallback((containerId: string): RecaptchaVerifier | null => {
    if (!auth) return null;
    
    // Always clear the container first
    clearRecaptcha(containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`reCAPTCHA container with id "${containerId}" not found.`);
      return null;
    }
    
    const verifier = new RecaptchaVerifier(auth, container, {
      'size': 'invisible',
      'callback': () => console.log(`reCAPTCHA verified for ${containerId}`),
    });

    (window as any)[`recaptchaVerifier_${containerId}`] = verifier;
    return verifier;
  }, []);

  useEffect(() => {
    if (isOpen && isLinkingPhone && linkingPhoneState === 'input') {
      setupRecaptcha('recaptcha-container-settings');
    }
     if (isOpen && actionToConfirm && hasPhoneProvider && reauthStep === 'prompt') {
      setupRecaptcha('reauth-recaptcha-container');
    }
    
    return () => {
        clearRecaptcha('recaptcha-container-settings');
        clearRecaptcha('reauth-recaptcha-container');
    }
  }, [isOpen, isLinkingPhone, linkingPhoneState, setupRecaptcha, actionToConfirm, hasPhoneProvider, reauthStep]);

  const checkNotionStatus = async (userId: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/auth/notion/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setIsNotionConnected(data.isConnected);
    } catch (error) {
      setIsNotionConnected(false);
    }
  };


  useEffect(() => {
    if (!isOpen) {
       if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
       }
       if (testIntervalRef.current) {
            clearInterval(testIntervalRef.current);
            testIntervalRef.current = null;
       }
       setIsPolling(false);
       setIsLinkingPhone(false);
       setLinkingPhoneState('input');
       setPhoneForLinking(undefined);
       setOtpForLinking('');
       setIsSendingTest(false);
       // Reset re-auth state
       setActionToConfirm(null);
       setIsReauthenticating(false);
       setIsDeleteConfirmOpen(false);
       setIsFormatConfirmOpen(false);
       setReauthStep('prompt');
       setReauthOtp('');

    } else {
        setApiKeyInput(currentApiKey || '');
        if (user) {
            setIsGoogleConnected(null); 
            fetch('/api/auth/google/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            })
            .then(res => res.json())
            .then(data => setIsGoogleConnected(data.isConnected))
            .catch(() => {
                setIsGoogleConnected(false);
                toast({ title: 'Error', description: 'Could not verify Google connection status.', variant: 'destructive' });
            });
            checkNotionStatus(user.uid);
            setReauthPhone(user.phoneNumber || '');
        }
    }
  }, [currentApiKey, isOpen, toast, user]);
  

  const handleApiKeySave = () => {
    const trimmedKey = apiKeyInput.trim();
    setApiKey(trimmedKey ? trimmedKey : null);
    toast({
        title: trimmedKey ? 'API Key Saved' : 'API Key Cleared',
        description: trimmedKey
            ? 'Your custom Gemini API key has been saved.'
            : 'The app will use its fallback key if available.',
    });
  };
  
  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data === 'auth-success-google' || event.data === 'auth-success-notion') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => {
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  const handleConnectGoogle = async () => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to connect a Google account.', variant: 'destructive' });
        return;
    }

    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'google' })).toString('base64');
    const authUrl = `/api/auth/google/redirect?state=${encodeURIComponent(state)}`;

    if (hasGoogleProvider) {
        toast({ title: 'Opening Google...', description: 'Please authorize access in the new tab.' });
        window.open(authUrl, '_blank', 'width=500,height=600');
        return;
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/tasks');

    try {
        await linkWithPopup(user, provider);
        await refreshUser(); 
        
        toast({ title: 'Account Linked!', description: 'Now granting permissions in the new tab.' });
        window.open(authUrl, '_blank', 'width=500,height=600');

    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("Google link popup closed by user.");
        } else if (error.code === 'auth/credential-already-in-use') {
            toast({
                title: 'Google Account In Use',
                description: "This Google account is already linked to another user. Please sign out and sign in with Google to merge accounts.",
                variant: 'destructive',
                duration: 12000,
            });
        } else if (error.code === 'auth/provider-already-linked') {
             toast({ title: 'Re-authorizing...', description: 'Your account is already linked. Redirecting to grant permissions.' });
             window.open(authUrl, '_blank', 'width=500,height=600');
        } else {
            console.error("Google link error:", error);
            toast({
                title: 'Connection Failed',
                description: error.message || 'An unknown error occurred while connecting your Google account.',
                variant: 'destructive',
            });
        }
    }
  };

  const handleDisconnectGoogle = async () => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
      }
      try {
        const response = await fetch('/api/auth/google/revoke', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ userId: user.uid }),
        });
        if (response.ok) {
            setIsGoogleConnected(false);
            toast({ title: 'Success', description: 'Disconnected from Google account.' });
        } else {
            throw new Error('Failed to disconnect');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to disconnect from Google. Please try again.', variant: 'destructive' });
      }
  };
  
  const handleConnectNotion = () => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'notion' })).toString('base64');
    const authUrl = `/api/auth/notion/redirect?state=${encodeURIComponent(state)}`;
    window.open(authUrl, '_blank', 'width=500,height=600');
  };

  const handleDisconnectNotion = async () => {
    if (!user) return;
    toast({ title: "Coming Soon", description: "Notion disconnect functionality will be added soon." });
  };

  const handleSendLinkOtp = async () => {
      if (!auth.currentUser) { return; }
      const verifier = (window as any).recaptchaVerifier_recaptcha-container-settings;
      const fullPhoneNumber = typeof phoneForLinking === 'string' ? phoneForLinking : '';
      
      if (!verifier) {
         toast({ title: 'reCAPTCHA Error', description: "Verifier not ready. Please try again in a moment.", variant: 'destructive'});
         return;
      }
      if (!fullPhoneNumber || !isValidPhoneNumber(fullPhoneNumber)) {
        toast({ title: 'Invalid Phone Number', description: "Please enter a valid phone number.", variant: 'destructive'});
        return;
      }
      setLinkingPhoneState('loading');
      try {
        const confirmationResult = await linkWithPhoneNumber(auth.currentUser, fullPhoneNumber, verifier);
        window.confirmationResultSettings = confirmationResult;
        setLinkingPhoneState('otp-sent');
        toast({ title: 'OTP Sent', description: 'Please check your phone for the verification code.'});
      } catch (error: any) {
        console.error("Phone link error:", error);
        toast({ title: 'Error', description: error.message || "Failed to send OTP.", variant: 'destructive' });
        setLinkingPhoneState('input');
      }
  };

  const handleVerifyLinkOtp = async () => {
    if (!otpForLinking || otpForLinking.length !== 6) {
        toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit OTP.', variant: 'destructive' });
        return;
    }
    const confirmationResult = window.confirmationResultSettings;
    if (!confirmationResult) {
        toast({ title: 'Error', description: 'Verification expired. Please try again.', variant: 'destructive'});
        setLinkingPhoneState('input');
        return;
    }
    setLinkingPhoneState('loading');
    try {
        await confirmationResult.confirm(otpForLinking);
        await refreshUser(); 
        setLinkingPhoneState('success');
        toast({ title: 'Success!', description: 'Your phone number has been linked.' });
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/account-exists-with-different-credential') {
            toast({
                title: 'Account Exists With This Credential',
                description: "This phone number is already linked to another account. Please use the sign-in method associated with that account.",
                variant: 'destructive',
                duration: 9000
            });
        } else {
            console.error("OTP verification error:", error);
            toast({ title: 'Error', description: 'Invalid OTP or verification failed.', variant: 'destructive' });
        }
        setLinkingPhoneState('otp-sent');
    }
  };

  const executeConfirmedAction = async () => {
      if (!auth.currentUser) return;
      
      if (actionToConfirm === 'delete') {
          await anonymizeUserAccount(auth.currentUser.uid);
          toast({ title: 'Account Deletion Initiated', description: 'Your account is scheduled for deletion in 30 days.' });
          await auth.signOut();
          localStorage.clear();
          window.location.href = '/'; 
      } else if (actionToConfirm === 'format') {
          setIsFormatting(true);
          await formatUserData(auth.currentUser.uid);
          Object.keys(localStorage).forEach(key => key.startsWith('futureSight') && localStorage.removeItem(key));
          toast({ title: 'Format Complete', description: 'Your account data has been cleared. Reloading...' });
          setTimeout(() => window.location.reload(), 2000);
      }
      onOpenChange(false);
  }

  const reauthenticateAndExecute = async () => {
    if (!auth.currentUser) {
        toast({ title: 'Error', description: 'No user is currently logged in.', variant: 'destructive' });
        return;
    }
    setIsReauthenticating(true);
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await reauthenticateWithPopup(auth.currentUser, provider);
        await executeConfirmedAction();
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            toast({ title: "Cancelled", description: "You cancelled the confirmation process.", variant: 'default' });
        } else {
            console.error("Re-authentication failed:", error);
            toast({ title: 'Authentication Failed', description: 'Could not confirm your identity. Please try again.', variant: 'destructive' });
        }
    } finally {
        setIsReauthenticating(false);
        setActionToConfirm(null);
    }
  };
  
  const handleSendReauthOtp = async () => {
    const verifier = (window as any).recaptchaVerifier_reauth-recaptcha-container;
    if (!verifier || !reauthPhone || !isValidPhoneNumber(reauthPhone)) {
        toast({ title: 'Invalid Phone Number', variant: 'destructive'});
        return;
    }
    setIsReauthenticating(true);
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, reauthPhone, verifier);
        window.confirmationResultSettings = confirmationResult;
        setReauthStep('otp');
    } catch (error: any) {
        toast({ title: 'Error', description: 'Failed to send OTP for verification.', variant: 'destructive' });
    } finally {
        setIsReauthenticating(false);
    }
  };

  const handleVerifyReauthOtp = async () => {
    const confirmationResult = window.confirmationResultSettings;
    if (!confirmationResult || !reauthOtp || reauthOtp.length !== 6) {
        toast({ title: 'Invalid OTP', variant: 'destructive' });
        return;
    }
    if (!auth.currentUser) return;
    
    setIsReauthenticating(true);
    try {
        const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, reauthOtp);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await executeConfirmedAction();
    } catch (error: any) {
        toast({ title: 'OTP Verification Failed', description: 'The code was incorrect. Please try again.', variant: 'destructive' });
    } finally {
        setIsReauthenticating(false);
    }
  };
  
  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(false);
    setActionToConfirm('delete');
  };

  const handleFormatData = () => {
    setIsFormatConfirmOpen(false);
    setActionToConfirm('format');
  };


  const handleRequestNotificationPermission = async () => {
    if (!messaging || !user) {
      toast({ title: 'Error', description: 'Push notifications are not supported on this browser or you are not signed in.', variant: 'destructive' });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("VAPID key is missing.");
            toast({ title: 'Configuration Error', description: 'Push notification setup is incomplete on the server.', variant: 'destructive' });
            return;
        }
        const fcmToken = await getToken(messaging, { vapidKey });
        if (fcmToken) {
            await saveUserFCMToken(user.uid, fcmToken);
            toast({ title: 'Success', description: 'Push notifications have been enabled!' });
        } else {
            throw new Error("Could not retrieve notification token.");
        }
      } else {
        toast({ title: 'Notifications Denied', description: 'You can enable notifications from your browser settings later.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error getting notification permission or token:', error);
      toast({ title: 'Error', description: 'Could not enable push notifications.', variant: 'destructive' });
    }
  };

  const handleSendTestNotification = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    if (isSendingTest) {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
        testIntervalRef.current = null;
      }
      setIsSendingTest(false);
      toast({ title: 'Test Stopped', description: 'Stopped sending test notifications.' });
    } else {
      setIsSendingTest(true);
      toast({ title: 'Test Started', description: 'Sending a notification every 5 seconds. Switch tabs to see them.' });
      await createNotification({
        userId: user.uid,
        type: 'system_alert',
        message: `Test Notification - ${new Date().toLocaleTimeString()}`,
        link: '/dashboard'
      });
      testIntervalRef.current = setInterval(async () => {
        if (!user) {
            if (testIntervalRef.current) clearInterval(testIntervalRef.current);
            setIsSendingTest(false);
            return;
        }
        await createNotification({
            userId: user.uid,
            type: 'system_alert',
            message: `Test Notification - ${new Date().toLocaleTimeString()}`,
            link: '/dashboard'
        });
      }, 5000);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    toast({ title: 'Exporting...', description: 'Gathering your data. This may take a moment.' });
    try {
        const data = await exportUserData(user.uid);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        saveAs(blob, `futuresight-backup-${new Date().toISOString().split('T')[0]}.json`);
        toast({ title: 'Export Complete', description: 'Your data has been downloaded.' });
    } catch (error) {
        console.error("Export error:", error);
        toast({ title: 'Export Failed', description: 'Could not export your data.', variant: 'destructive' });
    } finally {
        setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    toast({ title: 'Importing...', description: 'Reading and parsing your data file.' });

    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (!content) {
            toast({ title: 'Error', description: 'Could not read file content.', variant: 'destructive' });
            setIsImporting(false);
            return;
        }
        try {
            const dataToImport = JSON.parse(content);
            await importUserData(user.uid, dataToImport);
            toast({ title: 'Import Successful', description: 'Your data has been imported. The app will now reload.' });
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            toast({ title: 'Import Failed', description: `Invalid file or data format. ${error.message}`, variant: 'destructive' });
        } finally {
            setIsImporting(false);
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary flex items-center">
            <KeyRound className="mr-2 h-5 w-5" /> Settings
          </DialogTitle>
          <DialogDescription>
            Manage application settings, API keys, and integrations here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-3 px-2">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <Bell className="mr-2 h-4 w-4" /> Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                    Receive reminders for your upcoming events directly on your device.
                </p>
                {notificationPermission === 'granted' ? (
                     <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Notifications Enabled
                        </p>
                    </div>
                ) : (
                    <Button onClick={handleRequestNotificationPermission} variant="outline" className="w-full" disabled={notificationPermission === 'denied'}>
                        {notificationPermission === 'denied' ? 'Permission Denied in Browser' : 'Enable Push Notifications'}
                    </Button>
                )}
            </div>

            <Separator/>
            
            <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-primary">
                    <Send className="mr-2 h-4 w-4" /> Test Push Notification
                </Label>
                 <p className="text-sm text-muted-foreground">
                    Use this to test if you receive notifications when the app is in the background.
                </p>
                <Button onClick={handleSendTestNotification} variant={isSendingTest ? 'destructive' : 'outline'} className="w-full" disabled={notificationPermission !== 'granted'}>
                    {isSendingTest ? <LoadingSpinner size="sm" className="mr-2"/> : <Send className="mr-2 h-4 w-4" />}
                    {notificationPermission !== 'granted' 
                        ? 'Enable Notifications First' 
                        : isSendingTest 
                            ? 'Stop Test'
                            : 'Start Test (1 every 5s)'
                    }
                </Button>
            </div>

            <Separator/>

            <div className="space-y-3 px-2">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <Globe className="mr-2 h-4 w-4" /> Google Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                    Connect your Google account to sync your calendar events and emails.
                </p>
                {isGoogleConnected === null ? (
                    <div className="flex items-center space-x-2 h-10">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">Checking connection status...</span>
                    </div>
                ) : isGoogleConnected ? (
                    <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Connected
                        </p>
                        <Button onClick={handleDisconnectGoogle} variant="destructive">
                            <Unplug className="mr-2 h-4 w-4" /> Disconnect
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConnectGoogle} variant="outline" className="w-full" disabled={isPolling}>
                        {isPolling ? <LoadingSpinner size="sm" className="mr-2"/> : <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>}
                        {isPolling ? 'Waiting for connection...' : 'Connect with Google'}
                    </Button>
                )}
            </div>

            <Separator/>

            <div className="space-y-3 px-2">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <NotionLogo className="mr-2 h-5 w-5" /> Notion Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                    Connect your Notion account to sync tasks from your databases.
                </p>
                {isNotionConnected === null ? (
                    <div className="flex items-center space-x-2 h-10">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">Checking connection status...</span>
                    </div>
                ) : isNotionConnected ? (
                    <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Connected
                        </p>
                        <Button onClick={handleDisconnectNotion} variant="destructive">
                            <Unplug className="mr-2 h-4 w-4" /> Disconnect
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConnectNotion} variant="outline" className="w-full">
                       <NotionLogo className="mr-2 h-4 w-4" />
                       Connect with Notion
                    </Button>
                )}
            </div>
            
            <Separator/>

            <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-primary">
                    <Smartphone className="mr-2 h-4 w-4" /> Phone Number
                </Label>
                {user?.phoneNumber ? (
                    <div className="flex items-center justify-between h-10">
                        <p className="text-sm text-green-400 font-medium flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Linked: {user.phoneNumber}
                        </p>
                    </div>
                ) : (
                    <>
                    {!isLinkingPhone ? (
                        <Button onClick={() => setIsLinkingPhone(true)} variant="outline" className="w-full">Link Phone Number</Button>
                    ) : (
                        <>
                            {linkingPhoneState === 'input' && (
                                <div className="space-y-4">
                                    <div className="space-y-2 phone-input-container">
                                        <Label htmlFor="phone-link" className="text-xs">Enter your phone number</Label>
                                        <PhoneInput
                                            id="phone-link"
                                            international
                                            defaultCountry="US"
                                            placeholder="Enter phone number"
                                            value={phoneForLinking}
                                            onChange={setPhoneForLinking}
                                        />
                                    </div>
                                    <Button onClick={handleSendLinkOtp} disabled={linkingPhoneState === 'loading'} className="w-full">
                                        {linkingPhoneState === 'loading' && <LoadingSpinner size="sm" className="mr-2"/>}
                                        Send OTP
                                    </Button>
                                    <div id="recaptcha-container-settings"></div>
                                </div>
                            )}
                            {(linkingPhoneState === 'otp-sent' || linkingPhoneState === 'loading') && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="otp-link" className="text-xs">Enter 6-digit OTP</Label>
                                        <Input
                                            id="otp-link"
                                            type="text"
                                            value={otpForLinking}
                                            onChange={(e) => setOtpForLinking(e.target.value)}
                                            placeholder="123456"
                                        />
                                    </div>
                                    <Button onClick={handleVerifyLinkOtp} disabled={linkingPhoneState === 'loading'} className="w-full">
                                        {linkingPhoneState === 'loading' && <LoadingSpinner size="sm" className="mr-2"/>}
                                        Verify & Link Phone
                                    </Button>
                                </div>
                            )}
                            {linkingPhoneState === 'success' && (
                                <p className="text-sm text-green-400 font-medium flex items-center h-10">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Phone number linked successfully!
                                </p>
                            )}
                        </>
                    )}
                    </>
                )}
            </div>
            
            <Separator />
            
            <div className="space-y-3 px-2">
                 <Label className="font-semibold text-base flex items-center text-primary">
                    <KeyRound className="mr-2 h-4 w-4" /> Custom API Key
                </Label>
                <p className="text-sm text-muted-foreground">
                    Optionally provide your own Google Gemini API key. Your key is saved securely to your account. If empty, a shared key is used.
                </p>
                <div className="space-y-2">
                    <Label htmlFor="geminiApiKey" className="text-sm font-medium">Your Gemini API Key</Label>
                    <div className="flex gap-2">
                        <Input
                            id="geminiApiKey"
                            type="password"
                            placeholder="Enter your Gemini API key"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <Button onClick={handleApiKeySave} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            <Separator />

             <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-primary">
                    <Download className="mr-2 h-4 w-4" /> Data Management
                </Label>
                <p className="text-sm text-muted-foreground">
                    Export all your app data to a JSON file, or import a backup to restore your account.
                </p>
                <div className="flex gap-2">
                    <Button onClick={handleExportData} variant="outline" className="w-full" disabled={isExporting}>
                        {isExporting ? <LoadingSpinner size="sm" className="mr-2"/> : <Download className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Exporting...' : 'Export My Data'}
                    </Button>
                    <Button onClick={handleImportClick} variant="outline" className="w-full" disabled={isImporting}>
                        {isImporting ? <LoadingSpinner size="sm" className="mr-2"/> : <Upload className="mr-2 h-4 w-4" />}
                        {isImporting ? 'Importing...' : 'Import from Backup'}
                    </Button>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-3 px-2">
                <Label className="font-semibold text-base flex items-center text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Danger Zone
                </Label>
                 <AlertDialog open={isFormatConfirmOpen} onOpenChange={setIsFormatConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                       <Eraser className="mr-2 h-4 w-4" />
                       Format All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Format all account data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your goals, skills, custom events, and other content. Your account and subscription will NOT be deleted. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleFormatData}
                      >
                        Yes, format my data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="frosted-glass">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. You cannot undo this action.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDeleteAccount}
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        <DialogFooter>
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
        
        {/* Re-authentication Dialog */}
        <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
            <AlertDialogContent className="frosted-glass">
                <AlertDialogHeader>
                    <AlertDialogTitle>Please Confirm Your Identity</AlertDialogTitle>
                    <AlertDialogDescription>
                        For your security, please verify your identity to confirm this action.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  {(hasGoogleProvider) && (
                     <Button onClick={reauthenticateAndExecute} disabled={isReauthenticating} className="w-full">
                        {isReauthenticating && reauthStep !== 'otp' ? <LoadingSpinner size="sm" className="mr-2"/> : <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.63-4.5 1.63-5.42 0-9.82-4.4-9.82-9.82s4.4-9.82 9.82-9.82c3.1 0 5.14 1.25 6.32 2.39l2.44-2.44C20.44 1.89 17.13 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12.04-4.82 12.04-12.04 0-.82-.07-1.62-.2-2.4z" fill="currentColor"/></svg>}
                        Continue with Google
                    </Button>
                  )}
                  {hasPhoneProvider && (
                      <div className="space-y-4">
                        {reauthStep === 'prompt' && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">An OTP will be sent to your registered phone number ({user?.phoneNumber}).</p>
                                <Button onClick={handleSendReauthOtp} className="w-full" disabled={isReauthenticating}>
                                    {isReauthenticating && <LoadingSpinner size="sm" className="mr-2" />}
                                    Send Verification Code
                                </Button>
                                <div id="reauth-recaptcha-container"></div>
                            </div>
                        )}
                        {reauthStep === 'otp' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reauth-otp">Enter OTP</Label>
                                    <Input id="reauth-otp" value={reauthOtp} onChange={(e) => setReauthOtp(e.target.value)} placeholder="6-digit code" />
                                </div>
                                <Button onClick={handleVerifyReauthOtp} className="w-full" disabled={isReauthenticating}>
                                    {isReauthenticating && <LoadingSpinner size="sm" className="mr-2" />}
                                    Verify and Continue
                                </Button>
                            </div>
                        )}
                    </div>
                  )}
                  {(!hasGoogleProvider && !hasPhoneProvider) && (
                      <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-md">
                        <p>Cannot perform this action. Your account has no verifiable sign-in methods.</p>
                        <p className="mt-2">Please link Google or a phone number first.</p>
                      </div>
                  )}
                </div>
                 <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setActionToConfirm(null)}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

    
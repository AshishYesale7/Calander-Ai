
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { KeyRound, Unplug, Smartphone, User, Shield, HardDrive, Clock, Bell, Info, Globe, Send, CheckCircle, PhoneAuthProvider as FirebasePhoneAuthProvider } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth, messaging } from '@/lib/firebase';
import { linkWithPhoneNumber, RecaptchaVerifier, PhoneAuthProvider, type ConfirmationResult, reauthenticateWithPopup, GoogleAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { NotionLogo } from '../logo/NotionLogo';
import { GoogleIcon, MicrosoftIcon } from '../auth/SignInForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import DateTimeSettings from './DateTimeSettings';
import DangerZoneSettings from './DangerZoneSettings';
import { sendWebPushNotification } from '@/ai/flows/send-notification-flow';
import { saveUserFCMToken } from '@/services/userService';
import { Switch } from '../ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
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
  
  // Integrations state
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [isNotionConnected, setIsNotionConnected] = useState<boolean | null>(null);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState<boolean | null>(null);
  
  // Phone linking state
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [linkingPhoneState, setLinkingPhoneState] = useState<'input' | 'otp-sent' | 'loading' | 'success'>('input');
  const [phoneForLinking, setPhoneForLinking] = useState<string | undefined>();
  const [otpForLinking, setOtpForLinking] = useState('');

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isTestingPush, setIsTestingPush] = useState(false);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const hasGoogleProvider = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
  const hasPhoneProvider = !!user?.phoneNumber;

  const checkStatuses = async () => {
    if (!user) return;
    const googleRes = await fetch('/api/auth/google/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    setIsGoogleConnected((await googleRes.json()).isConnected);

    const notionRes = await fetch('/api/auth/notion/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    setIsNotionConnected((await notionRes.json()).isConnected);
    
    const microsoftRes = await fetch('/api/auth/microsoft/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    setIsMicrosoftConnected((await microsoftRes.json()).isConnected);
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setApiKeyInput(currentApiKey || '');
      checkStatuses();
    }
  }, [isOpen, currentApiKey, user]);

  const handleApiKeySave = () => {
    setApiKey(apiKeyInput.trim() ? apiKeyInput.trim() : null);
    toast({ title: 'API Key Saved' });
  };
  
  const handleConnectGoogle = () => {
    if (!user) return;
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'google' })).toString('base64');
    window.open(`/api/auth/google/redirect?state=${encodeURIComponent(state)}`, '_blank', 'width=500,height=600');
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;
    await fetch('/api/auth/google/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    checkStatuses();
    toast({ title: 'Disconnected from Google' });
  };
  
  const handleConnectNotion = () => {
    if (!user) return;
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'notion' })).toString('base64');
    window.open(`/api/auth/notion/redirect?state=${encodeURIComponent(state)}`, '_blank', 'width=500,height=600');
  };
  
  const handleConnectMicrosoft = () => {
    if (!user) return;
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'microsoft' })).toString('base64');
    window.open(`/api/auth/microsoft/redirect?state=${encodeURIComponent(state)}`, '_blank', 'width=500,height=600');
  };

  const handleSendLinkOtp = async () => {
    if (!auth.currentUser || !phoneForLinking || !isValidPhoneNumber(phoneForLinking)) {
      toast({ title: 'Invalid Phone Number', variant: 'destructive' });
      return;
    }
    setLinkingPhoneState('loading');
    try {
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, { 'size': 'invisible' });
      window.confirmationResult = await linkWithPhoneNumber(auth.currentUser, phoneForLinking, verifier);
      setLinkingPhoneState('otp-sent');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLinkingPhoneState('input');
    }
  };

  const handleVerifyLinkOtp = async () => {
    if (!otpForLinking || otpForLinking.length !== 6 || !window.confirmationResult) return;
    setLinkingPhoneState('loading');
    try {
      await window.confirmationResult.confirm(otpForLinking);
      await refreshUser();
      setLinkingPhoneState('success');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLinkingPhoneState('otp-sent');
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!messaging || !user) {
      toast({ title: 'Error', description: 'Push notifications not supported or not signed in.', variant: 'destructive' });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) throw new Error("VAPID key is missing.");
        const fcmToken = await getToken(messaging, { vapidKey });
        if (fcmToken) {
            await saveUserFCMToken(user.uid, fcmToken);
            toast({ title: 'Success', description: 'Push notifications enabled!' });
        } else { throw new Error("Could not retrieve token."); }
      } else {
        toast({ title: 'Notifications Denied', variant: 'default' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not enable push notifications.', variant: 'destructive' });
    }
  };
  
  const handleTestPush = async () => {
    if (!user) return;
    setIsTestingPush(true);
    toast({ title: 'Sending Test Push Notification...'});
    try {
        const result = await sendWebPushNotification({
            userId: user.uid,
            title: 'Test Notification ✅',
            body: 'If you see this, push notifications are working!',
            url: '/dashboard',
        });
        if (!result.success) throw new Error(result.message);
    } catch (error: any) {
        toast({ title: 'Test Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsTestingPush(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl frosted-glass flex flex-col h-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg text-primary">Settings</DialogTitle>
          <DialogDescription>Manage your application settings and integrations.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="account" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="datetime">Date &amp; Time</TabsTrigger>
              <TabsTrigger value="danger" className="text-destructive">Danger Zone</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1 mt-4">
              <div className="p-1 pr-4">
                <TabsContent value="account">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="font-medium flex items-center"><KeyRound className="mr-2 h-4 w-4" /> Custom API Key</Label>
                      <p className="text-sm text-muted-foreground">Optionally provide your own Google Gemini API key.</p>
                      <div className="flex gap-2"><Input id="geminiApiKey" type="password" placeholder="Enter Gemini API key" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} /><Button onClick={handleApiKeySave}>Save</Button></div>
                    </div>
                    <Separator/>
                    <div className="space-y-3">
                      <Label className="font-medium flex items-center"><Smartphone className="mr-2 h-4 w-4" /> Phone Number</Label>
                      {hasPhoneProvider ? <p className="text-sm text-green-400 font-medium">Linked: {user.phoneNumber}</p> : <Button onClick={() => setIsLinkingPhone(true)} variant="outline" className="w-full">Link Phone Number</Button>}
                      {isLinkingPhone && linkingPhoneState === 'input' && <div className="space-y-4"><div className="space-y-2 phone-input-container"><Label htmlFor="phone-link">Enter phone number</Label><PhoneInput id="phone-link" international defaultCountry="US" value={phoneForLinking} onChange={setPhoneForLinking}/></div><Button onClick={handleSendLinkOtp}>Send OTP</Button><div ref={recaptchaContainerRef} id="recaptcha-container-settings"></div></div>}
                      {(isLinkingPhone && linkingPhoneState === 'otp-sent') && <div className="space-y-4"><Input value={otpForLinking} onChange={e => setOtpForLinking(e.target.value)} placeholder="6-digit OTP" /><Button onClick={handleVerifyLinkOtp}>Verify &amp; Link</Button></div>}
                      {linkingPhoneState === 'success' && <p className="text-sm text-green-400">Phone linked successfully!</p>}
                    </div>
                     <Separator/>
                    <div className="space-y-3">
                        <Label className="font-medium flex items-center"><Bell className="mr-2 h-4 w-4" /> Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive reminders for your upcoming events directly on your device.</p>
                        <div className="flex items-center space-x-2">
                           <Switch id="push-notifications" checked={notificationPermission === 'granted'} onCheckedChange={(checked) => { if(checked) handleRequestNotificationPermission()}} disabled={notificationPermission === 'denied'} />
                           <Label htmlFor="push-notifications">{notificationPermission === 'granted' ? "Enabled" : (notificationPermission === 'denied' ? "Blocked" : "Disabled")}</Label>
                        </div>
                         {notificationPermission !== 'granted' && <p className="text-xs text-muted-foreground"><Info className="inline h-3 w-3 mr-1" />To enable, click the switch and "Allow" when your browser prompts you.</p>}
                        {notificationPermission === 'granted' && <Button onClick={handleTestPush} variant="secondary" size="sm" disabled={isTestingPush}>{isTestingPush ? <LoadingSpinner size="sm" className="mr-2"/> : null} Test Push Notification</Button>}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="integrations">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><GoogleIcon /> Google</p>{isGoogleConnected ? <Button onClick={handleDisconnectGoogle} variant="destructive" size="sm"><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={handleConnectGoogle} variant="outline" size="sm">Connect</Button>}</div>
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><MicrosoftIcon /> Microsoft</p>{isMicrosoftConnected ? <Button variant="destructive" size="sm" disabled><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={handleConnectMicrosoft} variant="outline" size="sm">Connect</Button>}</div>
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><NotionLogo className="h-5 w-5 mr-2" />Notion</p>{isNotionConnected ? <Button variant="destructive" size="sm" onClick={handleDisconnectNotion}><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={handleConnectNotion} variant="outline" size="sm">Connect</Button>}</div>
                  </div>
                </TabsContent>
                <TabsContent value="datetime">
                  <DateTimeSettings />
                </TabsContent>
                <TabsContent value="danger">
                  <DangerZoneSettings />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

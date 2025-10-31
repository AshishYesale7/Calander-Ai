
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { KeyRound, Unplug, Smartphone, CheckCircle, Bell, Send, Globe, User, Shield } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth, messaging } from '@/lib/firebase';
import { GoogleAuthProvider, linkWithPhoneNumber, RecaptchaVerifier, PhoneAuthProvider, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { getToken } from 'firebase/messaging';
import { sendWebPushNotification } from '@/ai/flows/send-notification-flow';
import { NotionLogo } from '../logo/NotionLogo';
import { saveUserFCMToken } from '@/services/userService';
import { GoogleIcon, MicrosoftIcon } from '../auth/SignInForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import DateTimeSettings from './DateTimeSettings';
import DangerZoneSettings from './DangerZoneSettings';
import { Switch } from '../ui/switch';


declare global {
  interface Window {
    linkRecaptchaVerifier?: RecaptchaVerifier;
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
  
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [isNotionConnected, setIsNotionConnected] = useState<boolean | null>(null);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState<boolean | null>(null);
  
  const [isLinkingPhone, setIsLinkingPhone] = useState(false);
  const [linkingPhoneState, setLinkingPhoneState] = useState<'input' | 'otp-sent' | 'loading' | 'success'>('input');
  const [phoneForLinking, setPhoneForLinking] = useState<string | undefined>();
  const [otpForLinking, setOtpForLinking] = useState('');
  
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isTestingPush, setIsTestingPush] = useState(false);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const hasPhoneProvider = !!user?.phoneNumber;

  const checkStatuses = useCallback(async () => {
    if (!user) return;
    try {
      const [googleRes, notionRes, microsoftRes] = await Promise.all([
        fetch('/api/auth/google/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
        fetch('/api/auth/notion/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
        fetch('/api/auth/microsoft/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
      ]);
      setIsGoogleConnected((await googleRes.json()).isConnected);
      setIsNotionConnected((await notionRes.json()).isConnected);
      setIsMicrosoftConnected((await microsoftRes.json()).isConnected);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not verify integration statuses.', variant: 'destructive' });
    }
  }, [user, toast]);

  useEffect(() => {
    if (isOpen && user) {
      setApiKeyInput(currentApiKey || '');
      checkStatuses();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    } else {
        setIsLinkingPhone(false);
        setLinkingPhoneState('input');
    }
  }, [isOpen, currentApiKey, user, checkStatuses]);

  const handleApiKeySave = () => {
    setApiKey(apiKeyInput.trim() ? apiKeyInput.trim() : null);
    toast({ title: 'API Key Saved' });
  };
  
  const handleConnect = (provider: 'google' | 'microsoft' | 'notion') => {
    if (!user) return;
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider })).toString('base64');
    const authUrl = `/api/auth/${provider}/redirect?state=${encodeURIComponent(state)}`;
    window.open(authUrl, '_blank', 'width=500,height=600');
  };

  const handleDisconnect = async (provider: 'google') => {
    if (!user) return;
    try {
      const response = await fetch(`/api/auth/${provider}/revoke`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
      if (response.ok) {
        await checkStatuses();
        toast({ title: 'Success', description: `Disconnected from ${provider.charAt(0).toUpperCase() + provider.slice(1)}.` });
      } else throw new Error(`Failed to disconnect from ${provider}`);
    } catch (error) {
      toast({ title: 'Error', description: `Failed to disconnect. Please try again.`, variant: 'destructive' });
    }
  };

  const handleSendLinkOtp = async () => {
    if (!auth.currentUser || !phoneForLinking || !isValidPhoneNumber(phoneForLinking) || !recaptchaContainerRef.current) return;
    setLinkingPhoneState('loading');
    try {
      if (window.linkRecaptchaVerifier) window.linkRecaptchaVerifier.clear();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { 'size': 'normal' });
      window.linkRecaptchaVerifier = verifier;
      window.confirmationResult = await linkWithPhoneNumber(auth.currentUser, phoneForLinking, verifier);
      setLinkingPhoneState('otp-sent');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLinkingPhoneState('input');
    }
  };

  const handleVerifyLinkOtp = async () => {
    if (!otpForLinking || !window.confirmationResult) return;
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
    if (!messaging || !user) return;
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
        const result = await sendWebPushNotification({ userId: user.uid, title: 'Test Notification ✅', body: 'If you see this, push notifications are working!', url: '/dashboard' });
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
          <DialogDescription>Manage application settings and preferences.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="account" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="datetime">Date & Time</TabsTrigger>
              <TabsTrigger value="danger" className="text-destructive">Danger Zone</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1 mt-4">
              <div className="p-1 pr-4">
                <TabsContent value="account">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center"><KeyRound className="mr-2 h-4 w-4" /> Custom API Key</h3>
                      <p className="text-sm text-muted-foreground">Optionally provide your own Google Gemini API key.</p>
                      <div className="flex gap-2"><Input id="geminiApiKey" type="password" placeholder="Enter Gemini API key" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} /><Button onClick={handleApiKeySave}>Save</Button></div>
                    </div>
                    <Separator/>
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center"><Smartphone className="mr-2 h-4 w-4" /> Phone Number</h3>
                      {hasPhoneProvider ? <p className="text-sm text-green-400 font-medium flex items-center"><CheckCircle className="mr-2 h-4 w-4" />Linked: {user.phoneNumber}</p> : <Button onClick={() => setIsLinkingPhone(true)} variant="outline" className="w-full">Link Phone Number</Button>}
                      {isLinkingPhone && linkingPhoneState === 'input' && <div className="space-y-4"><Label htmlFor="phone-link">Enter phone number</Label><PhoneInput id="phone-link" international defaultCountry="US" value={phoneForLinking} onChange={setPhoneForLinking}/><Button onClick={handleSendLinkOtp}>Send OTP</Button><div ref={recaptchaContainerRef} id="recaptcha-container-settings"></div></div>}
                      {isLinkingPhone && linkingPhoneState === 'otp-sent' && <div className="space-y-4"><Input value={otpForLinking} onChange={e => setOtpForLinking(e.target.value)} placeholder="6-digit OTP" /><Button onClick={handleVerifyLinkOtp}>Verify & Link</Button></div>}
                      {linkingPhoneState === 'success' && <p className="text-sm text-green-400">Phone linked successfully!</p>}
                    </div>
                     <Separator/>
                    <div className="space-y-3">
                        <h3 className="font-medium flex items-center"><Bell className="mr-2 h-4 w-4" /> Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive reminders for your upcoming events directly on your device.</p>
                        <div className="flex items-center space-x-2">
                           <Switch id="push-notifications" checked={notificationPermission === 'granted'} onCheckedChange={(checked) => { if(checked) handleRequestNotificationPermission()}} disabled={notificationPermission === 'denied'} />
                           <Label htmlFor="push-notifications">{notificationPermission === 'granted' ? "Enabled" : (notificationPermission === 'denied' ? "Blocked" : "Disabled")}</Label>
                        </div>
                        {notificationPermission === 'granted' && <Button onClick={handleTestPush} variant="secondary" size="sm" disabled={isTestingPush}>{isTestingPush ? <LoadingSpinner size="sm" className="mr-2"/> : null} Test Push Notification</Button>}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="integrations">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><GoogleIcon /> Google</p>{isGoogleConnected ? <Button onClick={() => handleDisconnect('google')} variant="destructive" size="sm"><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={() => handleConnect('google')} variant="outline" size="sm">Connect</Button>}</div>
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><MicrosoftIcon /> Microsoft</p>{isMicrosoftConnected ? <Button variant="destructive" size="sm" disabled><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={() => handleConnect('microsoft')} variant="outline" size="sm">Connect</Button>}</div>
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><NotionLogo className="h-5 w-5 mr-2" />Notion</p>{isNotionConnected ? <Button variant="destructive" size="sm" disabled><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={() => handleConnect('notion')} variant="outline" size="sm">Connect</Button>}</div>
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

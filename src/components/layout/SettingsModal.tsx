
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
import { KeyRound, Globe, Unplug, CheckCircle, Smartphone, User, Shield, Info, HardDrive, Clock } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth, messaging } from '@/lib/firebase';
import { GoogleAuthProvider, linkWithPhoneNumber, RecaptchaVerifier, PhoneAuthProvider, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { NotionLogo } from '../logo/NotionLogo';
import { GoogleIcon, MicrosoftIcon } from '../auth/SignInForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import DateTimeSettings from './DateTimeSettings';
import DangerZoneSettings from './DangerZoneSettings'; // Import the new component

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

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const hasGoogleProvider = user?.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);
  const hasPhoneProvider = !!user?.phoneNumber;

  const checkGoogleStatus = async () => {
    if (!user) return;
    const res = await fetch('/api/auth/google/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    const data = await res.json();
    setIsGoogleConnected(data.isConnected);
  };
  const checkNotionStatus = async () => {
    if (!user) return;
    const res = await fetch('/api/auth/notion/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    const data = await res.json();
    setIsNotionConnected(data.isConnected);
  };
  const checkMicrosoftStatus = async () => {
    if (!user) return;
    const res = await fetch('/api/auth/microsoft/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    const data = await res.json();
    setIsMicrosoftConnected(data.isConnected);
  };

  useEffect(() => {
    if (isOpen && user) {
      setApiKeyInput(currentApiKey || '');
      checkGoogleStatus();
      checkNotionStatus();
      checkMicrosoftStatus();
    }
  }, [isOpen, currentApiKey, user]);

  const handleApiKeySave = () => {
    setApiKey(apiKeyInput.trim() ? apiKeyInput.trim() : null);
    toast({ title: 'API Key Saved' });
  };
  
  const handleConnectGoogle = async () => {
    if (!user) return;
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider: 'google' })).toString('base64');
    window.open(`/api/auth/google/redirect?state=${encodeURIComponent(state)}`, '_blank', 'width=500,height=600');
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;
    await fetch('/api/auth/google/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) });
    checkGoogleStatus();
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
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, { 'size': 'normal' });
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, phoneForLinking, verifier);
      window.confirmationResult = confirmationResult;
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
              <div className="pr-4">
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
                  </div>
                </TabsContent>
                <TabsContent value="integrations">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><GoogleIcon /> Google</p>{isGoogleConnected ? <Button onClick={handleDisconnectGoogle} variant="destructive" size="sm"><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={handleConnectGoogle} variant="outline" size="sm">Connect</Button>}</div>
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><MicrosoftIcon /> Microsoft</p>{isMicrosoftConnected ? <Button variant="destructive" size="sm" disabled><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={handleConnectMicrosoft} variant="outline" size="sm">Connect</Button>}</div>
                    <div className="flex items-center justify-between h-10"><p className="text-sm font-medium flex items-center"><NotionLogo className="h-5 w-5 mr-2" />Notion</p>{isNotionConnected ? <Button variant="destructive" size="sm" disabled><Unplug className="mr-2 h-4 w-4" /> Disconnect</Button> : <Button onClick={handleConnectNotion} variant="outline" size="sm">Connect</Button>}</div>
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

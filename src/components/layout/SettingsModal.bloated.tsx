
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Unplug, CheckCircle, Smartphone, Bell, User, Link2, FileText, Globe, UserX, UserCheck, PhoneAuthProvider, Brain, Mic } from 'lucide-react';
import { Separator } from '../ui/separator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { auth, messaging } from '@/lib/firebase';
import { GoogleAuthProvider, reauthenticateWithPopup, signInWithPhoneNumber, type ConfirmationResult, RecaptchaVerifier, OAuthProvider } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import DateTimeSettings from './DateTimeSettings';
import DangerZoneSettings from './DangerZoneSettings';
import { cn } from '@/lib/utils';
import { GoogleIcon, MicrosoftIcon } from '../auth/SignInForm';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useApiKey } from '@/hooks/use-api-key';
import { saveUserFCMToken } from '@/services/userService';
import { getToken } from 'firebase/messaging';
import BrowserNotificationTesting from './BrowserNotificationTesting';


const IntegrationRow = ({
  icon,
  name,
  description,
  isConnected,
  isComingSoon,
  accounts,
  onConnect,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  isConnected: boolean | null;
  isComingSoon?: boolean;
  accounts: { email: string | null; uid: string }[];
  onConnect: () => void;
  onDisconnect: (email: string) => void;
}) => {
  
  return (
    <div className="space-y-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <div className="flex items-start justify-between">
            <div>
                <h4 className="font-semibold">{name}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-card flex-shrink-0">{icon}</div>
        </div>
        
        {isComingSoon ? (
            <Badge variant="outline">Coming Soon</Badge>
        ) : isConnected === null ? (
            <div className="flex justify-center py-4"><LoadingSpinner size="sm"/></div>
        ) : accounts.length > 0 ? (
            <ScrollArea className="max-h-40 pr-3">
              <div className="space-y-3">
                  {accounts.map(account => (
                      <div key={account.uid} className="p-3 bg-background/50 rounded-md border space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                  <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span className="text-sm font-medium truncate" title={account.email || 'Unknown Email'}>{account.email || 'Connected Account'}</span>
                              </div>
                              <Button onClick={() => onDisconnect(account.email!)} variant="destructive" size="sm" className="h-7 text-xs w-full sm:w-auto">
                                  <Unplug className="mr-1.5 h-3 w-3" /> Disconnect
                              </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                  <Switch id={`oneway-${account.uid}`} defaultChecked />
                                  <Label htmlFor={`oneway-${account.uid}`} className="text-xs">One-way sync</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Switch id={`twoway-${account.uid}`} />
                                  <Label htmlFor={`twoway-${account.uid}`} className="text-xs">Two-way sync</Label>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
            </ScrollArea>
        ) : null}
        
        {!isComingSoon && (
            <div>
                <Button onClick={onConnect} variant="outline" size="sm" className="w-full">
                    <Link2 className="mr-2 h-4 w-4"/>
                    {accounts.length > 0 ? 'Connect Another Account' : 'Connect Account'}
                </Button>
            </div>
        )}
    </div>
  );
};


interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isVoiceActivationEnabled: boolean;
  onToggleVoiceActivation: (enabled: boolean) => void;
}

export default function SettingsModal({ isOpen, onOpenChange, isVoiceActivationEnabled, onToggleVoiceActivation }: SettingsModalProps) {
  const { apiKey: currentApiKey, setApiKey } = useApiKey();
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState<boolean | null>(null);
  
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isTestingPush, setIsTestingPush] = useState(false);

  const checkStatuses = useCallback(async () => {
    if (!user) return;
    try {
      const [googleRes, microsoftRes] = await Promise.all([
        fetch('/api/auth/google/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
        fetch('/api/auth/microsoft/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.uid }) }),
      ]);
      setIsGoogleConnected((await googleRes.json()).isConnected);
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
    }
  }, [isOpen, currentApiKey, user, checkStatuses]);

  const handleApiKeySave = () => {
    setApiKey(apiKeyInput.trim() ? apiKeyInput.trim() : null);
    toast({ title: 'API Key Saved' });
  };

  const handleConnect = (provider: 'google' | 'microsoft') => {
    if (!user) return;
    const state = Buffer.from(JSON.stringify({ userId: user.uid, provider })).toString('base64');
    const authUrl = `/api/auth/${provider}/redirect?state=${encodeURIComponent(state)}`;
    window.open(authUrl, '_blank', 'width=500,height=600');
  };

  const handleDisconnect = async (provider: 'google' | 'microsoft') => {
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
        const result = await (await fetch('/api/test-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, title: 'Test Notification ✅', body: 'If you see this, push notifications are working!', url: '/dashboard' }),
        })).json();
        if (!result.success) throw new Error(result.message);
    } catch (error: any) {
        toast({ title: 'Test Failed', description: error.message, variant: 'destructive' });
    } finally {
        setIsTestingPush(false);
    }
  };
  
  const googleAccounts = user?.providerData.filter(p => p.providerId === 'google.com') || [];
  const microsoftAccounts = user?.providerData.filter(p => p.providerId === 'microsoft.com') || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl frosted-glass flex flex-col h-auto max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-headline text-lg text-primary">Settings</DialogTitle>
          <DialogDescription>Manage application settings and preferences.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="account" className="h-full flex flex-col">
            <div className="px-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="datetime">Date & Time</TabsTrigger>
                <TabsTrigger value="danger" className="text-destructive">Danger Zone</TabsTrigger>
                </TabsList>
            </div>
            <div className="flex-1 mt-4 overflow-y-auto">
              <div className="px-6 pb-6">
                <TabsContent value="account">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center"><KeyRound className="mr-2 h-4 w-4" /> Custom API Key</h3>
                      <p className="text-sm text-muted-foreground">Optionally provide your own Google Gemini API key.</p>
                      <div className="flex gap-2"><Input id="geminiApiKey" type="password" placeholder="Enter Gemini API key" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} /><Button onClick={handleApiKeySave}>Save</Button></div>
                    </div>
                    <Separator/>
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center"><Mic className="mr-2 h-4 w-4" /> Voice Activation</h3>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                            <Label htmlFor="voice-activation-switch">Enable "Hey Cafe"</Label>
                            <p className="text-xs text-muted-foreground">Activate the AI by voice.</p>
                        </div>
                        <Switch id="voice-activation-switch" checked={isVoiceActivationEnabled} onCheckedChange={onToggleVoiceActivation} />
                      </div>
                    </div>
                    <Separator/>
                    <div className="space-y-3">
                        <h3 className="font-medium flex items-center"><Bell className="mr-2 h-4 w-4" /> Push Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive reminders for your upcoming events directly on your device.</p>
                        <div className="flex items-center space-x-2">
                          <Switch id="push-notifications" checked={notificationPermission === 'granted'} onCheckedChange={(checked) => { if(checked) handleRequestNotificationPermission()}} disabled={notificationPermission === 'denied'} />
                          <Label htmlFor="push-notifications">{notificationPermission === 'granted' ? "Enabled" : (notificationPermission === 'denied' ? "Blocked" : "Disabled")}</Label>
                        </div>
                        {notificationPermission === 'granted' && <Button onClick={handleTestPush} variant="secondary" size="sm" disabled={isTestingPush}>{isTestingPush && <LoadingSpinner size="sm" className="mr-2"/>} Test Push Notification</Button>}
                    </div>
                    <Separator/>
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center"><Brain className="mr-2 h-4 w-4" /> Browser Notifications</h3>
                        <p className="text-sm text-muted-foreground">Test your Firebase → Browser notification system with real scenarios like follows, reminders, and calls.</p>
                        
                        {/* Status Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Firebase Listener</div>
                            <div className={`text-sm font-medium ${isListening ? 'text-green-600' : 'text-red-600'}`}>
                              {isListening ? '✅ Active' : '❌ Inactive'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Browser Support</div>
                            <div className={`text-sm font-medium ${browserNotificationStatus.isSupported ? 'text-green-600' : 'text-red-600'}`}>
                              {browserNotificationStatus.isSupported ? '✅ Supported' : '❌ Not Supported'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Tests Sent</div>
                            <div className="text-sm font-medium text-blue-600">{testCount}</div>
                          </div>
                        </div>

                        {/* Browser Permission */}
                        {browserNotificationStatus.isSupported && !browserNotificationStatus.isGranted && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 mb-2">Browser notifications need permission to work</p>
                            <Button onClick={requestBrowserPermission} size="sm" variant="outline">
                              Enable Browser Notifications
                            </Button>
                          </div>
                        )}

                        {/* Test Instructions */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">💡 How to Test</h4>
                          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Switch to another tab to make this tab inactive</li>
                            <li>Click any test button below</li>
                            <li>Browser notification should appear outside the browser</li>
                            <li>Click the notification to return to this tab</li>
                          </ol>
                        </div>

                        {/* Test Buttons */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button 
                              onClick={() => handleTestBrowserNotification()} 
                              variant="outline" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              {isTestingBrowser && <LoadingSpinner size="sm" className="mr-2"/>}
                              🎲 Random Test
                            </Button>
                            <Button 
                              onClick={handleDirectBrowserTest} 
                              variant="outline" 
                              size="sm"
                            >
                              ⚡ Direct Test
                            </Button>
                          </div>

                          {/* Specific Test Types */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <Button 
                              onClick={() => handleTestBrowserNotification('new_follower')} 
                              variant="ghost" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              👥 Follow
                            </Button>
                            <Button 
                              onClick={() => handleTestBrowserNotification('reminder')} 
                              variant="ghost" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              ⏰ Reminder
                            </Button>
                            <Button 
                              onClick={() => handleTestBrowserNotification('call')} 
                              variant="ghost" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              📞 Call
                            </Button>
                            <Button 
                              onClick={() => handleTestBrowserNotification('achievement')} 
                              variant="ghost" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              🏆 Achievement
                            </Button>
                            <Button 
                              onClick={() => handleTestBrowserNotification('event')} 
                              variant="ghost" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              📅 Event
                            </Button>
                            <Button 
                              onClick={() => handleTestBrowserNotification('deadline')} 
                              variant="ghost" 
                              size="sm"
                              disabled={isTestingBrowser}
                            >
                              🚨 Deadline
                            </Button>
                          </div>

                          {/* Auto Testing */}
                          <div className="pt-2 border-t">
                            <Button 
                              onClick={startAutoTesting} 
                              variant={isAutoTesting ? "destructive" : "secondary"}
                              size="sm"
                              className="w-full"
                            >
                              {isAutoTesting ? (
                                <>
                                  <LoadingSpinner size="sm" className="mr-2"/>
                                  Stop Auto Testing
                                </>
                              ) : (
                                '🚀 Start Auto Testing (10s intervals)'
                              )}
                            </Button>
                            {isAutoTesting && (
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                Sending notifications every 10 seconds. Switch tabs to see them!
                              </p>
                            )}
                          </div>
                        </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="integrations">
                   <div className="space-y-3">
                    <IntegrationRow
                      icon={<GoogleIcon />}
                      name="Google Calendar"
                      description="Connect your Google accounts to sync calendars and tasks."
                      isConnected={isGoogleConnected}
                      accounts={googleAccounts}
                      onConnect={() => handleConnect('google')}
                      onDisconnect={() => handleDisconnect('google')}
                    />
                    <IntegrationRow
                      icon={<MicrosoftIcon />}
                      name="Office 365 Calendar"
                      description="Connect your Microsoft accounts for calendar sync."
                      isConnected={isMicrosoftConnected}
                      accounts={microsoftAccounts}
                      onConnect={() => handleConnect('microsoft')}
                      onDisconnect={() => { toast({ title: "Coming Soon", description: "Disconnecting Microsoft accounts will be available soon."}) }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="datetime">
                  <DateTimeSettings />
                </TabsContent>
                <TabsContent value="danger">
                  <DangerZoneSettings />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

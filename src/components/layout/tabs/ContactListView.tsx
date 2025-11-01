
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useToast } from '@/hooks/use-toast';
import type { PublicUserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Copy } from 'lucide-react';
import { getGoogleContactsOnApp } from '@/services/googleContactsService';
import { getMicrosoftContactsOnApp } from '@/services/microsoftContactsService';
import { GoogleIcon, MicrosoftIcon } from '@/components/auth/SignInForm';

interface ExternalContact {
    displayName: string;
    email?: string;
    phone?: string;
}

export default function ContactListView() {
    const { user } = useAuth();
    const { setChattingWith } = useChat();
    const { toast } = useToast();
    const [appUsers, setAppUsers] = useState<PublicUserProfile[]>([]);
    const [externalContacts, setExternalContacts] = useState<ExternalContact[]>([]);
    const [isLoading, setIsLoading] = useState<'google' | 'microsoft' | false>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchContacts = useCallback(async (provider: 'google' | 'microsoft') => {
        if (!user) return;

        const authAndFetch = async () => {
            setIsLoading(provider);
            setError(null);
            try {
                const fetchFn = provider === 'google' ? getGoogleContactsOnApp : getMicrosoftContactsOnApp;
                const { appUsers: fetchedAppUsers, externalContacts: fetchedExternalContacts } = await fetchFn(user.uid);
                
                setAppUsers(prev => {
                    const existingUids = new Set(prev.map(c => c.uid));
                    const newContacts = fetchedAppUsers.filter(c => !existingUids.has(c.uid));
                    return [...prev, ...newContacts];
                });

                setExternalContacts(prev => {
                    const existingNames = new Set(prev.map(c => c.displayName));
                    const newContacts = fetchedExternalContacts.filter(c => !existingNames.has(c.displayName));
                    return [...prev, ...newContacts];
                });

                if (fetchedAppUsers.length === 0 && fetchedExternalContacts.length === 0) {
                     setError(`No new contacts found from ${provider}.`);
                }
            } catch (error: any) {
                if (error.message.includes('permission')) {
                  setError(`Please grant contact permissions for ${provider} and try again.`);
                } else {
                  setError(error.message || `Failed to fetch ${provider} contacts.`);
                }
            } finally {
                setIsLoading(false);
            }
        };

        const state = Buffer.from(JSON.stringify({ userId: user.uid, provider })).toString('base64');
        const authUrl = `/api/auth/${provider}/redirect?state=${encodeURIComponent(state)}`;
        
        const authWindow = window.open(authUrl, '_blank', 'width=500,height=600');

        const handleAuthMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data === `auth-success-${provider}`) {
                authWindow?.close();
                toast({ title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected`, description: 'Fetching your contacts...' });
                await authAndFetch();
                window.removeEventListener('message', handleAuthMessage);
            }
        };

        window.addEventListener('message', handleAuthMessage);

    }, [user, toast]);
    
    const handleInvite = () => {
      const url = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "The invite link has been copied to your clipboard.",
      });
    };
    
    useEffect(() => {
      const handleAuthSuccess = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data === 'auth-success-google') handleFetchContacts('google');
          if (event.data === 'auth-success-microsoft') handleFetchContacts('microsoft');
      };
      window.addEventListener('message', handleAuthSuccess);
      return () => window.removeEventListener('message', handleAuthSuccess);
    }, [handleFetchContacts]);

    return (
        <>
            <div className="p-4 border-b border-border/30 flex-shrink-0">
                <h2 className="text-lg font-semibold">Find Contacts</h2>
                <p className="text-xs text-muted-foreground mt-1">Discover which of your contacts are on Calendar.ai.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleFetchContacts('google')} disabled={!!isLoading}>
                        {isLoading === 'google' ? <LoadingSpinner size="sm" className="mr-2"/> : <GoogleIcon />}
                        Find on Google
                    </Button>
                    <Button variant="outline" onClick={() => handleFetchContacts('microsoft')} disabled={!!isLoading}>
                        {isLoading === 'microsoft' ? <LoadingSpinner size="sm" className="mr-2"/> : <MicrosoftIcon />}
                        Find on Microsoft
                    </Button>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-4">
                    {error && <p className="text-xs text-destructive text-center p-2">{error}</p>}
                    
                    {appUsers.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">On Calendar.ai</h3>
                            {appUsers.map(contact => (
                                <button key={contact.uid} onClick={() => setChattingWith(contact)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={contact.photoURL || undefined} alt={contact.displayName}/>
                                        <AvatarFallback>{contact.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="text-sm font-medium truncate">{contact.displayName}</p>
                                        <p className="text-xs text-muted-foreground">@{contact.username}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {externalContacts.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-1">Invite to Calendar.ai</h3>
                            {externalContacts.map((contact, index) => (
                                <div key={index} className="w-full flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{contact.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-medium truncate">{contact.displayName}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={handleInvite}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Invite
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && appUsers.length === 0 && externalContacts.length === 0 && !error && (
                         <p className="text-xs text-muted-foreground text-center p-8">Click a provider above to find your contacts.</p>
                    )}
                    {isLoading && appUsers.length === 0 && externalContacts.length === 0 && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
                </div>
            </ScrollArea>
        </>
    );
}

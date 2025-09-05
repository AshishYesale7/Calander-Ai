
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { fetchCodingStats, type AllPlatformsUserData } from '@/ai/flows/fetch-coding-stats-flow';
import { useApiKey } from '@/hooks/use-api-key';
import { useToast } from '@/hooks/use-toast';

const platforms = [
  { id: 'codeforces', name: 'Codeforces', icon: 'https://cdn.iconscout.com/icon/free/png-256/free-code-forces-3628695-3030187.png' },
  { id: 'leetcode', name: 'Leetcode', icon: 'https://cdn.iconscout.com/icon/free/png-256/free-leetcode-3628885-3030128.png' },
  { id: 'codechef', name: 'Codechef', icon: 'https://cdn.iconscout.com/icon/free/png-256/free-codechef-3628876-3030119.png' },
  { id: 'geeksforgeeks', name: 'Geeks for Geeks', icon: 'https://img.icons8.com/color/48/geeksforgeeks.png' },
  { id: 'codestudio', name: 'Codestudio', icon: 'https://img.icons8.com/color/48/coding-ninjas.png' },
] as const;

type PlatformId = typeof platforms[number]['id'];

interface CodefolioLoginProps {
  onLoginSuccess: (data: AllPlatformsUserData) => void;
  onClose: () => void;
}

export default function CodefolioLogin({ onLoginSuccess, onClose }: CodefolioLoginProps) {
  const [usernames, setUsernames] = useState<Partial<Record<PlatformId, string>>>({});
  const [verified, setVerified] = useState<Partial<Record<PlatformId, boolean>>>({});
  const [isLoading, setIsLoading] = useState<PlatformId | 'continue' | null>(null);
  const { apiKey } = useApiKey();
  const { toast } = useToast();

  const handleUsernameChange = (platform: PlatformId, value: string) => {
    setUsernames(prev => ({ ...prev, [platform]: value }));
    setVerified(prev => ({ ...prev, [platform]: false }));
  };

  const handleVerify = async (platform: PlatformId) => {
    const username = usernames[platform];
    if (!username) {
      toast({ title: "Username required", description: `Please enter a username for ${platform}.`, variant: "destructive" });
      return;
    }
    setIsLoading(platform);
    try {
      const result = await fetchCodingStats({ [platform]: username, apiKey });
      const platformData = result[platform];
      if (platformData && !platformData.error) {
        toast({ title: "Success", description: `${platform} user "${username}" found!` });
        setVerified(prev => ({ ...prev, [platform]: true }));
      } else {
        throw new Error(platformData?.error || `User "${username}" not found on ${platform}.`);
      }
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(null);
    }
  };

  const handleContinue = async () => {
    const verifiedUsernames = Object.entries(usernames)
      .filter(([key, value]) => value && verified[key as PlatformId])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    if (Object.keys(verifiedUsernames).length === 0) {
      toast({ title: "No Verified Platforms", description: "Please enter and verify at least one username.", variant: "destructive" });
      return;
    }

    setIsLoading('continue');
    try {
      const result = await fetchCodingStats({ ...verifiedUsernames, apiKey });
      onLoginSuccess(result);
    } catch(error: any) {
       toast({ title: "Error", description: `Failed to fetch data: ${error.message}`, variant: "destructive" });
    } finally {
        setIsLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8" onClick={onClose}><X/></Button>
        <Card className="w-full max-w-2xl frosted-glass">
            <CardContent className="p-8 text-center">
                <Image src="/logos/codefolio-logo.svg" alt="Codefolio Ally Logo" width={80} height={80} className="mx-auto mb-4" />
                <h1 className="text-2xl font-bold font-headline text-primary">Welcome</h1>
                <p className="text-muted-foreground mb-8">Please enter your usernames to continue.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4 text-left">
                      {platforms.map(platform => (
                          <div key={platform.id}>
                              <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                                  <Image src={platform.icon} alt={`${platform.name} logo`} width={20} height={20} className="rounded-full"/>
                                  {platform.name}
                              </label>
                              <div className="flex items-center gap-2">
                                  <Input 
                                      placeholder={`Enter ${platform.name} username`}
                                      value={usernames[platform.id] || ''}
                                      onChange={e => handleUsernameChange(platform.id, e.target.value)}
                                      className="bg-background/50 text-black"
                                  />
                                  <Button 
                                      variant="link" 
                                      className="p-0 text-accent"
                                      onClick={() => handleVerify(platform.id)}
                                      disabled={!!isLoading || !usernames[platform.id]}
                                  >
                                      {isLoading === platform.id ? <Loader2 className="h-4 w-4 animate-spin"/> : verified[platform.id] ? 'Verified' : 'Verify'}
                                  </Button>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                     <Button 
                        size="lg" 
                        className="bg-accent hover:bg-accent/90 text-lg rounded-full w-32 h-32 flex flex-col" 
                        onClick={handleContinue}
                        disabled={!!isLoading}
                    >
                        {isLoading === 'continue' ? (
                            <Loader2 className="h-8 w-8 animate-spin"/>
                        ) : (
                          <>
                            <span className="text-base">Continue</span>
                            <ArrowRight className="mt-1 h-6 w-6"/>
                          </>
                        )}
                    </Button>
                  </div>
                </div>

                <div className="md:hidden mt-8">
                   <Button 
                        size="lg" 
                        className="w-full bg-accent hover:bg-accent/90 text-lg" 
                        onClick={handleContinue}
                        disabled={!!isLoading}
                    >
                        {isLoading === 'continue' ? <Loader2 className="h-5 w-5 animate-spin"/> : "Continue"}
                        <ArrowRight className="ml-2 h-5 w-5"/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

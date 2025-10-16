

'use client';

import type { FC } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { Edit, Github, Linkedin, Twitter, Save, X, Trash2, AtSign } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import type { UserPreferences } from '@/types';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import CountryFlag from '../leaderboard/CountryFlag';
import { timezones } from '@/lib/timezones';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onOpenChange }) => {
  const { user, refreshUser } = useAuth();
  const { backgroundImage } = useTheme();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for form fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [countryCode, setCountryCode] = useState<string | null>(null);


  // This will now be handled by the streak context
  const stats = {
    goals: 3,
    skills: 4,
    resources: 5,
  };

  useEffect(() => {
    if (user && isOpen) {
      setIsLoading(true);
      getUserProfile(user.uid).then(profile => {
        if (profile) {
            setDisplayName(profile.displayName || user.displayName || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setGithubUrl(profile.socials?.github || '');
            setLinkedinUrl(profile.socials?.linkedin || '');
            setTwitterUrl(profile.socials?.twitter || '');
            setCountryCode(profile.countryCode || null);
        } else {
             setDisplayName(user.displayName || '');
             setUsername(user.email?.split('@')[0] || '');
        }
      }).finally(() => setIsLoading(false));
    }
  }, [user, isOpen]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleSaveChanges = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
        await updateUserProfile(user.uid, {
            displayName: displayName,
            username: username,
            photoURL: user.photoURL,
            bio: bio,
            socials: {
                github: githubUrl,
                linkedin: linkedinUrl,
                twitter: twitterUrl
            },
            countryCode,
        });
        await refreshUser(); // This will refresh the user object in AuthContext
        toast({ title: 'Success', description: 'Your profile has been updated.' });
        setIsEditing(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    timezones.forEach(tz => {
      const parts = tz.split('/');
      if (parts.length > 1 && !['Etc', 'SystemV', 'US'].includes(parts[0])) {
          countrySet.add(parts[0].replace(/_/g, ' '));
      }
    });
    return Array.from(countrySet).sort();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md frosted-glass p-0 border-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            This modal contains your profile information, stats, and social links.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div className="h-32 w-full relative">
             <Image
                src={backgroundImage || "https://images.unsplash.com/photo-1554147090-e1221a04a0625?q=80&w=2070&auto=format&fit=crop"}
                alt="Cover"
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
                data-ai-hint="abstract background"
              />
          </div>
         
          <div className="p-6 pt-0">
            <div className="flex justify-between items-end -mt-12">
                 <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                        <AvatarFallback className="text-3xl">
                            {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                     {countryCode && !isEditing && (
                        <div className="absolute -bottom-1 -right-1">
                          <CountryFlag countryCode={countryCode} className="h-7 w-7 border-2 border-background"/>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {isEditing && (
                        <Button variant="outline" size="sm" className="mb-2" onClick={handleSaveChanges} disabled={isLoading}>
                            {isLoading ? <LoadingSpinner size="sm" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />} Save
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="mb-2" onClick={handleEditToggle}>
                        {isEditing ? <X className="mr-2 h-4 w-4"/> : <Edit className="mr-2 h-4 w-4" />} {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                </div>
            </div>

            <div className="mt-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                        className="text-2xl font-bold !bg-transparent !border-0 !border-b-2 !rounded-none !p-1 !h-auto focus-visible:ring-0"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Name"
                    />
                     <div className="flex items-center gap-2">
                        <AtSign className="h-5 w-5 text-muted-foreground" />
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            className="!bg-transparent !border-0 !border-b-2 !rounded-none !p-1 !h-auto focus-visible:ring-0 text-sm"
                        />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-primary">{displayName || "Anonymous User"}</h2>
                    <p className="text-sm text-muted-foreground">@{username || user?.email?.split('@')[0]}</p>
                  </>
                )}
                <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <div className="mt-6">
                <h3 className="font-semibold text-foreground">About</h3>
                {isEditing ? (
                    <Textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="mt-1"
                    />
                ) : (
                    <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{bio || 'No bio yet. Click "Edit Profile" to add one.'}</p>
                )}
            </div>

             {isEditing && (
                <div className="mt-6 space-y-2">
                    <Label htmlFor="country-select">Country</Label>
                    <div className="flex items-center gap-2">
                        <Select value={countryCode || undefined} onValueChange={(value) => setCountryCode(value === "none" ? null : value)}>
                            <SelectTrigger id="country-select" className="flex-1">
                                <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {countries.map(country => (
                                    <SelectItem key={country} value={country}>
                                    {country}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Button variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => setCountryCode(null)} title="Clear selection">
                            <Trash2 className="h-4 w-4" />
                         </Button>
                    </div>
                </div>
              )}

            <div className="mt-6">
                <h3 className="font-semibold text-foreground mb-2">Connect</h3>
                {isEditing ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <Github className="h-5 w-5 text-muted-foreground" />
                           <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub URL" />
                        </div>
                        <div className="flex items-center gap-2">
                           <Linkedin className="h-5 w-5 text-muted-foreground" />
                           <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" />
                        </div>
                        <div className="flex items-center gap-2">
                           <Twitter className="h-5 w-5 text-muted-foreground" />
                           <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="Twitter/X URL" />
                        </div>
                    </div>
                ) : (
                    <div className="flex space-x-3">
                        <Button variant="outline" size="icon" asChild>
                            <a href={githubUrl || '#'} target="_blank" rel="noopener noreferrer" className={!githubUrl ? 'pointer-events-none opacity-50' : ''}><Github className="h-5 w-5"/></a>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href={linkedinUrl || '#'} target="_blank" rel="noopener noreferrer" className={!linkedinUrl ? 'pointer-events-none opacity-50' : ''}><Linkedin className="h-5 w-5"/></a>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <a href={twitterUrl || '#'} target="_blank" rel="noopener noreferrer" className={!twitterUrl ? 'pointer-events-none opacity-50' : ''}><Twitter className="h-5 w-5"/></a>
                        </Button>
                    </div>
                )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;


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
import { Edit, Github, Linkedin, Twitter, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import type { UserPreferences } from '@/types';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ProfileModal: FC<ProfileModalProps> = ({ isOpen, onOpenChange }) => {
  const { user } = useAuth();
  const { backgroundImage } = useTheme();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for form fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');

  // Mock data for stats - in a real app, this would come from user data
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
            setBio(profile.bio || '');
            setGithubUrl(profile.socials?.github || '');
            setLinkedinUrl(profile.socials?.linkedin || '');
            setTwitterUrl(profile.socials?.twitter || '');
        } else {
             setDisplayName(user.displayName || '');
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
            bio: bio,
            socials: {
                github: githubUrl,
                linkedin: linkedinUrl,
                twitter: twitterUrl
            }
        });
        toast({ title: 'Success', description: 'Your profile has been updated.' });
        setIsEditing(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };

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
                 <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-3xl">
                        {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
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
                    <Input
                        className="text-2xl font-bold !bg-transparent !border-0 !border-b-2 !rounded-none !p-1 !h-auto focus-visible:ring-0"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Name"
                    />
                ) : (
                    <h2 className="text-2xl font-bold text-primary">{displayName || "Anonymous User"}</h2>
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

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xl font-bold text-accent">{stats.goals}</p><p className="text-xs text-muted-foreground">Goals</p></div>
                <div><p className="text-xl font-bold text-accent">{stats.skills}</p><p className="text-xs text-muted-foreground">Skills</p></div>
                <div><p className="text-xl font-bold text-accent">{stats.resources}</p><p className="text-xs text-muted-foreground">Resources</p></div>
            </div>

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


'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserByUsername, updateUserProfile, type PublicUserProfile } from '@/services/userService';
import { getStreakData, type StreakData } from '@/services/streakService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AtSign, Github, Linkedin, Twitter, MessageSquare, UserPlus, Flame, Edit, Save, X, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import CountryFlag from '@/components/leaderboard/CountryFlag';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { timezones } from '@/lib/timezones';
import { uploadProfileImage } from '@/services/storageService';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const ProfileHeader = ({ profile, children, isEditing, onEditToggle, onSave, onCancel, isLoading, onFileSelect, uploadProgress }: { profile: PublicUserProfile, children: React.ReactNode, isEditing: boolean, onEditToggle: () => void, onSave: () => void, onCancel: () => void, isLoading: boolean, onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, uploadProgress: number | null }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="relative">
            <div className="h-40 w-full relative bg-muted rounded-t-lg overflow-hidden">
                <Image
                    src={"https://images.unsplash.com/photo-1554147090-e1221a04a0625?q=80&w=2070&auto=format&fit=crop"}
                    alt="Cover"
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="abstract background"
                />
            </div>
            <div className="p-6 pt-0">
                <div className="flex justify-between items-end -mt-16">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                            <AvatarImage src={profile.photoURL || ''} alt={profile.displayName} />
                            <AvatarFallback className="text-4xl">
                                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="h-8 w-8 text-white"/>
                                <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*" className="hidden"/>
                            </button>
                        )}
                        {profile.countryCode && !isEditing && (
                            <div className="absolute bottom-2 right-2">
                            <CountryFlag countryCode={profile.countryCode} className="h-8 w-8 border-2 border-background"/>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {children}
                        {isEditing ? (
                            <>
                            <Button variant="outline" size="sm" className="mb-2" onClick={onSave} disabled={isLoading}>
                                    {isLoading ? <LoadingSpinner size="sm" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />} Save
                                </Button>
                                <Button variant="ghost" size="sm" className="mb-2" onClick={onCancel}>
                                    <X className="mr-2 h-4 w-4"/> Cancel
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" size="sm" className="mb-2" onClick={onEditToggle}>
                                <Edit className="mr-2 h-4 w-4"/> Edit Profile
                            </Button>
                        )}
                    </div>
                </div>
                {uploadProgress !== null && (
                    <div className="mt-2">
                        <Progress value={uploadProgress} className="w-full h-2" />
                        <p className="text-xs text-muted-foreground text-center mt-1">Uploading image...</p>
                    </div>
                )}
            </div>
        </div>
    )
};

const ProfileInfoCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Card className="frosted-glass">
        <CardHeader className="p-4 flex flex-row items-center gap-2">
            <Icon className="h-5 w-5 text-accent"/>
            <h3 className="font-semibold text-lg text-primary">{title}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            {children}
        </CardContent>
    </Card>
);


export default function UserProfilePage() {
    const { user: currentUser, refreshUser } = useAuth();
    const params = useParams();
    const { toast } = useToast();
    const username = Array.isArray(params.username) ? params.username[0] : params.username as string;
    
    const [profile, setProfile] = useState<PublicUserProfile | null>(null);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    
    // Editable state
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editGithub, setEditGithub] = useState('');
    const [editLinkedin, setEditLinkedin] = useState('');
    const [editTwitter, setEditTwitter] = useState('');
    const [editCountryCode, setEditCountryCode] = useState<string | null>(null);
    
    // New state for image upload
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const isOwnProfile = currentUser?.uid === profile?.uid;

    const fetchProfile = useCallback(async (usernameToFetch: string) => {
        if (!usernameToFetch) return;
        setIsLoading(true);
        setError(null);
        try {
            const fetchedProfile = await getUserByUsername(usernameToFetch);
            if (fetchedProfile) {
                setProfile(fetchedProfile);
                setEditDisplayName(fetchedProfile.displayName || '');
                setEditUsername(fetchedProfile.username || '');
                setEditBio(fetchedProfile.bio || '');
                setEditGithub(fetchedProfile.socials?.github || '');
                setEditLinkedin(fetchedProfile.socials?.linkedin || '');
                setEditTwitter(fetchedProfile.socials?.twitter || '');
                setEditCountryCode(fetchedProfile.countryCode || null);

                const fetchedStreak = await getStreakData(fetchedProfile.uid);
                setStreakData(fetchedStreak);
            } else {
                setError('User not found.');
            }
        } catch (err) {
            setError('Failed to load profile.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (username) {
            fetchProfile(username);
        }
    }, [username, fetchProfile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
                setProfile(prev => prev ? {...prev, photoURL: reader.result as string} : null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!isOwnProfile || !currentUser) return;
        setIsLoading(true);
        
        let newPhotoURL = profile?.photoURL;

        if (newImageFile) {
            try {
                newPhotoURL = await uploadProfileImage(currentUser.uid, newImageFile, (progress) => setUploadProgress(progress));
                setUploadProgress(null);
                setNewImageFile(null);
            } catch (err) {
                toast({ title: "Image Upload Failed", description: "Could not upload your new profile picture. Please try again.", variant: "destructive" });
                setIsLoading(false);
                return;
            }
        }

        try {
            await updateUserProfile(currentUser.uid, {
                displayName: editDisplayName,
                username: editUsername,
                photoURL: newPhotoURL,
                bio: editBio,
                socials: { github: editGithub, linkedin: editLinkedin, twitter: editTwitter },
                countryCode: editCountryCode,
            });
            await refreshUser();
            await fetchProfile(editUsername); // Refetch profile data with new username if changed
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
        } catch (err) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (!profile) return;
        setEditDisplayName(profile.displayName || '');
        setEditUsername(profile.username || '');
        setEditBio(profile.bio || '');
        setEditGithub(profile.socials?.github || '');
        setEditLinkedin(profile.socials?.linkedin || '');
        setEditTwitter(profile.socials?.twitter || '');
        setEditCountryCode(profile.countryCode || null);
        setNewImageFile(null);
        setPreviewUrl(null);
        setUploadProgress(null);
        setIsEditing(false);
        // This will force a re-fetch to revert the optimistic image preview
        fetchProfile(username);
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner size="lg" /></div>;
    }

    if (error) {
        return notFound();
    }

    if (!profile) {
        return null;
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <Card className="frosted-glass p-0">
                 <ProfileHeader 
                    profile={profile}
                    isEditing={isEditing}
                    onEditToggle={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                    onFileSelect={handleFileSelect}
                    uploadProgress={uploadProgress}
                 >
                     {!isOwnProfile && (
                        <>
                           <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
                           <Button><UserPlus className="mr-2 h-4 w-4" /> Follow</Button>
                        </>
                    )}
                 </ProfileHeader>
                <div className="p-6 pt-0 mt-4 space-y-4">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold text-primary">{profile.displayName}</h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AtSign className="h-4 w-4" />
                                <span>{profile.username}</span>
                                {profile.statusEmoji && <span className="text-lg">{profile.statusEmoji}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="md:col-span-2 space-y-6">
                     <ProfileInfoCard title="About" icon={AtSign}>
                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell us about yourself..." />
                            </div>
                        ) : (
                            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                                {profile.bio || 'This user has not written a bio yet.'}
                            </p>
                        )}
                    </ProfileInfoCard>
                </div>
                <div className="space-y-6">
                    <ProfileInfoCard title="Streak" icon={Flame}>
                        {streakData ? (
                             <div className="flex justify-around items-center text-center">
                                <div>
                                    <p className="text-3xl font-bold text-orange-400">{streakData.currentStreak}</p>
                                    <p className="text-xs text-muted-foreground">Current</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{streakData.longestStreak}</p>
                                    <p className="text-xs text-muted-foreground">Longest</p>
                                </div>
                            </div>
                        ) : (
                           <p className="text-sm text-muted-foreground">No streak data available.</p>
                        )}
                    </ProfileInfoCard>
                     <ProfileInfoCard title="Socials" icon={Github}>
                         {isEditing ? (
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                   <Github className="h-5 w-5 text-muted-foreground" />
                                   <Input value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="GitHub URL" />
                                </div>
                                <div className="flex items-center gap-2">
                                   <Linkedin className="h-5 w-5 text-muted-foreground" />
                                   <Input value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} placeholder="LinkedIn URL" />
                                </div>
                                <div className="flex items-center gap-2">
                                   <Twitter className="h-5 w-5 text-muted-foreground" />
                                   <Input value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} placeholder="Twitter/X URL" />
                                </div>
                            </div>
                         ) : (
                            <div className="flex flex-wrap gap-3">
                                {profile.socials?.github ? <Button variant="outline" size="icon" asChild><a href={profile.socials.github} target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5"/></a></Button> : null}
                                {profile.socials?.linkedin ? <Button variant="outline" size="icon" asChild><a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5"/></a></Button> : null}
                                {profile.socials?.twitter ? <Button variant="outline" size="icon" asChild><a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5"/></a></Button> : null}
                                {!profile.socials?.github && !profile.socials?.linkedin && !profile.socials?.twitter && (
                                    <p className="text-xs text-muted-foreground">No social links added.</p>
                                )}
                            </div>
                         )}
                    </ProfileInfoCard>
                     {isEditing && (
                        <ProfileInfoCard title="Location" icon={AtSign}>
                             <div className="space-y-2">
                                <Label htmlFor="country-select">Country</Label>
                                <div className="flex items-center gap-2">
                                    <Select value={editCountryCode || undefined} onValueChange={(value) => setEditCountryCode(value === "none" ? null : value)}>
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
                                     <Button variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => setEditCountryCode(null)} title="Clear selection">
                                        <Trash2 className="h-4 w-4" />
                                     </Button>
                                </div>
                            </div>
                        </ProfileInfoCard>
                     )}
                </div>
            </div>
        </div>
    )
}


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
import { AtSign, Github, Linkedin, Twitter, MessageSquare, UserPlus, Flame, Edit, Save, X, Trash2, Image as ImageIcon, Link as LinkIcon, Rss, UserCheck, Camera, Sparkles } from 'lucide-react';
import Image from 'next/image';
import CountryFlag from '@/components/leaderboard/CountryFlag';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { timezones } from '@/lib/timezones';
import { uploadProfileImage, deleteImageByUrl } from '@/services/storageService';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { followUser, unfollowUser, getFollowers, getFollowing } from '@/services/followService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';
import { onSnapshot, doc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import CustomizeAvatarModal from '@/components/profile/CustomizeAvatarModal';


// Define a type for the editable fields to manage them in a single state
type EditableProfileState = {
    displayName: string;
    username: string;
    bio: string;
    photoURL: string | null;
    coverPhotoURL: string | null;
    socials: {
        github: string;
        linkedin: string;
        twitter: string;
    };
    countryCode: string | null;
};

const ProfileHeader = ({ profile, children, isEditing, onEditToggle, onSave, onCancel, isSaving, onFileSelect, onCoverFileSelect, uploadProgress, isOwnProfile, onCustomizeAvatarClick }: { profile: PublicUserProfile, children: React.ReactNode, isEditing: boolean, onEditToggle: () => void, onSave: () => void, onCancel: () => void, isSaving: boolean, onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, onCoverFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, uploadProgress: number | null, isOwnProfile: boolean, onCustomizeAvatarClick: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="relative">
            <div className="h-40 w-full relative bg-muted rounded-t-lg overflow-hidden group">
                <Image
                    src={profile.coverPhotoURL || "https://r4.wallpaperflare.com/wallpaper/126/117/95/quote-motivational-digital-art-typography-wallpaper-5856bc0a6f2cf779de90d962a2d90bb0.jpg"}
                    alt="Cover"
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="abstract background"
                />
                 {isEditing && (
                    <button onClick={() => coverFileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white"/>
                        <input type="file" ref={coverFileInputRef} onChange={onCoverFileSelect} accept="image/*" className="hidden"/>
                    </button>
                )}
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
                        {isOwnProfile && !isEditing && (
                           <>
                            <Button variant="outline" size="sm" className="mb-2" onClick={onCustomizeAvatarClick}>
                                <Sparkles className="mr-2 h-4 w-4" /> Customize Avatar
                            </Button>
                            <Button variant="outline" size="sm" className="mb-2" onClick={onEditToggle}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                           </>
                        )}
                        {!isOwnProfile && (
                           <>
                                {children}
                           </>
                        )}
                        {isEditing && (
                             <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="mb-2" onClick={onSave} disabled={isSaving}>
                                    {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />} Save
                                </Button>
                                <Button variant="ghost" size="sm" className="mb-2" onClick={onCancel}>
                                    <X className="mr-2 h-4 w-4"/> Cancel
                                </Button>
                            </div>
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

const FollowListPopover = ({ triggerText, fetchFunction, profileId }: { triggerText: React.ReactNode; fetchFunction: (userId: string) => Promise<{ id: string; displayName: string; photoURL: string | null; username: string; }[]>; profileId: string }) => {
    const [users, setUsers] = useState<{ id: string; displayName: string; photoURL: string | null; username: string; }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = useCallback(async (open: boolean) => {
        if (open && users.length === 0) {
            setIsLoading(true);
            try {
                const fetchedUsers = await fetchFunction(profileId);
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Failed to fetch follow list:", error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [users.length, fetchFunction, profileId]);
    
    return (
        <Popover onOpenChange={handleOpen}>
            <PopoverTrigger asChild>
                <button className="text-left hover:text-primary transition-colors">{triggerText}</button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-80 overflow-y-auto p-2 frosted-glass">
                 {isLoading ? (
                    <div className="flex justify-center items-center p-4"><LoadingSpinner /></div>
                 ) : users.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground p-4">No users to show.</p>
                 ) : (
                    <div className="space-y-1">
                        {users.map(u => (
                            <Link href={`/profile/${u.username}`} key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={u.photoURL || ''} alt={u.displayName}/>
                                    <AvatarFallback>{u.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate">{u.displayName}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};


export default function UserProfilePage() {
    const { user: currentUser, refreshUser } = useAuth();
    const { setBackgroundImage } = useTheme();
    const { setChattingWith } = useChat();
    const params = useParams();
    const { toast } = useToast();
    
    // Correctly get username from params
    const usernameParam = params?.username || '';
    const username = Array.isArray(usernameParam) ? usernameParam[0] : usernameParam;
    
    const [profile, setProfile] = useState<PublicUserProfile | null>(null);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editableState, setEditableState] = useState<EditableProfileState | null>(null);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newCoverImageFile, setNewCoverImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);


    const isOwnProfile = currentUser?.uid === profile?.uid;
    
    const setEditingFields = useCallback((profileData: PublicUserProfile) => {
        setEditableState({
            displayName: profileData.displayName || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            photoURL: profileData.photoURL || null,
            coverPhotoURL: profileData.coverPhotoURL || null,
            socials: {
                github: profileData.socials?.github || '',
                linkedin: profileData.socials?.linkedin || '',
                twitter: profileData.socials?.twitter || '',
            },
            countryCode: profileData.countryCode || null,
        });
    }, []);

    const fetchProfile = useCallback(async (usernameToFetch: string) => {
        if (!usernameToFetch) return;
        setIsLoading(true);
        setError(null);
        try {
            const fetchedProfile = await getUserByUsername(usernameToFetch);
            if (fetchedProfile) {
                setProfile(fetchedProfile);
                setEditingFields(fetchedProfile);

                const fetchedStreak = await getStreakData(fetchedProfile.uid);
                setStreakData(fetchedStreak);
            } else {
                setError('User not found.');
                notFound();
            }
        } catch (err) {
            setError('Failed to load profile.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [setEditingFields]);
    
    useEffect(() => {
        if (username) {
            fetchProfile(username);
        }
    }, [username, fetchProfile]);
    
    useEffect(() => {
        if (!profile?.uid || !currentUser?.uid || !db) return;
        
        const listenForFollowChanges = (
            profileUserId: string,
            currentUserId: string,
            callback: (data: { followersCount: number; followingCount: number; isCurrentUserFollowing: boolean }) => void
        ) => {
            const userDocRef = doc(db, 'users', profileUserId);
            const followerDocRef = doc(collection(db, 'users', profileUserId, 'followers'), currentUserId);

            const unsubUser = onSnapshot(userDocRef, async (docSnap) => {
                const data = docSnap.data();
                const followerSnap = await getDoc(followerDocRef);
                callback({
                    followersCount: data?.followersCount || 0,
                    followingCount: data?.followingCount || 0,
                    isCurrentUserFollowing: followerSnap.exists(),
                });
            });

            return () => {
                unsubUser();
            };
        };

        const unsubscribe = listenForFollowChanges(profile.uid, currentUser.uid, (data) => {
            setFollowersCount(data.followersCount);
            setFollowingCount(data.followingCount);
            setIsFollowing(data.isCurrentUserFollowing);
        });

        return () => unsubscribe();

    }, [profile?.uid, currentUser?.uid]);


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (editableState) {
                    setEditableState({ ...editableState, photoURL: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewCoverImageFile(file);
             const reader = new FileReader();
            reader.onloadend = () => {
                if (editableState) {
                    setEditableState({ ...editableState, coverPhotoURL: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!isOwnProfile || !currentUser || !profile || !editableState) return;
        setIsSaving(true);
        
        let newPhotoURL = profile.photoURL;
        const oldPhotoURL = profile.photoURL;
        
        let newCoverPhotoURL = profile.coverPhotoURL;
        const oldCoverPhotoURL = profile.coverPhotoURL;

        try {
            if (newImageFile) {
                newPhotoURL = await uploadProfileImage(currentUser.uid, newImageFile, 'profileImages', (progress) => setUploadProgress(progress));
                setUploadProgress(null);
                setNewImageFile(null);
                 if (oldPhotoURL && newPhotoURL !== oldPhotoURL) {
                    await deleteImageByUrl(oldPhotoURL);
                }
            } else if (editableState.photoURL !== oldPhotoURL) {
                newPhotoURL = editableState.photoURL;
                if (oldPhotoURL) await deleteImageByUrl(oldPhotoURL);
            }

            if (newCoverImageFile) {
                newCoverPhotoURL = await uploadProfileImage(currentUser.uid, newCoverImageFile, 'coverImages', (progress) => setUploadProgress(progress));
                setBackgroundImage(newCoverPhotoURL);
                setUploadProgress(null);
                setNewCoverImageFile(null);
                if (oldCoverPhotoURL && newCoverPhotoURL !== oldCoverPhotoURL) {
                    await deleteImageByUrl(oldCoverPhotoURL);
                }
            } else if (editableState.coverPhotoURL !== oldCoverPhotoURL) {
                newCoverPhotoURL = editableState.coverPhotoURL;
                setBackgroundImage(newCoverPhotoURL);
                if (oldCoverPhotoURL) await deleteImageByUrl(oldCoverPhotoURL);
            }
            
            const dataToSave = {
                ...editableState,
                photoURL: newPhotoURL,
                coverPhotoURL: newCoverPhotoURL,
            };

            await updateUserProfile(currentUser.uid, dataToSave);
            
            await refreshUser();
            await fetchProfile(dataToSave.username);
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to update profile.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (!profile) return;
        setEditingFields(profile);
        setNewImageFile(null);
        setNewCoverImageFile(null);
        setUploadProgress(null);
        setIsEditing(false);
    };
    
    const handleEditableStateChange = (field: keyof EditableProfileState, value: any) => {
        if (editableState) {
            setEditableState(prev => ({...prev!, [field]: value}));
        }
    };

    const handleSocialChange = (field: keyof EditableProfileState['socials'], value: string) => {
        if (editableState) {
            setEditableState(prev => ({
                ...prev!,
                socials: {
                    ...prev!.socials,
                    [field]: value
                }
            }));
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser || !profile || isOwnProfile) return;
        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(currentUser.uid, profile.uid);
            } else {
                await followUser(currentUser.uid, profile.uid);
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not update follow status.", variant: "destructive" });
        } finally {
            setIsFollowLoading(false);
        }
    };
    
    const handleAvatarSave = async (newAvatarUrl: string) => {
        if (!currentUser || !profile) return;
        
        const oldPhotoURL = profile.photoURL;

        // Optimistically update the UI
        setProfile(prev => prev ? { ...prev, photoURL: newAvatarUrl } : null);
        setEditableState(prev => prev ? { ...prev, photoURL: newAvatarUrl } : null);
        setIsAvatarModalOpen(false);

        try {
            await updateUserProfile(currentUser.uid, { photoURL: newAvatarUrl });

            // Delete the old one only after the new one is saved successfully
            if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
                await deleteImageByUrl(oldPhotoURL);
            }
            
            await refreshUser(); // Refresh user in context to update header avatar
            toast({ title: "Avatar Updated", description: "Your new avatar has been saved." });

        } catch (error) {
            // Revert UI on failure
            setProfile(prev => prev ? { ...prev, photoURL: oldPhotoURL } : null);
            setEditableState(prev => prev ? { ...prev, photoURL: oldPhotoURL } : null);
            toast({ title: "Error", description: "Could not save your new avatar.", variant: "destructive" });
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner size="lg" /></div>;
    }

    if (error) {
        return notFound();
    }

    if (!profile || !editableState) {
        return null;
    }
    
    return (
       <>
        <div className="relative max-w-4xl mx-auto">
            <Card className="frosted-glass p-0">
                 <ProfileHeader 
                    profile={{ ...profile, photoURL: isEditing ? editableState.photoURL : profile.photoURL, coverPhotoURL: isEditing ? editableState.coverPhotoURL : profile.coverPhotoURL }}
                    isEditing={isEditing}
                    onEditToggle={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isSaving={isSaving}
                    onFileSelect={handleFileSelect}
                    onCoverFileSelect={handleCoverFileSelect}
                    uploadProgress={uploadProgress}
                    isOwnProfile={isOwnProfile}
                    onCustomizeAvatarClick={() => setIsAvatarModalOpen(true)}
                 >
                     {!isOwnProfile && (
                        <div className="flex gap-2">
                           <Button variant="outline" onClick={() => setChattingWith(profile)}><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
                           <Button onClick={handleFollowToggle} disabled={isFollowLoading}>
                                {isFollowLoading ? <LoadingSpinner size="sm" className="mr-2"/> : (
                                    isFollowing ? <UserCheck className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4"/>
                                )}
                                {isFollowing ? "Following" : "Follow"}
                           </Button>
                        </div>
                    )}
                 </ProfileHeader>
                <div className="p-6 pt-0 mt-4 space-y-4">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" value={editableState.displayName} onChange={e => handleEditableStateChange('displayName', e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={editableState.username} onChange={e => handleEditableStateChange('username', e.target.value)} />
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
                    
                    <div className="flex items-center gap-6 text-sm">
                        <FollowListPopover
                            key="following"
                            profileId={profile.uid}
                            fetchFunction={getFollowing}
                            triggerText={<><span className="font-bold text-foreground">{followingCount}</span> Following</>}
                        />
                        <FollowListPopover
                            key="followers"
                            profileId={profile.uid}
                            fetchFunction={getFollowers}
                            triggerText={<><span className="font-bold text-foreground">{followersCount}</span> Followers</>}
                        />
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="md:col-span-2 space-y-6">
                     <ProfileInfoCard title="About" icon={AtSign}>
                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea value={editableState.bio} onChange={e => handleEditableStateChange('bio', e.target.value)} placeholder="Tell us about yourself..." />
                                <div>
                                    <Label htmlFor="photoUrl">Avatar Image URL</Label>
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                        <Input id="photoUrl" value={editableState.photoURL || ''} onChange={e => handleEditableStateChange('photoURL', e.target.value)} placeholder="https://example.com/image.png" />
                                    </div>
                                </div>
                                 <div>
                                    <Label htmlFor="coverPhotoUrl">Cover Image URL</Label>
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                                        <Input id="coverPhotoUrl" value={editableState.coverPhotoURL || ''} onChange={e => handleEditableStateChange('coverPhotoURL', e.target.value)} placeholder="https://example.com/cover.png" />
                                    </div>
                                </div>
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
                     <ProfileInfoCard title="Socials" icon={Rss}>
                         {isEditing ? (
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                   <Github className="h-5 w-5 text-muted-foreground" />
                                   <Input value={editableState.socials.github} onChange={(e) => handleSocialChange('github', e.target.value)} placeholder="GitHub URL" />
                                </div>
                                <div className="flex items-center gap-2">
                                   <Linkedin className="h-5 w-5 text-muted-foreground" />
                                   <Input value={editableState.socials.linkedin} onChange={(e) => handleSocialChange('linkedin', e.target.value)} placeholder="LinkedIn URL" />
                                </div>
                                <div className="flex items-center gap-2">
                                   <Twitter className="h-5 w-5 text-muted-foreground" />
                                   <Input value={editableState.socials.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} placeholder="Twitter/X URL" />
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
                                    <Select value={editableState.countryCode || undefined} onValueChange={(value) => handleEditableStateChange('countryCode', value === "none" ? null : value)}>
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
                                     <Button variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => handleEditableStateChange('countryCode', null)} title="Clear selection">
                                        <Trash2 className="h-4 w-4" />
                                     </Button>
                                </div>
                            </div>
                        </ProfileInfoCard>
                     )}
                </div>
            </div>
        </div>
        
        {isOwnProfile && (
            <CustomizeAvatarModal
                isOpen={isAvatarModalOpen}
                onOpenChange={setIsAvatarModalOpen}
                onSave={handleAvatarSave}
            />
        )}
      </>
    )
}

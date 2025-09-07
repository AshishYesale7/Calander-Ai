
'use client';

import { useState, useEffect, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserByUsername, type PublicUserProfile } from '@/services/userService';
import { getStreakData, type StreakData } from '@/services/streakService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AtSign, Github, Linkedin, Twitter, MessageSquare, UserPlus, Flame } from 'lucide-react';
import Image from 'next/image';
import CountryFlag from '@/components/leaderboard/CountryFlag';

const ProfileHeader = ({ profile, children }: { profile: PublicUserProfile, children: React.ReactNode }) => (
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
                <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.photoURL || ''} alt={profile.displayName} />
                        <AvatarFallback className="text-4xl">
                            {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                    </Avatar>
                    {profile.countryCode && (
                        <div className="absolute bottom-2 right-2">
                          <CountryFlag countryCode={profile.countryCode} className="h-8 w-8 border-2 border-background"/>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {children}
                </div>
            </div>
            <div className="mt-4">
                <h2 className="text-2xl font-bold text-primary">{profile.displayName}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AtSign className="h-4 w-4" />
                    <span>{profile.username}</span>
                    {profile.statusEmoji && <span className="text-lg">{profile.statusEmoji}</span>}
                </div>
            </div>
        </div>
    </div>
);

const ProfileInfoCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Card className="frosted-glass">
        <CardHeader>
            <CardHeader className="p-0 flex flex-row items-center gap-2">
                <Icon className="h-5 w-5 text-accent"/>
                <h3 className="font-semibold text-lg text-primary">{title}</h3>
            </CardHeader>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);


export default function UserProfilePage({ params }: { params: { username: string } }) {
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<PublicUserProfile | null>(null);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { username } = params;

    const isOwnProfile = currentUser?.uid === profile?.uid;

    useEffect(() => {
        const fetchProfile = async (usernameToFetch: string) => {
            if (!usernameToFetch) return;
            setIsLoading(true);
            setError(null);
            try {
                const fetchedProfile = await getUserByUsername(usernameToFetch);
                if (fetchedProfile) {
                    setProfile(fetchedProfile);
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
        };

        if (username) {
            fetchProfile(username);
        }
    }, [username]);

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
                 <ProfileHeader profile={profile}>
                     {!isOwnProfile && (
                        <>
                           <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
                           <Button><UserPlus className="mr-2 h-4 w-4" /> Follow</Button>
                        </>
                    )}
                 </ProfileHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="md:col-span-2 space-y-6">
                     <ProfileInfoCard title="About" icon={AtSign}>
                        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                            {profile.bio || 'This user has not written a bio yet.'}
                        </p>
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
                         <div className="flex flex-wrap gap-3">
                            {profile.socials?.github && <Button variant="outline" size="icon" asChild><a href={profile.socials.github} target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5"/></a></Button>}
                            {profile.socials?.linkedin && <Button variant="outline" size="icon" asChild><a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5"/></a></Button>}
                            {profile.socials?.twitter && <Button variant="outline" size="icon" asChild><a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5"/></a></Button>}
                            {!profile.socials?.github && !profile.socials?.linkedin && !profile.socials?.twitter && (
                                <p className="text-xs text-muted-foreground">No social links added.</p>
                            )}
                        </div>
                    </ProfileInfoCard>
                </div>
            </div>
        </div>
    )
}

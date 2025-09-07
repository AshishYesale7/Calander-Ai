
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLeaderboardData, type LeaderboardUser } from '@/services/streakService';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, ShieldCheck, ArrowUp, ThumbsUp, Medal, Trophy, Star, Crown } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CountryFlag from '@/components/leaderboard/CountryFlag';

const statusEmojis = [
  '😎', '🎉', '💪', '👀', '🍿', '🔥', '💯', '💩', '🏆', '🥗', '🐱‍👓', '👋'
];

const LEAGUE_PROMOTION_COUNT = 15;

const getRankColor = (rank: number) => {
  if (rank <= LEAGUE_PROMOTION_COUNT) return 'text-green-400';
  return 'text-muted-foreground';
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Star className="h-5 w-5 text-amber-600" />;
  return <span className={cn("font-semibold w-5 text-center", getRankColor(rank))}>{rank}</span>;
}

const LeagueHeader = () => (
    <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="relative">
                <Shield className="h-20 w-20 text-amber-600/50" strokeWidth={1} />
                <Crown className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-amber-500" />
            </div>
            <div className="h-16 w-16 rounded-full bg-muted/30 border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
             <div className="h-16 w-16 rounded-full bg-muted/30 border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
        </div>
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Bronze League</h1>
            <p className="text-muted-foreground mt-1">Top {LEAGUE_PROMOTION_COUNT} advance to the next league</p>
            <p className="font-bold text-yellow-400 mt-2">1 day</p>
        </div>
    </div>
);


const StatusPanel = ({ userStatus, onStatusChange }: { userStatus: string | null, onStatusChange: (emoji: string | null) => void }) => (
    <div className="frosted-glass p-6 w-full max-w-sm sticky top-24">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Set your status</h3>
            <Button variant="link" onClick={() => onStatusChange(null)} className="text-accent p-0 h-auto">CLEAR</Button>
        </div>
        <div className="relative flex items-center justify-center h-24 w-24 mx-auto mb-4 rounded-full border-2 border-dashed border-muted-foreground/50">
            {userStatus ? (
                <span className="text-5xl">{userStatus}</span>
            ) : (
                <span className="text-5xl text-muted-foreground/50">?</span>
            )}
        </div>
        <div className="grid grid-cols-4 gap-2">
            {statusEmojis.map(emoji => (
                <Button key={emoji} variant="outline" className="h-12 w-full text-2xl" onClick={() => onStatusChange(emoji)}>
                    {emoji}
                </Button>
            ))}
        </div>
    </div>
);


export default function LeaderboardPageV2() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [userProfile, setUserProfile] = useState<{ statusEmoji?: string | null, countryCode?: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [leaderboardData, profileData] = await Promise.all([
                getLeaderboardData(),
                getUserProfile(user.uid)
            ]);
            setLeaderboard(leaderboardData);
            setUserProfile(profileData);
        } catch (err) {
            console.error("Failed to fetch leaderboard or profile data:", err);
            toast({ title: "Error", description: "Could not load leaderboard data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAllData();
    }, [user, toast]);

    const handleStatusChange = async (emoji: string | null) => {
        if (!user) return;
        const originalProfile = userProfile;
        setUserProfile(prev => ({...prev, statusEmoji: emoji})); // Optimistic update
        try {
            await updateUserProfile(user.uid, { statusEmoji: emoji });
            // Refetch leaderboard to show updated status for current user
            const leaderboardData = await getLeaderboardData();
            setLeaderboard(leaderboardData);
        } catch (err) {
            setUserProfile(originalProfile); // Revert on fail
            toast({ title: "Error", description: "Could not update your status.", variant: "destructive" });
        }
    }
    
    const userRankInfo = useMemo(() => {
        if (!user) return null;
        const index = leaderboard.findIndex(u => u.id === user.uid);
        return index !== -1 ? { ...leaderboard[index], rank: index + 1 } : null;
    }, [leaderboard, user]);

    const formatXP = (xpInSeconds: number): string => {
        const hours = xpInSeconds / 3600;
        return `${hours.toFixed(2)} hrs`;
    };


    const renderUserRow = (u: LeaderboardUser, rank: number) => {
        const isCurrentUser = user && u.id === user.id;
        return (
            <div
                key={u.id}
                className={cn(
                    "flex items-center gap-4 p-2 rounded-lg transition-colors",
                    isCurrentUser && "bg-primary/20"
                )}
            >
                <div className={cn("text-lg font-bold w-8 text-center", getRankColor(rank))}>
                    {rank}
                </div>
                <div className="relative">
                    <Avatar className="h-11 w-11">
                        <AvatarImage src={u.photoURL || ''} alt={u.displayName || 'User'} />
                        <AvatarFallback>{u.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    {u.countryCode && <CountryFlag countryCode={u.countryCode} className="absolute -top-1 -right-1" />}
                    {u.statusEmoji && (
                        <span className="absolute -bottom-1 -right-1 text-lg bg-card p-0.5 rounded-full leading-none">{u.statusEmoji}</span>
                    )}
                </div>
                <p className="font-semibold text-foreground flex-1">{u.displayName || `User ${u.id.substring(0, 5)}`}</p>
                <p className="text-sm font-bold text-yellow-400">{formatXP(u.timeSpentTotal)} XP</p>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }
    
    return (
        <div className="frosted-glass p-4 md:p-8 rounded-xl">
            <div className="flex flex-col lg:flex-row items-start gap-8 max-w-6xl mx-auto">
                {/* Left Column: Leaderboard */}
                <div className="w-full lg:flex-1 space-y-8">
                    <LeagueHeader />

                    <div className="space-y-2">
                        {leaderboard.slice(0, LEAGUE_PROMOTION_COUNT).map((u, index) => renderUserRow(u, index + 1))}
                    </div>

                    <div className="flex items-center gap-4 text-green-400 font-bold my-4">
                        <ArrowUp className="h-5 w-5" />
                        <span className="text-sm">PROMOTION ZONE</span>
                        <div className="flex-1 h-px bg-green-400/30"></div>
                    </div>

                    <div className="space-y-2">
                        {leaderboard.slice(LEAGUE_PROMOTION_COUNT).map((u, index) => renderUserRow(u, LEAGUE_PROMOTION_COUNT + index + 1))}
                    </div>
                </div>

                {/* Right Column: Status Panel */}
                <div className="w-full lg:w-80">
                    <StatusPanel userStatus={userProfile?.statusEmoji || null} onStatusChange={handleStatusChange} />
                </div>
            </div>
        </div>
    );
}

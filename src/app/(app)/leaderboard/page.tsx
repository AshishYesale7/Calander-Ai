
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getLeaderboardData, type LeaderboardUser } from '@/services/streakService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, Award, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
};

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Award className="h-5 w-5 text-amber-400" />;
    if (rank === 2) return <Award className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className={cn("font-semibold w-5 text-center", getRankColor(rank))}>{rank}</span>;
}


export default function LeaderboardPage() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getLeaderboardData()
            .then(data => {
                // Add a previousRank for demo purposes. In a real app, you'd store this.
                const dataWithPrevRank = data.map((u, i) => ({ ...u, prevRank: i + Math.floor(Math.random() * 3) - 1 }));
                setLeaderboard(dataWithPrevRank);
            })
            .catch(err => console.error("Failed to fetch leaderboard data:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const userRank = useMemo(() => {
        if (!user) return null;
        const index = leaderboard.findIndex(u => u.id === user.uid);
        return index !== -1 ? { ...leaderboard[index], rank: index + 1 } : null;
    }, [leaderboard, user]);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold text-primary">Leaderboard</h1>
                <p className="text-foreground/80 mt-2">See who's building the most consistent habits.</p>
            </div>

            {userRank && (
                <Card className="frosted-glass border-2 border-accent shadow-accent/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl text-accent">Your Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="text-2xl font-bold w-8 text-center">{getRankIcon(userRank.rank)}</div>
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={userRank.photoURL || ''} alt={userRank.displayName || 'You'} />
                                    <AvatarFallback>{userRank.displayName?.charAt(0) || 'Y'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-lg">{userRank.displayName || 'You'}</p>
                                    <p className="text-sm text-muted-foreground">Longest Streak: {userRank.longestStreak} days</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                                <Flame className="h-7 w-7 text-orange-400" />
                                {userRank.currentStreak}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="frosted-glass">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary">Top Performers</CardTitle>
                    <CardDescription>Users with the longest active streaks.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner />
                        </div>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Current Streak</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((u, index) => {
                                    const rank = index + 1;
                                    
                                    return (
                                        <TableRow key={u.id} className={cn(user && u.id === user.uid && "bg-accent/10")}>
                                            <TableCell className="font-bold text-lg w-16">
                                                <div className="flex items-center justify-center h-full">
                                                    {getRankIcon(rank)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={u.photoURL || ''} alt={u.displayName || 'User'}/>
                                                        <AvatarFallback>{u.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{u.displayName || `User ${u.id.substring(0,5)}`}</p>
                                                        <p className="text-xs text-muted-foreground">Longest: {u.longestStreak} days</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-lg font-bold text-primary">
                                                    <Flame className="h-5 w-5 text-orange-400" />
                                                    {u.currentStreak}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

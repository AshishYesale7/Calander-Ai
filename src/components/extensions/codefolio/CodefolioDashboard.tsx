
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SolvedProblemsCard from "./SolvedProblemsCard";
import WeeklyTargetCard from "./WeeklyTargetCard";
import PlatformStatsCard from "./PlatformStatsCard";
import UpcomingContests from "./UpcomingContests";
import type { AllPlatformsUserData, Contest } from "@/ai/flows/fetch-coding-stats-flow";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApiKey } from "@/hooks/use-api-key";
import { getCodingUsernames } from "@/services/userService";
import { fetchCodingStats } from "@/ai/flows/fetch-coding-stats-flow";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import type { TimelineEvent } from "@/types";
import { saveTimelineEvent } from "@/services/timelineService";
import { useTimezone } from "@/hooks/use-timezone";
import ContributionGraphCard from "./ContributionGraphCard";

export default function CodefolioDashboard() {
  const [userData, setUserData] = useState<AllPlatformsUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  const { timezone } = useTimezone();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const usernames = await getCodingUsernames(user.uid);
        if (usernames && Object.values(usernames).some(u => u)) {
          const stats = await fetchCodingStats({ ...usernames, apiKey });
          setUserData(stats);
        }
      } catch (error) {
        console.error("Failed to fetch coding stats", error);
        toast({ title: "Error", description: "Could not fetch your latest coding stats.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, apiKey, toast]);
  
  const totalSolved = Object.values(userData || {}).reduce((acc, platform) => {
    if (platform && platform.totalSolved && !platform.error) {
        return acc + platform.totalSolved;
    }
    return acc;
  }, 0);

  const handleAddContestToTimeline = async (contest: Contest) => {
    if (!user) {
        toast({ title: "Not Signed In", description: "You must be signed in to add events.", variant: "destructive"});
        return;
    }

    const startTime = new Date(contest.startTimeSeconds * 1000);
    const endTime = new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000);

    const newEvent: Omit<TimelineEvent, 'icon' | 'date' | 'endDate' | 'deletedAt'> & { date: string; endDate?: string | null; deletedAt?: string | null } = {
        id: `contest-${contest.id}`,
        title: `Codeforces: ${contest.name}`,
        date: startTime.toISOString(),
        endDate: endTime.toISOString(),
        type: 'exam',
        notes: `Upcoming Codeforces contest. Duration: ${Math.round(contest.durationSeconds / 60)} minutes.`,
        url: `https://codeforces.com/contests/${contest.id}`,
        isAllDay: false,
        isDeletable: true,
        priority: 'Medium',
        status: 'pending',
        reminder: {
          enabled: true,
          earlyReminder: '1_day',
          repeat: 'none',
        },
        googleEventId: undefined, // Ensure it's not trying to update a non-existent google event
    };

    try {
        await saveTimelineEvent(user.uid, newEvent, { syncToGoogle: true, timezone });
        toast({
            title: "Contest Added!",
            description: `"${contest.name}" has been added to your timeline.`,
        });
        return true;
    } catch (error: any) {
        toast({
            title: "Failed to Add Contest",
            description: error.message || "An unknown error occurred.",
            variant: 'destructive',
        });
        return false;
    }
  };


  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="ml-4 mt-4 text-muted-foreground">Fetching your latest coding stats...</p>
            </div>
        </div>
    )
  }
  
  if (!userData || Object.keys(userData).length === 0) {
      return <div className="text-center p-8">No coding data found. Please set up your usernames in Settings.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-full w-full">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Welcome, coding wizard</h1>
                    <p className="text-sm text-muted-foreground">Your journey awaits.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SolvedProblemsCard totalSolved={totalSolved} />
                <ContributionGraphCard />
                <div className="md:col-span-2">
                    <WeeklyTargetCard />
                </div>
                 {userData.codeforces && !userData.codeforces.error && userData.codeforces.contests && userData.codeforces.contests.length > 0 && (
                    <div className="md:col-span-2">
                         <UpcomingContests contests={userData.codeforces.contests} onAddContest={handleAddContestToTimeline} />
                    </div>
                )}
                 {userData.codeforces && !userData.codeforces.error && (
                    <PlatformStatsCard
                        platform="Codeforces"
                        iconUrl="https://cdn.iconscout.com/icon/free/png-256/free-code-forces-3628695-3030187.png"
                        users={[
                            { name: userData.codeforces.username, value: `${userData.codeforces.rating}` },
                        ]}
                    />
                )}
                 {userData.leetcode && !userData.leetcode.error && (
                    <PlatformStatsCard
                        platform="LeetCode"
                        iconUrl="https://cdn.iconscout.com/icon/free/png-256/free-leetcode-3628885-3030128.png"
                        users={[
                            { name: userData.leetcode.username, value: `${userData.leetcode.totalSolved} solved`},
                        ]}
                        chartData={[
                            { name: 'Easy', value: userData.leetcode.easy, fill: 'hsl(var(--chart-1))' },
                            { name: 'Medium', value: userData.leetcode.medium, fill: 'hsl(var(--chart-2))' },
                            { name: 'Hard', value: userData.leetcode.hard, fill: 'hsl(var(--chart-3))' },
                        ]}
                    />
                )}
                 {userData.codechef && !userData.codechef.error && (
                    <PlatformStatsCard
                        platform="CodeChef"
                        iconUrl="https://cdn.iconscout.com/icon/free/png-256/free-codechef-3628876-3030119.png"
                        users={[
                            { name: userData.codechef.username, value: `${userData.codechef.rating}` },
                        ]}
                    />
                )}
            </div>
        </div>
    </div>
  );
}

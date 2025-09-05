
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Droplet, Star, TrendingUp, Trophy } from "lucide-react";
import ContestCalendar from "./ContestCalendar";
import SolvedProblemsCard from "./SolvedProblemsCard";
import DailyStreakCard from "./DailyStreakCard";
import WeeklyTargetCard from "./WeeklyTargetCard";
import WeeklyActivityChart from "./WeeklyActivityChart";
import PlatformStatsCard from "./PlatformStatsCard";
import UpcomingContests from "./UpcomingContests";
import type { AllPlatformsUserData } from "@/ai/flows/fetch-coding-stats-flow";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApiKey } from "@/hooks/use-api-key";
import { getCodingUsernames } from "@/services/userService";
import { fetchCodingStats } from "@/ai/flows/fetch-coding-stats-flow";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface CodefolioDashboardProps {
  userData: AllPlatformsUserData | null;
}

export default function CodefolioDashboard({ userData: initialData }: CodefolioDashboardProps) {
  const [userData, setUserData] = useState<AllPlatformsUserData | null>(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const { user } = useAuth();
  const { apiKey } = useApiKey();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const usernames = await getCodingUsernames(user.uid);
        if (usernames && Object.keys(usernames).length > 0) {
          const stats = await fetchCodingStats({ ...usernames, apiKey });
          setUserData(stats);
        }
      } catch (error) {
        console.error("Failed to fetch coding stats", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userData) {
      fetchData();
    }
  }, [user, apiKey, userData]);
  
  const totalSolved = Object.values(userData || {}).reduce((acc, platform) => {
    if (platform && platform.totalSolved) {
        return acc + platform.totalSolved;
    }
    return acc;
  }, 0);

  const longestStreak = Math.max(0, ...Object.values(userData || {}).map(p => p?.streak || 0));

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
            <p className="ml-4">Fetching your latest coding stats...</p>
        </div>
    )
  }
  
  if (!userData) {
      return <div className="text-center p-8">No coding data found. Please set up your usernames.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-full w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
                <ContestCalendar contests={userData.codeforces?.contests} />
                <UpcomingContests contests={userData.codeforces?.contests} />
            </div>

            {/* Center Column */}
            <div className="lg:col-span-1 space-y-6">
                 <SolvedProblemsCard totalSolved={totalSolved} />
                 <DailyStreakCard currentStreak={longestStreak} />
                 <WeeklyTargetCard />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
                <WeeklyActivityChart />
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
                            { name: 'Easy', value: userData.leetcode.easy, fill: '#22c55e' },
                            { name: 'Medium', value: userData.leetcode.medium, fill: '#facc15' },
                            { name: 'Hard', value: userData.leetcode.hard, fill: '#ef4444' },
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
                 {userData.geeksforgeeks && !userData.geeksforgeeks.error && (
                     <PlatformStatsCard
                        platform="Geeks for Geeks"
                        iconUrl="https://img.icons8.com/color/48/geeksforgeeks.png"
                        users={[
                            { name: userData.geeksforgeeks.username, value: `${userData.geeksforgeeks.totalSolved} solved` },
                        ]}
                    />
                 )}
            </div>
        </div>
    </div>
  );
}

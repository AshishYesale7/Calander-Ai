
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

export default function CodefolioDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <ContestCalendar />
          <UpcomingContests />
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SolvedProblemsCard />
            <DailyStreakCard />
          </div>
          <WeeklyTargetCard />
          <WeeklyActivityChart />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 xl:col-span-1 space-y-6">
          <PlatformStatsCard
            platform="Codeforces"
            iconUrl="https://codeforces.org/s/0/favicon.ico"
            users={[
              { name: "tourist", value: "3828", change: "+12", isPositive: true },
              { name: "amansaxena", value: "1382", change: "-5", isPositive: false },
            ]}
            chartData={[
              { name: "Contests", value: 150 },
              { name: "Problems", value: 450 },
              { name: "Rating", value: 1382, isRating: true },
            ]}
          />
          <PlatformStatsCard
            platform="LeetCode"
            iconUrl="https://leetcode.com/favicon.ico"
            users={[
              { name: "amansaxena1", value: "670", change: "+48", isPositive: true },
            ]}
             chartData={[
              { name: "Easy", value: 250 },
              { name: "Medium", value: 320 },
              { name: "Hard", value: 100 },
            ]}
          />
          <PlatformStatsCard
            platform="CodeStudio"
            iconUrl="https://www.codingninjas.com/codestudio/favicon.ico"
            users={[
              { name: "codestudio", value: "153", isPositive: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

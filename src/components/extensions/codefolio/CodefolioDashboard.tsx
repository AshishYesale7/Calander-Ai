
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

        {/* Middle Columns */}
        <div className="lg:col-span-2 xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
            <div className="md:col-span-2">
                 <SolvedProblemsCard />
            </div>
            <DailyStreakCard />
            <WeeklyTargetCard />
            <div className="md:col-span-2">
                 <WeeklyActivityChart />
            </div>
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
              { name: 'Category A', value: 300, fill: '#facc15' }, // yellow-400
              { name: 'Category B', value: 200, fill: '#38bdf8' }, // sky-400
              { name: 'Category C', value: 100, fill: '#ef4444' }, // red-500
            ]}
          />
          <PlatformStatsCard
            platform="LeetCode"
            iconUrl="https://leetcode.com/favicon.ico"
            users={[
              { name: "amansaxenal", value: "670", change: "+48", isPositive: true },
              { name: "amansaxena", value: "48" },
            ]}
            chartData={[
              { name: 'Easy', value: 250, fill: '#22c55e' }, // green-500
              { name: 'Medium', value: 320, fill: '#facc15' }, // yellow-400
              { name: 'Hard', value: 100, fill: '#ef4444' }, // red-500
            ]}
          />
          <PlatformStatsCard
            platform="CodeStudio"
            iconUrl="https://www.codingninjas.com/codestudio/favicon.ico"
            users={[
              { name: "codestudio", value: "153" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}


'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hand } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserStat {
    name: string;
    value: string;
    change?: string;
    isPositive?: boolean;
}

interface ChartData {
    name: string;
    value: number;
    fill: string;
}

interface PlatformStatsCardProps {
    platform: string;
    iconUrl: string;
    users: UserStat[];
    chartData?: ChartData[];
    // New props for the improved LeetCode UI
    totalSolved?: number;
    beatsPercentage?: number;
}

const DifficultyBadge = ({ label, count, colorClass }: { label: string, count: number, colorClass: string }) => (
    <div className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-1.5">
        <span className={cn("text-sm font-medium", colorClass)}>{label}</span>
        <span className="text-sm font-semibold text-foreground">{count}</span>
    </div>
);


export default function PlatformStatsCard({ platform, iconUrl, users, chartData, totalSolved, beatsPercentage }: PlatformStatsCardProps) {
    
    // Specific new UI for LeetCode
    if (platform === "LeetCode" && chartData && totalSolved !== undefined) {
        const easy = chartData.find(d => d.name === 'Easy')?.value || 0;
        const medium = chartData.find(d => d.name === 'Medium')?.value || 0;
        const hard = chartData.find(d => d.name === 'Hard')?.value || 0;

        return (
            <Card className="frosted-glass bg-card/60 p-6">
                 <CardHeader className="p-0">
                    <CardTitle className="text-muted-foreground font-medium text-base">Total Solved</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-4 space-y-6">
                    <div className="flex justify-between items-baseline">
                        <div className="flex items-baseline gap-2">
                           <p className="text-4xl font-bold text-blue-400">{totalSolved}</p>
                           <p className="text-2xl font-semibold text-foreground">Problems</p>
                        </div>
                         <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Hand className="h-5 w-5" />
                            <span>Beats {beatsPercentage || 1}%</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       <DifficultyBadge label="Easy" count={easy} colorClass="text-emerald-400" />
                       <DifficultyBadge label="Med." count={medium} colorClass="text-yellow-400" />
                       <DifficultyBadge label="Hard" count={hard} colorClass="text-red-500" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    // Fallback to the original UI for other platforms
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                     <Image src={iconUrl} alt={`${platform} logo`} width={24} height={24} className="rounded-full bg-white p-0.5"/>
                    <CardTitle className="text-lg font-semibold">{platform}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {users.map((user, index) => (
                    <div key={index} className="text-2xl font-bold">
                       {user.value}
                       <p className="text-xs text-muted-foreground">{user.name}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

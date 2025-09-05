
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { RadialBar, RadialBarChart, PolarGrid, ResponsiveContainer } from 'recharts';

interface UserStat {
    name: string;
    value: string;
    change?: string;
    isPositive: boolean;
}

interface ChartData {
    name: string;
    value: number;
    fill?: string;
    isRating?: boolean;
}

interface PlatformStatsCardProps {
    platform: string;
    iconUrl: string;
    users: UserStat[];
    chartData?: ChartData[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

export default function PlatformStatsCard({ platform, iconUrl, users, chartData }: PlatformStatsCardProps) {
    const totalValue = chartData ? chartData.reduce((acc, item) => acc + (item.isRating ? 0 : item.value), 0) : 0;
    
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                     <Image src={iconUrl} alt={`${platform} logo`} width={20} height={20} className="rounded-full"/>
                    {platform}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {chartData && (
                    <div className="h-24 w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="40%" 
                                outerRadius="100%" 
                                barSize={8} 
                                data={chartData}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarGrid 
                                    gridType="circle" 
                                    radialLines={false}
                                    stroke="none"
                                />
                                <RadialBar
                                    minAngle={15}
                                    background={{ fill: 'hsla(var(--muted), 0.5)'}}
                                    clockWise
                                    dataKey="value"
                                >
                                     {chartData.map((entry, index) => (
                                        <cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-none" />
                                    ))}
                                </RadialBar>
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div className="space-y-1 mt-2">
                    {users.map((user, index) => (
                        <div key={index} className="flex justify-between items-baseline text-sm">
                            <span className="text-muted-foreground">{user.name}:</span>
                            <div className="flex items-center gap-1 font-semibold">
                                {user.value}
                                {user.change && (
                                    user.isPositive ? (
                                        <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
                                    ) : (
                                        <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

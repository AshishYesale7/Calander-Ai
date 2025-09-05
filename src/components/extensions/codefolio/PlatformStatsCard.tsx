
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer, Cell } from 'recharts';

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
}

export default function PlatformStatsCard({ platform, iconUrl, users, chartData }: PlatformStatsCardProps) {
    const totalForChart = chartData ? chartData.reduce((acc, item) => acc + item.value, 0) : 1;
    
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                     <Image src={iconUrl} alt={`${platform} logo`} width={20} height={20} className="rounded-full bg-white p-0.5"/>
                    {platform}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {chartData && (
                    <div className="h-24 w-full flex justify-center items-center -mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="60%" 
                                outerRadius="80%" 
                                barSize={12} 
                                data={chartData}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis type="number" domain={[0, totalForChart]} angleAxisId={0} tick={false} />
                                <RadialBar
                                    background={{ fill: 'hsla(var(--muted), 0.5)'}}
                                    dataKey="value"
                                    cornerRadius={10}
                                >
                                     {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-none" />
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


'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';

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

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-popover/90 p-2 text-sm text-popover-foreground shadow-md backdrop-blur-sm">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

export default function PlatformStatsCard({ platform, iconUrl, users, chartData }: PlatformStatsCardProps) {
    const totalForChart = chartData ? chartData.reduce((acc, item) => acc + item.value, 0) : 1;
    
    return (
        <Card className="frosted-glass bg-card/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                     <Image src={iconUrl} alt={`${platform} logo`} width={24} height={24} className="rounded-full bg-white p-0.5"/>
                    <CardTitle className="text-lg font-semibold">{platform}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="flex-1 space-y-2">
                     {users.map((user, index) => (
                        <div key={index} className="text-sm">
                            <span className="text-muted-foreground">{user.name}</span>
                            <div className="flex items-baseline gap-1">
                                <p className="text-2xl font-bold">{user.value}</p>
                                {user.change && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        {user.isPositive ? (
                                            <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
                                        ) : (
                                            <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                                        )}
                                        {user.change}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {chartData && (
                    <div className="h-28 w-28 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                                cx="50%" 
                                cy="50%" 
                                innerRadius="70%" 
                                outerRadius="100%" 
                                barSize={8} 
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
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    iconSize={8} 
                                    layout="vertical" 
                                    verticalAlign="middle" 
                                    align="right"
                                    wrapperStyle={{ fontSize: '12px', marginLeft: '10px' }}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

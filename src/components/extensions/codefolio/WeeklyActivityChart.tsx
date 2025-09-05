
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const data = [
  { day: 'Mon', solved: 5, fill: 'hsl(var(--chart-2))' },
  { day: 'Tue', solved: 10, fill: 'hsl(var(--chart-1))' },
  { day: 'Wed', solved: 18, fill: 'hsl(var(--chart-2))' },
  { day: 'Wed_target', solved: 15, isTarget: true, fill: 'hsl(var(--foreground))' },
  { day: 'Thu', solved: 14, fill: 'hsl(var(--chart-2))' },
  { day: 'Thu_target', solved: 5, isTarget: true, fill: 'hsl(var(--foreground))' },
  { day: 'Fri', solved: 3, fill: 'hsl(var(--chart-1))' },
  { day: 'Sat', solved: 9, fill: 'hsl(var(--chart-1))' },
  { day: 'Sun', solved: 20, fill: 'hsl(var(--chart-1))' },
];

export default function WeeklyActivityChart() {
  return (
    <Card className="frosted-glass bg-card/60">
      <CardContent className="p-4">
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="solved" radius={[4, 4, 0, 0]} barSize={12}>
                       {data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.isTarget ? entry.fill : entry.fill} opacity={entry.isTarget ? 0.5 : 1} />
                       ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

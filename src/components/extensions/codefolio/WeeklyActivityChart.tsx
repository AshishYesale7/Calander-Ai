
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { day: 'Mon', solved: 5, target: 4 },
  { day: 'Tue', solved: 10, target: 8 },
  { day: 'Wed', solved: 18, target: 15 },
  { day: 'Thu', solved: 5, target: 14 },
  { day: 'Fri', solved: 3, target: 5 },
  { day: 'Sat', solved: 9, target: 6 },
  { day: 'Sun', solved: 20, target: 10 },
];

export default function WeeklyActivityChart() {
  return (
    <Card className="frosted-glass bg-card/60">
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>Problems solved vs target</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                    />
                    <Bar dataKey="target" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="solved" fill="hsl(var(--accent) / 0.8)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

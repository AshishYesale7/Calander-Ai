
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const data = [
  { day: 'Mon', solved: 5, target: 8, fill: '#facc15' }, // yellow-400
  { day: 'Tue', solved: 10, target: 8, fill: '#38bdf8' }, // sky-400
  { day: 'Wed', solved: 18, target: 15, fill: '#facc15' },
  { day: 'Wed_target', solved: 15, target: 15, fill: '#38bdf8', isTarget: true},
  { day: 'Thu', solved: 14, target: 14, fill: '#facc15' },
  { day: 'Thu_target', solved: 5, target: 14, fill: '#38bdf8', isTarget: true},
  { day: 'Fri', solved: 3, target: 10, fill: '#38bdf8' },
  { day: 'Sat', solved: 9, target: 8, fill: '#38bdf8' },
  { day: 'Sun', solved: 20, target: 12, fill: '#38bdf8' },
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
                           <Cell key={`cell-${index}`} fill={entry.isTarget ? 'hsl(var(--primary-foreground) / 0.2)' : entry.fill} />
                       ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

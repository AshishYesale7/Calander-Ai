
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/hooks/use-theme';

interface ChartDataPoint {
  name: string;
  durationMonths: number;
}

interface CareerRoadmapChartProps {
  data: ChartDataPoint[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

export default function CareerRoadmapChart({ data }: CareerRoadmapChartProps) {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? '#a1a1aa' : '#71717a'; // zinc-400 for dark, zinc-500 for light

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: -10,
            bottom: 5,
          }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis type="number" stroke={textColor} unit=" mo" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120}
            tick={{ fill: textColor, fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
          />
          <Legend formatter={(value, entry, index) => <span style={{ color: textColor }}>{value}</span>} />
          <Bar dataKey="durationMonths" name="Duration (Months)" barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

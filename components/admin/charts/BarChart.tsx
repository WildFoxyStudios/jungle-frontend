'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  layout?: 'horizontal' | 'vertical';
}

export default function BarChart({ data, xKey, yKey, color = '#8b5cf6', layout = 'horizontal' }: BarChartProps) {
  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <YAxis type="category" dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af' }} />
          <Bar dataKey={yKey} fill={color} radius={[0, 4, 4, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
        />
        <Legend wrapperStyle={{ color: '#9ca3af' }} />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

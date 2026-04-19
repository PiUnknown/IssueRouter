'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: 'Oct 10', complaints: 85 },
  { date: 'Oct 11', complaints: 120 },
  { date: 'Oct 12', complaints: 95 },
  { date: 'Oct 13', complaints: 150 },
  { date: 'Oct 14', complaints: 140 },
  { date: 'Oct 15', complaints: 165 },
  { date: 'Oct 16', complaints: 155 },
];

export function GrievanceChart() {
  return (
    <div className="rounded-[26px] border border-white/6 bg-gradient-to-br from-white/[0.08] to-blue-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
      <h3 className="mb-6 text-lg font-semibold text-white">Grievance Velocity (7 days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#20293a" />
          <XAxis
            dataKey="date"
            stroke="#667389"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#667389" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111723',
              border: '1px solid #1d2637',
              borderRadius: '8px',
              color: '#e6edf8',
            }}
            cursor={{ stroke: '#2f6fed', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="complaints"
            stroke="#8db7ff"
            dot={{ fill: '#2f6fed', r: 4 }}
            strokeWidth={3}
            name="Complaints"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

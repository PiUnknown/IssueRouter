'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

const data = [
  { department: 'PWD (44%)', value: 44, complaints: 150 },
  { department: 'Water (30%)', value: 30, complaints: 103 },
  { department: 'Sanitation (15%)', value: 15, complaints: 51 },
  { department: 'Health (10%)', value: 10, complaints: 34 },
];

const COLORS = ['#2f6fed', '#4f8cff', '#f59e0b', '#ef4444'];

export function DepartmentLoadChart() {
  return (
    <div className="rounded-[26px] border border-white/6 bg-gradient-to-br from-white/[0.08] to-violet-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
      <h3 className="mb-6 text-lg font-semibold text-white">Department Load Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#20293a" />
          <XAxis
            dataKey="department"
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
            cursor={{ fill: 'rgba(47,111,237,0.08)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

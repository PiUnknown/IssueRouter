'use client';

import { useMemo, useState } from 'react';
import { Building2, Clock3, MapPin, Users } from 'lucide-react';

type Hotspot = {
  name: string;
  x: number;
  y: number;
  people: number;
  complaints: number;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  department: string;
  eta: string;
  trend: string;
  details: string;
};

const hotspots: Hotspot[] = [
  {
    name: 'Main Street / School Zone',
    x: 28,
    y: 34,
    people: 186,
    complaints: 244,
    urgency: 'Critical',
    department: 'Public Works',
    eta: 'Dispatch in 12m',
    trend: '+22 complaints in 6h',
    details: 'Streetlight outage cluster near the school corridor with concentrated evening safety complaints.',
  },
  {
    name: 'Sector 5 Water Line',
    x: 68,
    y: 26,
    people: 154,
    complaints: 198,
    urgency: 'High',
    department: 'Water Department',
    eta: 'Inspection in 28m',
    trend: '+17 complaints in 4h',
    details: 'Multiple residential blocks are reporting continued low pressure and dry taps.',
  },
  {
    name: 'Market Road Junction',
    x: 56,
    y: 56,
    people: 172,
    complaints: 221,
    urgency: 'Critical',
    department: 'Public Works',
    eta: 'Repair crew mobilizing',
    trend: '+31 complaints in 8h',
    details: 'Large pothole cluster is causing swerving vehicles and traffic slowdown through the junction.',
  },
  {
    name: 'North Park',
    x: 34,
    y: 73,
    people: 88,
    complaints: 116,
    urgency: 'Medium',
    department: 'Sanitation',
    eta: 'Route review today',
    trend: '+8 complaints in 24h',
    details: 'Missed garbage pickup reports are stacking up across adjoining neighborhood lanes.',
  },
  {
    name: 'East Side Clinic',
    x: 80,
    y: 58,
    people: 72,
    complaints: 93,
    urgency: 'Medium',
    department: 'Health Department',
    eta: 'Supply response by 4pm',
    trend: '+5 complaints in 24h',
    details: 'Medicine shortage complaints continue with residents reporting repeat stockouts.',
  },
];

const urgencyColors = {
  Critical: 'bg-red-500 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-blue-600 text-white',
  Low: 'bg-slate-600 text-white',
} as const;

export function HeatmapView() {
  const [selectedArea, setSelectedArea] = useState<Hotspot>(hotspots[0]);

  const summary = useMemo(
    () => ({
      totalPeople: hotspots.reduce((sum, item) => sum + item.people, 0),
      totalComplaints: hotspots.reduce((sum, item) => sum + item.complaints, 0),
      criticalAreas: hotspots.filter((item) => item.urgency === 'Critical').length,
      busiestArea: hotspots.reduce((max, item) => (item.people > max.people ? item : max), hotspots[0]),
    }),
    []
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
      <div className="overflow-hidden rounded-[30px] border border-white/6 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-blue-500/8 p-6 shadow-[0_22px_60px_rgba(3,8,20,0.34)]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Spatial Risk View</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Interactive complaint hotspot map</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Select a location to inspect how many people are complaining, what department owns the issue, and how quickly the city needs to respond.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Busiest location</p>
            <p className="mt-1 text-lg font-semibold text-white">{summary.busiestArea.name}</p>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,#0c1018,#090d14)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:68px_68px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.10),transparent_58%)]" />

          {hotspots.map((spot) => {
            const size = 118 + spot.complaints * 0.52;
            const selected = selectedArea.name === spot.name;

            return (
              <button
                key={spot.name}
                onClick={() => setSelectedArea(spot)}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              >
                <div
                  className="rounded-full blur-2xl transition-all duration-200"
                  style={{
                    width: size,
                    height: size,
                    opacity: selected ? 1 : 0.72,
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(37,99,235,0.34) 24%, rgba(139,92,246,0.28) 46%, rgba(245,158,11,0.22) 70%, rgba(239,68,68,0.14) 84%, transparent 100%)',
                  }}
                />
                <div className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white ${selected ? 'bg-white shadow-[0_0_24px_rgba(255,255,255,0.9)]' : 'bg-blue-300/90'}`} />
                <div className={`absolute left-1/2 top-[calc(100%+10px)] min-w-[168px] -translate-x-1/2 rounded-2xl border px-3 py-2 text-center shadow-xl ${selected ? 'border-blue-400/30 bg-[#111723]' : 'border-white/8 bg-[#111723]/92'}`}>
                  <p className="text-sm font-semibold text-white">{spot.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{spot.people} people | {spot.complaints} posts</p>
                </div>
              </button>
            );
          })}

          <div className="absolute inset-x-4 bottom-4 grid gap-3 rounded-3xl border border-white/8 bg-[#111723]/90 p-4 sm:grid-cols-4">
            <Metric label="People impacted" value={`${summary.totalPeople}`} />
            <Metric label="Complaint posts" value={`${summary.totalComplaints}`} />
            <Metric label="Critical areas" value={`${summary.criticalAreas}`} />
            <Metric label="Selected urgency" value={selectedArea.urgency} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <DetailTile label="Location" value={selectedArea.name} icon={<MapPin className="h-4 w-4" />} />
          <DetailTile label="People complaining" value={`${selectedArea.people}`} icon={<Users className="h-4 w-4" />} solid />
          <DetailTile label="Department" value={selectedArea.department} icon={<Building2 className="h-4 w-4" />} />
          <DetailTile label="Response ETA" value={selectedArea.eta} icon={<Clock3 className="h-4 w-4" />} />
        </div>

        <div className="mt-4 rounded-[24px] border border-white/8 bg-[#0d121c] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected hotspot detail</p>
              <h4 className="mt-2 text-xl font-semibold text-white">{selectedArea.name}</h4>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{selectedArea.details}</p>
            </div>
            <span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${urgencyColors[selectedArea.urgency]}`}>
              {selectedArea.urgency}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SubMetric label="Trend" value={selectedArea.trend} />
            <SubMetric label="Department owner" value={selectedArea.department} />
            <SubMetric label="Recommended response" value={selectedArea.eta} />
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/6 bg-gradient-to-br from-white/[0.07] to-violet-500/8 p-6 shadow-[0_22px_60px_rgba(3,8,20,0.34)]">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5AAAE7]">Location Matrix</p>
          <h4 className="mt-2 text-xl font-semibold text-white">Hotspot ranking by area</h4>
        </div>

        <div className="space-y-3">
          {hotspots
            .slice()
            .sort((a, b) => b.people - a.people)
            .map((spot, index) => {
              const selected = selectedArea.name === spot.name;
              return (
                <button
                  key={spot.name}
                  onClick={() => setSelectedArea(spot)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-blue-400/30 bg-blue-500/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-red-500 text-white' : index === 1 ? 'bg-orange-500 text-white' : index === 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{spot.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{spot.people} people | {spot.complaints} complaints</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${urgencyColors[spot.urgency]}`}>
                      {spot.urgency}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailTile({
  label,
  value,
  icon,
  solid = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  solid?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${solid ? 'border-blue-400/20 bg-blue-600 text-white' : 'border-white/8 bg-gradient-to-br from-white/[0.06] to-white/[0.03] text-white'}`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.16em] ${solid ? 'text-blue-100' : 'text-slate-400'}`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function SubMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

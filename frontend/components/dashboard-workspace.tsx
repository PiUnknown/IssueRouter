'use client';

import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Clock3,
  MapPinned,
  Route,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  TimerReset,
} from 'lucide-react';
import type { GrievanceRecord } from '@/lib/dashboard-data';

interface WorkspaceProps {
  grievances: GrievanceRecord[];
  selectedIssue: GrievanceRecord | null;
  onSelect: (id: string) => void;
}

export function OverviewCommandCenter({
  grievances,
  selectedIssue,
  onSelect,
}: WorkspaceProps) {
  const urgentCount = grievances.filter(
    (item) => item.urgency === 'CRITICAL' || item.urgency === 'HIGH'
  ).length;
  const dispatchReady = grievances
    .filter((item) => item.status.toLowerCase().includes('dispatch'))
    .slice(0, 3);
  const watchlist = grievances.slice(0, 4);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.08] via-blue-500/10 to-violet-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          Command Center
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Response controls for the live shift
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Keep dispatch moving with fast actions, attention markers, and the
          highest-risk clusters visible in one place.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SolidAction icon={<Siren className="h-4 w-4" />} label="Escalate critical" />
          <SolidAction icon={<Route className="h-4 w-4" />} label="Build dispatch route" />
          <SolidAction icon={<BellRing className="h-4 w-4" />} label="Notify department" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoTile label="Urgent clusters" value={`${urgentCount}`} />
          <InfoTile
            label="Active selection"
            value={selectedIssue?.id ?? 'None'}
          />
          <InfoTile
            label="Avg confidence"
            value={`${
              grievances.length
                ? Math.round(
                    grievances.reduce((sum, item) => sum + item.confidence, 0) /
                      grievances.length
                  )
                : 0
            }%`}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              Live Watchlist
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Clusters needing quick review
            </h3>
          </div>
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
            {watchlist.length} visible
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {watchlist.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-left transition hover:bg-white/[0.05]"
            >
              <div>
                <p className="text-sm font-semibold text-white">{item.summary}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.location} | {item.department}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-300" />
            </button>
          ))}
        </div>

        {dispatchReady.length > 0 && (
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Dispatch Ready
            </p>
            <div className="mt-3 space-y-2">
              {dispatchReady.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2"
                >
                  <span className="text-sm text-white">{item.id}</span>
                  <span className="text-xs text-slate-400">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function QueueWorkbench({
  grievances,
  selectedIssue,
}: WorkspaceProps) {
  const officers = [
    { name: 'R. Khan', role: 'Field coordinator', load: '4 active' },
    { name: 'J. Rao', role: 'Water response', load: '2 active' },
    { name: 'A. Singh', role: 'Traffic control', load: '3 active' },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-blue-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
              Triage Actions
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Decision workspace for the selected cluster
            </h3>
          </div>
          <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            {selectedIssue?.urgency ?? 'No selection'}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SolidAction icon={<ShieldCheck className="h-4 w-4" />} label="Assign case owner" />
          <SolidAction icon={<Target className="h-4 w-4" />} label="Mark for manual review" />
          <SolidAction icon={<Route className="h-4 w-4" />} label="Send to routing team" />
          <SolidAction icon={<Sparkles className="h-4 w-4" />} label="Generate field brief" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoTile label="Current issue" value={selectedIssue?.id ?? '--'} />
          <InfoTile
            label="Posts attached"
            value={`${selectedIssue?.complaintCount ?? 0}`}
          />
          <InfoTile label="Status" value={selectedIssue?.status ?? 'Awaiting'} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            SLA Timers
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MiniMetric icon={<TimerReset className="h-4 w-4" />} label="Median triage" value="01:48" />
            <MiniMetric icon={<Clock3 className="h-4 w-4" />} label="Next breach" value="12 min" />
            <MiniMetric icon={<AlertTriangle className="h-4 w-4" />} label="Manual review" value="5 cases" />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.07] to-violet-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
          Officer Board
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Assignment readiness
        </h3>
        <div className="mt-5 space-y-3">
          {officers.map((officer) => (
            <div
              key={officer.name}
              className="rounded-2xl border border-white/8 bg-black/20 p-4"
            >
              <p className="text-sm font-semibold text-white">{officer.name}</p>
              <p className="mt-1 text-xs text-slate-400">{officer.role}</p>
              <p className="mt-3 text-sm text-blue-200">{officer.load}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Queue snapshot
          </p>
          <div className="mt-3 space-y-2">
            {grievances.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2"
              >
                <span className="text-sm text-white">{item.id}</span>
                <span className="text-xs text-slate-400">{item.department}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function MapOperationsPanel({ grievances, onSelect }: WorkspaceProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.08] to-blue-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          Field Dispatch
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Map-linked operations actions
        </h3>
        <div className="mt-5 grid gap-3">
          <SolidAction icon={<MapPinned className="h-4 w-4" />} label="Pin selected hotspot" />
          <SolidAction icon={<Route className="h-4 w-4" />} label="Optimize route order" />
          <SolidAction icon={<BellRing className="h-4 w-4" />} label="Broadcast field update" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile label="Hotspots tracked" value={`${grievances.slice(0, 5).length}`} />
          <InfoTile
            label="Critical zones"
            value={`${
              grievances.filter((item) => item.urgency === 'CRITICAL').length
            }`}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.07] to-violet-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
          Area Priority
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Route shortlist by people impacted
        </h3>
        <div className="mt-5 space-y-3">
          {grievances.slice(0, 5).map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-left transition hover:bg-white/[0.05]"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {index + 1}. {item.location}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.peopleCount} people | {item.department}
                </p>
              </div>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                {item.urgency}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AnalyticsWorkspace({ grievances }: WorkspaceProps) {
  const categoryTotals = Object.entries(
    grievances.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.complaintCount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const topConfidence = grievances
    .slice()
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.08] to-blue-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          Pattern Summary
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          What the complaint stream is telling us
        </h3>
        <div className="mt-5 space-y-3">
          {categoryTotals.map(([category, total]) => (
            <div
              key={category}
              className="rounded-2xl border border-white/8 bg-black/20 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{category}</p>
                <span className="text-sm text-blue-200">{total} posts</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  style={{
                    width: `${Math.max(
                      18,
                      (total / Math.max(...categoryTotals.map(([, value]) => value))) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[0.07] to-violet-500/8 p-6 shadow-[0_18px_44px_rgba(3,8,20,0.26)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
          Model Quality
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          Highest-confidence routed clusters
        </h3>
        <div className="mt-5 space-y-3">
          {topConfidence.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/8 bg-black/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{item.summary}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.location} | {item.department}
                  </p>
                </div>
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  {item.confidence}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SolidAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
      {icon}
      {label}
    </button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-[11px] uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

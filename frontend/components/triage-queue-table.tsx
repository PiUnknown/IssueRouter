'use client';

import { ArrowRight, Building2, MapPin, Users } from 'lucide-react';
import type { GrievanceRecord } from '@/lib/dashboard-data';

interface TriageQueueTableProps {
  grievances: GrievanceRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const urgencyStyles: Record<GrievanceRecord['urgency'], string> = {
  CRITICAL: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-blue-600 text-white',
  LOW: 'bg-slate-600 text-white',
};

function rankStyle(index: number) {
  if (index === 0) return 'bg-red-500 text-white';
  if (index === 1) return 'bg-orange-500 text-white';
  if (index === 2) return 'bg-blue-600 text-white';
  return 'bg-slate-700 text-white';
}

export function TriageQueueTable({ grievances, selectedId, onSelect }: TriageQueueTableProps) {
  return (
    <div className="rounded-[30px] border border-white/6 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-blue-500/8 p-6 shadow-[0_22px_60px_rgba(3,8,20,0.34)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Priority List</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Top issue clusters by complaint volume</h3>
          <p className="mt-2 text-sm text-slate-400">
            Ranked using people count first, then total complaint volume. Each card is an aggregated civic issue cluster.
          </p>
        </div>
        <div className="rounded-2xl bg-blue-600 px-4 py-3 text-right text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-100">Visible clusters</p>
          <p className="mt-1 text-xl font-semibold">{grievances.length}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {grievances.map((grievance, index) => {
          const isSelected = grievance.id === selectedId;

          return (
            <button
              key={grievance.id}
              onClick={() => onSelect(grievance.id)}
              className={`w-full rounded-[28px] border p-5 text-left transition ${
                isSelected
                  ? 'border-blue-500/40 bg-blue-500/10 shadow-[0_16px_40px_rgba(47,111,237,0.16)]'
                  : 'border-white/6 bg-black/15 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${rankStyle(index)}`}>
                      {index + 1}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyStyles[grievance.urgency]}`}>
                      {grievance.urgency}
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
                      {grievance.category}
                    </span>
                  </div>

                  <div>
                    <p className="text-xl font-semibold leading-8 text-white">{grievance.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-300" />
                        {grievance.peopleCount} people complaining
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-blue-300" />
                        {grievance.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-blue-300" />
                        {grievance.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 xl:w-[380px]">
                  <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Necessary action</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{grievance.action}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/[0.07] p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">People</p>
                        <p className="mt-1 text-lg font-semibold text-white">{grievance.peopleCount}</p>
                      </div>
                      <div className="rounded-2xl bg-blue-600 p-3 text-white">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100">Posts</p>
                        <p className="mt-1 text-lg font-semibold">{grievance.complaintCount}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        First seen {grievance.firstReported} | Last seen {grievance.lastReported}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-300">
                        View detail
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {grievances.length === 0 && (
          <div className="rounded-[26px] border border-dashed border-white/8 bg-white/[0.04] p-8 text-center">
            <p className="text-sm font-medium text-white">No issue clusters match the current filters.</p>
            <p className="mt-2 text-sm text-slate-500">Try another people threshold, date window, or complaint volume band.</p>
          </div>
        )}
      </div>
    </div>
  );
}

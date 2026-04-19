'use client';

import { ArrowUpRight, Building2, CalendarRange, Mail, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { GrievanceRecord } from '@/lib/dashboard-data';

interface IssueDetailCardProps {
  grievance: GrievanceRecord | null;
}

const urgencyStyles: Record<GrievanceRecord['urgency'], string> = {
  CRITICAL: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-blue-600 text-white',
  LOW: 'bg-slate-600 text-white',
};

export function IssueDetailCard({ grievance }: IssueDetailCardProps) {
  if (!grievance) {
    return (
      <div className="rounded-[30px] border border-white/6 bg-[#111723] p-6 shadow-[0_22px_60px_rgba(3,8,20,0.34)] xl:sticky xl:top-24">
        <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-white/8 bg-white/[0.02] p-8 text-center">
          <div>
            <p className="text-sm font-medium text-white">No matching issue cluster</p>
            <p className="mt-2 text-sm text-slate-500">Adjust filters or select an issue from the priority list.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[calc(100vh-7rem)] flex-col rounded-[30px] border border-white/6 bg-[#111723] p-6 shadow-[0_22px_60px_rgba(3,8,20,0.34)] xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Issue Cluster Detail</p>
          <h3 className="mt-2 text-2xl font-semibold leading-9 text-white">{grievance.summary}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyStyles[grievance.urgency]}`}>
          {grievance.urgency}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoPill icon={<Users className="h-4 w-4" />} label="People complaining" value={`${grievance.peopleCount}`} solid />
        <InfoPill icon={<Sparkles className="h-4 w-4" />} label="Complaint posts" value={`${grievance.complaintCount}`} />
        <InfoPill icon={<Building2 className="h-4 w-4" />} label="Department" value={grievance.department} />
        <InfoPill icon={<MapPin className="h-4 w-4" />} label="Location" value={grievance.location} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12B4A6] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0fa092]">
          <Mail className="h-4 w-4" />
          Send Mail To Department
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.06]">
          <ShieldCheck className="h-4 w-4" />
          Assign Officer
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        <section className="rounded-3xl border border-white/8 bg-[#0d121c] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ArrowUpRight className="h-4 w-4 text-[#5AAAE7]" />
            Main issue
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{grievance.issue}</p>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#0d121c] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CalendarRange className="h-4 w-4 text-[#5AAAE7]" />
            Reporting window
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            First complaint: {grievance.firstReported} | Most recent complaint: {grievance.lastReported}
          </p>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#0d121c] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="h-4 w-4 text-[#12B4A6]" />
            Representative complaints
          </div>
          <div className="mt-3 space-y-2">
            {grievance.samplePosts.map((post, index) => (
              <div key={`${grievance.id}-${index}`} className="rounded-2xl bg-white/[0.04] px-3 py-3 text-sm leading-6 text-slate-300">
                {post}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#0d121c] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-[#12B4A6]" />
            Necessary action
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{grievance.action}</p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Current status</span>
            <span className="text-sm font-medium text-white">{grievance.status}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoPill({
  icon,
  label,
  value,
  solid = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  solid?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${solid ? 'border-[#12B4A6]/20 bg-[#12B4A6] text-white' : 'border-white/8 bg-[#0d121c] text-white'}`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.16em] ${solid ? 'text-emerald-100' : 'text-slate-500'}`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

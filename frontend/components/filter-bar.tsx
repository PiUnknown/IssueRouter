'use client';

import { Filter, Search, X } from 'lucide-react';

interface FilterState {
  location: string;
  department: string;
  searchQuery: string;
  minPeople: string;
  dateWindow: string;
  volumeBand: string;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export function FilterBar({ filters, setFilters }: FilterBarProps) {
  const locations = [
    'all',
    'Main Street / School Zone',
    'Market Road Junction',
    'Sector 5 Water Line',
    'Old Town Market',
    'Downtown District',
    'North Park',
    'East Side Clinic',
    'Riverside Ward',
    'River Edge Walkway',
    'West End Bus Stop',
  ];

  const departments = ['all', 'Public Works', 'Water Department', 'Traffic Control', 'Sanitation', 'Health Department'];

  const peopleThresholds = [
    { value: 'all', label: 'Any volume' },
    { value: '25', label: '25+ people' },
    { value: '50', label: '50+ people' },
    { value: '100', label: '100+ people' },
    { value: '150', label: '150+ people' },
  ];

  const dateWindows = [
    { value: 'all', label: 'All dates' },
    { value: 'last_24h', label: 'Last 24h' },
    { value: 'last_7d', label: 'Last 7 days' },
    { value: 'older', label: 'Older backlog' },
  ];

  const volumeBands = [
    { value: 'all', label: 'All bands' },
    { value: 'EXTREME', label: 'Extreme' },
    { value: 'HEAVY', label: 'Heavy' },
    { value: 'ELEVATED', label: 'Elevated' },
    { value: 'MODERATE', label: 'Moderate' },
  ];

  return (
    <div className="rounded-[28px] border border-white/6 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-blue-500/8 p-5 shadow-[0_22px_60px_rgba(3,8,20,0.34)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-blue-600 px-2 py-1 text-white">
          <Filter className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-white">Volume Filters</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Field label="Search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search cluster, action, location..."
              className="w-full rounded-2xl border border-white/8 bg-[#080c12] py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
          </div>
        </Field>

        <Field label="People complaining">
          <select
            value={filters.minPeople}
            onChange={(e) => setFilters({ ...filters, minPeople: e.target.value })}
            className="w-full rounded-2xl border border-white/8 bg-[#080c12] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            {peopleThresholds.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date window">
          <select
            value={filters.dateWindow}
            onChange={(e) => setFilters({ ...filters, dateWindow: e.target.value })}
            className="w-full rounded-2xl border border-white/8 bg-[#080c12] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            {dateWindows.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Complaint volume">
          <select
            value={filters.volumeBand}
            onChange={(e) => setFilters({ ...filters, volumeBand: e.target.value })}
            className="w-full rounded-2xl border border-white/8 bg-[#080c12] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            {volumeBands.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location">
          <select
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full rounded-2xl border border-white/8 bg-[#080c12] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc === 'all' ? 'All locations' : loc}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Department">
          <div className="flex gap-3">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full rounded-2xl border border-white/8 bg-[#080c12] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All departments' : dept}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                setFilters({
                  location: 'all',
                  department: 'all',
                  searchQuery: '',
                  minPeople: 'all',
                  dateWindow: 'all',
                  volumeBand: 'all',
                })
              }
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 text-white transition hover:bg-blue-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

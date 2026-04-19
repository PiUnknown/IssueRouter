'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { StatCards } from '@/components/stat-cards';
import { GrievanceChart } from '@/components/grievance-chart';
import { DepartmentLoadChart } from '@/components/department-load-chart';
import { HeatmapView } from '@/components/heatmap-view';
import { TriageQueueTable } from '@/components/triage-queue-table';
import { FilterBar } from '@/components/filter-bar';
import { IssueDetailCard } from '@/components/issue-detail-card';
import type { GrievanceRecord } from '@/lib/dashboard-data';

export default function Dashboard() {
  const [filters, setFilters] = useState({
    location: 'all',
    department: 'all',
    searchQuery: '',
    minPeople: 'all',
    dateWindow: 'all',
    volumeBand: 'all',
  });
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      location: filters.location,
      department: filters.department,
      searchQuery: filters.searchQuery,
      minPeople: filters.minPeople,
      dateWindow: filters.dateWindow,
      volumeBand: filters.volumeBand,
    });

    async function loadGrievances() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/grievances?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = await response.json();
        setGrievances(payload.data ?? []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load grievance clusters:', error);
          setGrievances([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadGrievances();
    return () => controller.abort();
  }, [filters]);

  useEffect(() => {
    if (!grievances.length) {
      setSelectedIssueId(null);
      return;
    }

    if (!selectedIssueId || !grievances.some((item) => item.id === selectedIssueId)) {
      setSelectedIssueId(grievances[0].id);
    }
  }, [grievances, selectedIssueId]);

  const selectedIssue =
    grievances.find((item) => item.id === selectedIssueId) ?? grievances[0] ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6">
              <FilterBar filters={filters} setFilters={setFilters} />
              <div className="grid items-start gap-6 xl:grid-cols-[1.34fr_0.78fr]">
                <TriageQueueTable
                  grievances={grievances}
                  selectedId={selectedIssueId}
                  onSelect={setSelectedIssueId}
                />
                <IssueDetailCard grievance={selectedIssue} />
              </div>
              {isLoading && <p className="text-sm text-slate-500">Loading live queue...</p>}
              <StatCards />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GrievanceChart />
                <DepartmentLoadChart />
              </div>
              <HeatmapView />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

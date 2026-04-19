import { mockGrievances, urgencyRank, volumeRank, type GrievanceRecord } from '@/lib/mock-grievances';

export interface GrievanceFilters {
  location?: string;
  department?: string;
  searchQuery?: string;
  minPeople?: string | number;
  dateWindow?: string;
  volumeBand?: string;
}

export function getGrievanceClusters(filters: GrievanceFilters = {}) {
  const query = `${filters.searchQuery ?? ''}`.trim().toLowerCase();
  const minPeople =
    filters.minPeople === undefined || filters.minPeople === 'all'
      ? 0
      : Number(filters.minPeople);

  return [...mockGrievances]
    .filter((item) => (!filters.location || filters.location === 'all' ? true : item.location === filters.location))
    .filter((item) =>
      !filters.department || filters.department === 'all' ? true : item.department === filters.department
    )
    .filter((item) => item.peopleCount >= minPeople)
    .filter((item) =>
      !filters.dateWindow || filters.dateWindow === 'all' ? true : item.dateKey === filters.dateWindow
    )
    .filter((item) =>
      !filters.volumeBand || filters.volumeBand === 'all' ? true : item.volumeBand === filters.volumeBand
    )
    .filter((item) => {
      if (!query) return true;

      return [item.id, item.summary, item.location, item.department, item.action, item.issue, ...item.samplePosts]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      if (b.peopleCount !== a.peopleCount) return b.peopleCount - a.peopleCount;
      if (b.complaintCount !== a.complaintCount) return b.complaintCount - a.complaintCount;
      if (volumeRank[a.volumeBand] !== volumeRank[b.volumeBand]) {
        return volumeRank[a.volumeBand] - volumeRank[b.volumeBand];
      }
      return urgencyRank[a.urgency] - urgencyRank[b.urgency];
    });
}

export function getGrievanceById(id: string) {
  return mockGrievances.find((item) => item.id === id) ?? null;
}

export function getDashboardStats() {
  const totalPeople = mockGrievances.reduce((sum, item) => sum + item.peopleCount, 0);
  const totalPosts = mockGrievances.reduce((sum, item) => sum + item.complaintCount, 0);
  const criticalClusters = mockGrievances.filter((item) => item.urgency === 'CRITICAL').length;
  const avgConfidence =
    Math.round(
      (mockGrievances.reduce((sum, item) => sum + item.confidence, 0) / mockGrievances.length) * 10
    ) / 10;

  const departmentLoad = Object.entries(
    mockGrievances.reduce<Record<string, number>>((acc, item) => {
      acc[item.department] = (acc[item.department] ?? 0) + item.peopleCount;
      return acc;
    }, {})
  ).map(([department, people]) => ({
    department,
    people,
  }));

  return {
    totalClusters: mockGrievances.length,
    totalPeople,
    totalPosts,
    criticalClusters,
    avgConfidence,
    departmentLoad,
  };
}

export function getHeatmapSummary() {
  return mockGrievances.slice(0, 6).map((item, index) => ({
    id: item.id,
    rank: index + 1,
    area: item.location,
    peopleCount: item.peopleCount,
    complaintCount: item.complaintCount,
    urgency: item.urgency,
  }));
}

export type { GrievanceRecord };

import { useState, useMemo } from 'react'
import { clusters } from '../data/Clusters'
import ClusterCard from '../components/ui/ClusterCard'
import FilterBar from '../components/ui/FilterBar'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'inprogress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
]

const DEFAULT_FILTERS = {
  search: '',
  minCount: 0,
  location: '',
  department: '',
}

const INITIAL_VISIBLE = 9
const LOAD_MORE_COUNT = 6

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  // Reset visible count whenever any filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setVisibleCount(INITIAL_VISIBLE)
  }

  const handleStatusChange = (status) => {
    setStatusFilter(status)
    setVisibleCount(INITIAL_VISIBLE)
  }

  const { search, minCount, location, department } = filters

  const filtered = useMemo(() => {
    return clusters.filter((c) => {
      // Status tab
      if (statusFilter !== 'all' && c.status !== statusFilter) return false

      // Search — matches problem, cluster_id, or location
      if (search) {
        const q = search.toLowerCase()
        const hit =
          c.problem.toLowerCase().includes(q) ||
          c.cluster_id.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
        if (!hit) return false
      }

      // Min complaint count
      if (minCount && c.complaint_count < minCount) return false

      // Location (matches the city part after the comma)
      if (location && !c.location.includes(location)) return false

      // Department
      if (department && c.department !== department) return false

      return true
    })
  }, [statusFilter, search, minCount, location, department])

  const visibleClusters = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const remaining = filtered.length - visibleCount
  const counts = useMemo(() => ({
    total: clusters.length,
    pending: clusters.filter((c) => c.status === 'pending').length,
    inprogress: clusters.filter((c) => c.status === 'inprogress').length,
    resolved: clusters.filter((c) => c.status === 'resolved').length,
  }), [])

  return (
    <div className="space-y-5">

      {/* ── Page header ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Active complaint clusters
          </h2>
        </div>
        <span className="text-[12px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full self-start sm:self-auto">
          Last 24 hours
        </span>
      </div>

      {/* ── Summary stat cards ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total clusters', value: counts.total, color: 'text-gray-800 dark:text-gray-100' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'In progress', value: counts.inprogress, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Resolved', value: counts.resolved, color: 'text-green-600 dark:text-green-400' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
          >
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────── */}
      <FilterBar filters={filters} onChange={handleFiltersChange} />

      {/* ── Status tabs + results count ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key)}
              className={`
                text-[12px] px-3.5 py-1.5 rounded-full border transition-colors
                ${statusFilter === key
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }
              `}
            >
              {label}
              <span className={`ml-1.5 text-[11px] ${statusFilter === key ? 'opacity-75' : 'text-gray-400'}`}>
                {key === 'all' ? counts.total : counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-[12px] text-gray-400 dark:text-gray-500">
          Showing{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{visibleClusters.length}</span>
          {' '}of{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{filtered.length}</span>
          {' '}clusters
        </p>
      </div>

      {/* ── Cluster cards grid ────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            No clusters match the current filters.
          </p>
          <button
            onClick={() => { setFilters(DEFAULT_FILTERS); setStatusFilter('all') }}
            className="mt-3 text-[12px] text-indigo-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleClusters.map((cluster, i) => (
              <ClusterCard key={cluster.cluster_id} cluster={cluster} rank={i + 1} />
            ))}
          </div>

          {/* ── Show more button ──────────────── */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={() => setVisibleCount((n) => n + LOAD_MORE_COUNT)}
                className="
                  px-6 py-2.5 text-[13px] font-medium rounded-lg
                  border border-indigo-300 dark:border-indigo-700
                  text-indigo-600 dark:text-indigo-400
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                  transition-colors
                "
              >
                Show more
              </button>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {remaining} more cluster{remaining !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
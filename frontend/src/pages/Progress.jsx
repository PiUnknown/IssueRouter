import { useState, useMemo } from 'react'
import { useIssues } from '../context/IssueContext'
import {
    ChevronDown, ChevronUp, Users, Building2,
    User, Activity, CheckCircle2, Clock, Wrench,
    CircleDot, Search, Filter
} from 'lucide-react'

// ── Tracking steps per status ─────────────────────────────────────────────
const STEPS_INPROGRESS = [
    { id: 1, label: 'Complaint Registered', desc: 'Issue cluster identified and logged by IssueRouter AI.', done: true },
    { id: 2, label: 'Assigned to Department', desc: 'Cluster forwarded to the responsible department and officer.', done: true },
    { id: 3, label: 'Field Team Dispatched', desc: 'Ground team has been deployed to assess the situation.', done: true },
    { id: 4, label: 'Work In Progress', desc: 'Active repair / resolution underway.', done: false, active: true },
    { id: 5, label: 'Verification Pending', desc: 'Awaiting site inspection to confirm fix quality.', done: false },
    { id: 6, label: 'Resolved & Closed', desc: 'Issue fully resolved and marked closed.', done: false },
]

const STEPS_RESOLVED = [
    { id: 1, label: 'Complaint Registered', desc: 'Issue cluster identified and logged by IssueRouter AI.', done: true },
    { id: 2, label: 'Assigned to Department', desc: 'Cluster forwarded to the responsible department and officer.', done: true },
    { id: 3, label: 'Field Team Dispatched', desc: 'Ground team deployed to assess the situation.', done: true },
    { id: 4, label: 'Work In Progress', desc: 'Active repair / resolution was underway.', done: true },
    { id: 5, label: 'Verification Pending', desc: 'Site inspection confirmed the fix.', done: true },
    { id: 6, label: 'Resolved & Closed', desc: 'Issue fully resolved and marked closed.', done: true },
]

// ── Helpers ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    if (status === 'inprogress') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                <Wrench size={10} />
                In Progress
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 size={10} />
            Resolved
        </span>
    )
}

// ── Amazon-style tracker ──────────────────────────────────────────────────
function OrderTracker({ status }) {
    const steps = status === 'resolved' ? STEPS_RESOLVED : STEPS_INPROGRESS
    return (
        <div className="relative pl-4 py-3 pr-2">
            <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-5">
                {steps.map((step) => {
                    const isDone = step.done
                    const isActive = step.active
                    return (
                        <div key={step.id} className="relative flex items-start gap-4 pl-3">
                            <div className={`
                                relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                                transition-all duration-300
                                ${isDone
                                    ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                                    : isActive
                                    ? 'bg-white dark:bg-gray-800 border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/40'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                }
                            `}>
                                {isDone && <CheckCircle2 size={11} className="text-white" />}
                                {isActive && <CircleDot size={11} className="text-indigo-500 animate-pulse" />}
                            </div>
                            <div className="pb-1">
                                <p className={`text-[13px] font-semibold leading-tight ${
                                    isDone ? 'text-gray-800 dark:text-gray-100'
                                    : isActive ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                    {step.label}
                                </p>
                                <p className={`text-[11px] mt-0.5 ${
                                    isDone || isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-700'
                                }`}>
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────
export default function Progress() {
    const { issues, assignments, discarded } = useIssues()
    const [expandedId, setExpandedId] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Show inprogress + resolved, exclude discarded, newly assigned at top
    const progressClusters = useMemo(() => {
        const active = issues.filter(
            c => (c.status === 'inprogress' || c.status === 'resolved') && !discarded.has(c.cluster_id)
        )
        // Sort: newly assigned (have an entry in assignments) come first
        return [...active].sort((a, b) => {
            const aAssigned = assignments[a.cluster_id] ? 1 : 0
            const bAssigned = assignments[b.cluster_id] ? 1 : 0
            return bAssigned - aAssigned
        })
    }, [issues, assignments, discarded])

    const filtered = useMemo(() => {
        return progressClusters.filter((c) => {
            const matchSearch = !search || c.problem.toLowerCase().includes(search.toLowerCase()) ||
                c.location.toLowerCase().includes(search.toLowerCase()) ||
                c.department.toLowerCase().includes(search.toLowerCase())
            const matchStatus = statusFilter === 'all' || c.status === statusFilter
            return matchSearch && matchStatus
        })
    }, [progressClusters, search, statusFilter])

    const inprogressCount = progressClusters.filter(c => c.status === 'inprogress').length
    const resolvedCount = progressClusters.filter(c => c.status === 'resolved').length

    return (
        <div className="space-y-5">

            {/* ── Header ─────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Progress Tracker
                    </h2>
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                        Live tracking of all active and resolved complaint clusters.
                    </p>
                </div>
                <span className="text-[12px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full self-start sm:self-auto">
                    {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Summary strip ──────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: 'Total Tracked', value: progressClusters.length, color: 'from-indigo-600 to-purple-500', icon: <Activity size={18} className="text-indigo-500" />, bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
                    { label: 'In Progress', value: inprogressCount, color: 'from-blue-600 to-indigo-500', icon: <Wrench size={18} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/30' },
                    { label: 'Resolved', value: resolvedCount, color: 'from-emerald-600 to-green-500', icon: <CheckCircle2 size={18} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                ].map(({ label, value, color, icon, bg }) => (
                    <div key={label} className="glass-panel px-4 py-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
                        <div>
                            <p className="text-[10.5px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                            <p className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search + Filter ─────────────────── */}
            <div className="glass-panel p-3.5 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by issue, location, department..."
                        className="w-full h-[34px] pl-8 pr-3 text-[12px] bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={13} className="text-gray-400 flex-shrink-0" />
                    {['all', 'inprogress', 'resolved'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                                statusFilter === s
                                    ? 'bg-indigo-700 text-white border-indigo-700'
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {s === 'all' ? 'All' : s === 'inprogress' ? 'In Progress' : 'Resolved'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ──────────────────────────── */}
            <div className="glass-panel overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_40px] gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                    {['Issue Name', 'Complainants', 'Department', 'Assigned Officer', 'Status', ''].map((h) => (
                        <span key={h} className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">
                            {h}
                        </span>
                    ))}
                </div>

                {/* Rows */}
                {filtered.length === 0 ? (
                    <div className="text-center py-14">
                        <p className="text-sm text-gray-400 dark:text-gray-600">No issues match your filters.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                        {filtered.map((cluster) => {
                            const isExpanded = expandedId === cluster.cluster_id
                            const officerObj = assignments[cluster.cluster_id]
                            const officerName = officerObj ? officerObj.name : 'Unassigned'
                            const isNewlyAssigned = !!officerObj

                            return (
                                <div key={cluster.cluster_id} className={`transition-all ${isNewlyAssigned ? 'ring-1 ring-indigo-200 dark:ring-indigo-800/50' : ''}`}>
                                    {/* ── Main row ── */}
                                    <div
                                        className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_40px] gap-4 px-5 py-4 items-center cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group"
                                        onClick={() => setExpandedId(prev => prev === cluster.cluster_id ? null : cluster.cluster_id)}
                                    >
                                        {/* Issue name + ID */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                                                    {cluster.problem}
                                                </p>
                                                {isNewlyAssigned && (
                                                    <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                                {cluster.cluster_id} · {cluster.location}
                                            </p>
                                        </div>

                                        {/* Complainants */}
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                                                {cluster.complaint_count.toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Department */}
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate">
                                                {cluster.department}
                                            </span>
                                        </div>

                                        {/* Officer */}
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isNewlyAssigned ? 'bg-indigo-200 dark:bg-indigo-800/60' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                <User size={11} className={isNewlyAssigned ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} />
                                            </div>
                                            <span className={`text-[12px] truncate ${isNewlyAssigned ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-500 dark:text-gray-500'}`}>
                                                {officerName}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <StatusBadge status={cluster.status} />

                                        {/* Expand toggle */}
                                        <button className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                        </button>
                                    </div>

                                    {/* ── Expandable tracker ── */}
                                    {isExpanded && (
                                        <div className="mx-5 mb-5 mt-1 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 overflow-hidden animate-fade-in-up">
                                            {officerObj && (
                                                <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2">
                                                    <User size={12} className="text-indigo-500" />
                                                    <span className="text-[12px] text-indigo-700 dark:text-indigo-300">
                                                        <span className="font-semibold">{officerObj.name}</span>
                                                        <span className="text-indigo-400 dark:text-indigo-500"> · {officerObj.designation} · {officerObj.id}</span>
                                                    </span>
                                                </div>
                                            )}
                                            <div className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2">
                                                <Clock size={13} className="text-indigo-500" />
                                                <span className="text-[12px] font-semibold text-indigo-700 dark:text-indigo-300">
                                                    Issue Resolution Timeline
                                                </span>
                                            </div>
                                            <div className="px-4 py-2">
                                                <OrderTracker status={cluster.status} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

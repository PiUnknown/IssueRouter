import { useState } from 'react'
import {
    ChevronDown,
    MapPin,
    Building2,
    TrendingUp,
    TrendingDown,
    Minus,
    X as XIcon,
    ShieldCheck,
    Mail,
    Trash2,
    Sparkles,
} from 'lucide-react'

const PRIORITY_STYLES = {
    1: { rank: 'bg-red-50 text-red-800', card: 'border-l-4 border-l-red-500' },
    2: { rank: 'bg-amber-50 text-amber-800', card: 'border-l-4 border-l-orange-400' },
    3: { rank: 'bg-blue-50 text-blue-800', card: 'border-l-4 border-l-blue-400' },
    4: { rank: 'bg-gray-100 text-gray-600', card: 'border-l-4 border-l-gray-300' },
}

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    inprogress: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    resolved: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

const STATUS_LABELS = {
    pending: 'Pending',
    inprogress: 'In progress',
    resolved: 'Resolved',
}

const SEVERITY = {
    1: { label: 'Critical', bg: 'bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400', dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' },
    2: { label: 'High',     bg: 'bg-orange-500/10 border border-orange-500/30 text-orange-500 dark:text-orange-400', dot: 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]' },
    3: { label: 'Medium',   bg: 'bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]' },
    4: { label: 'Low',      bg: 'bg-gray-400/10 border border-gray-400/30 text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
}

function TrendIcon({ trend }) {
    if (trend === 'up') return <TrendingUp size={14} className="text-red-500" />
    if (trend === 'down') return <TrendingDown size={14} className="text-green-600" />
    return <Minus size={14} className="text-gray-400" />
}

export default function ClusterCard({ cluster, rank, expanded, onToggle }) {
    const [currentStatus, setCurrentStatus] = useState(cluster.status)
    const [discarded, setDiscarded] = useState(false)
    const [assigned, setAssigned] = useState(false)

    // Derive dept email from department name
    const deptEmail = `${cluster.department.toLowerCase().replace(/\s+/g, '.')}@delhi.gov.in`
    const mailSubject = encodeURIComponent(`[IssueRouter Alert] ${cluster.problem} — ${cluster.location}`)
    const mailBody = encodeURIComponent(
`Dear ${cluster.department} Department,

This is an automated escalation from IssueRouter for a civic complaint cluster requiring immediate attention.

ISSUE SUMMARY
--------------
Cluster ID   : ${cluster.cluster_id}
Problem      : ${cluster.problem}
Location     : ${cluster.location}
Severity     : ${['', 'Critical', 'High', 'Medium', 'Low'][cluster.priority]}
Status       : ${currentStatus}
Complaint Count : ${cluster.complaint_count} citizens affected
RT Reach     : ${cluster.rt_reach.toLocaleString()}
Time Window  : ${cluster.time_window}

AI RECOMMENDED ACTION
---------------------
${cluster.recommended_action}

Please treat this as a priority matter and respond with a timeline for resolution.

Regards,
IssueRouter Civic Triage System`
    )

    const ps = PRIORITY_STYLES[cluster.priority] ?? PRIORITY_STYLES[4]
    const sev = SEVERITY[cluster.priority] ?? SEVERITY[4]
    const liveStatusStyle = STATUS_STYLES[currentStatus] ?? STATUS_STYLES.pending
    const liveStatusLabel = STATUS_LABELS[currentStatus] ?? currentStatus

    return (
        <div className={`flex flex-col glass-panel rounded-xl overflow-hidden ${ps.card} h-full`}>

            {/* ── Card body — flex-1 so it always grows to fill available space ── */}
            <div className="p-4 relative flex flex-col flex-1">

                {/* Rank badge — top-left */}
                <div className={`absolute top-0 left-0 w-7 h-7 flex items-center justify-center text-[11px] font-semibold rounded-tl-xl rounded-br-lg ${ps.rank}`}>
                    #{rank}
                </div>

                <div className="pl-6 flex flex-col flex-1 gap-2">

                    {/* Severity tag + status pill */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${sev.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                            {sev.label}
                        </span>
                        <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium ${liveStatusStyle}`}>
                            {liveStatusLabel}
                        </span>
                    </div>

                    {/* Problem title — always 2 visible lines, pushes rest down */}
                    <p className="text-[15px] font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                        {cluster.problem}
                    </p>

                    {/* Summary — 2-line clamp keeps cards same height */}
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 flex-1">
                        {cluster.summary}
                    </p>

                    {/* Department + location badges — always at bottom of body */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-700/30">
                            <Building2 size={10} />
                            {cluster.department}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-700/30">
                            <MapPin size={10} />
                            {cluster.location.split(',')[0]}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Stats row (fixed height, never stretches) ─────────────────── */}
            <div className="grid grid-cols-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
                <div className="py-3 text-center border-r border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-xl font-bold bg-gradient-to-br from-gray-800 to-gray-500 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
                        {cluster.complaint_count}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">Complaints</p>
                </div>
                <div className="py-3 text-center border-r border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-xl font-bold bg-gradient-to-br from-gray-800 to-gray-500 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
                        {cluster.rt_reach.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">RT Reach</p>
                </div>
                <div className="py-3 flex flex-col items-center justify-center gap-1">
                    <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-sm">
                        <TrendIcon trend={cluster.trend} />
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Trend</p>
                </div>
            </div>

            {/* ── Expand toggle ─────────────────────────────────────────────── */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold text-indigo-500 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 border-t border-gray-200/50 dark:border-gray-700/50 transition-colors flex-shrink-0"
            >
                <ChevronDown size={13} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Hide details' : 'View details + tweets'}
            </button>

            {/* ── Expandable details ─────────────────────────────────────────── */}
            {expanded && (
                <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-900/50 p-4 space-y-4 animate-fade-in-up">
                    <div className="space-y-2 text-[12px]">
                        <div className="flex gap-2">
                            <span className="text-gray-400 dark:text-gray-500 w-28 flex-shrink-0">Cluster ID</span>
                            <span className="text-gray-700 dark:text-gray-300 font-mono">{cluster.cluster_id}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-gray-400 dark:text-gray-500 w-28 flex-shrink-0">Full location</span>
                            <span className="text-gray-700 dark:text-gray-300">{cluster.location}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-gray-400 dark:text-gray-500 w-28 flex-shrink-0">Time window</span>
                            <span className="text-gray-700 dark:text-gray-300">{cluster.time_window}</span>
                        </div>
                    </div>

                    {/* AI Recommendation box */}
                    <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-700/40 bg-gradient-to-br from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/50 dark:to-purple-950/30 p-3.5">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles size={12} className="text-indigo-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">AI Recommendation</span>
                        </div>
                        <p className="text-[12.5px] text-indigo-800 dark:text-indigo-200 leading-relaxed">{cluster.recommended_action}</p>
                    </div>

                    <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
                            <XIcon size={11} /> Sample tweets
                        </p>
                        <div className="space-y-2">
                            {cluster.sample_tweets.map((tweet, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-0.5">{tweet.handle}</p>
                                    <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{tweet.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-1 gap-2 pt-1">
                        {/* 1. Assign Officer */}
                        <button
                            onClick={() => { setCurrentStatus('inprogress'); setAssigned(true) }}
                            disabled={assigned || currentStatus === 'inprogress' || currentStatus === 'resolved'}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200
                                ${ assigned || currentStatus === 'inprogress'
                                    ? 'bg-blue-400/60 text-white cursor-default'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_4px_18px_rgba(37,99,235,0.5)]'
                                }`}
                        >
                            <ShieldCheck size={14} />
                            {assigned || currentStatus === 'inprogress' ? 'Officer Assigned — In Progress' : 'Assign Officer'}
                        </button>

                        {/* 2. Mail Department */}
                        <a
                            href={`mailto:${deptEmail}?subject=${mailSubject}&body=${mailBody}`}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all duration-200"
                        >
                            <Mail size={14} />
                            Mail {cluster.department} Department
                        </a>

                        {/* 3. Discard Complaint */}
                        <button
                            onClick={() => setDiscarded(true)}
                            disabled={discarded}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-semibold border transition-all duration-200
                                ${discarded
                                    ? 'border-red-300 text-red-300 cursor-default opacity-60'
                                    : 'border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500'
                                }`}
                        >
                            <Trash2 size={14} />
                            {discarded ? 'Complaint Discarded' : 'Discard Complaint'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
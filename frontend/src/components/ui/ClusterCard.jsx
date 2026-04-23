import { useState } from 'react'
import {
    ChevronDown,
    MapPin,
    Building2,
    TrendingUp,
    TrendingDown,
    Minus,
    X as XIcon,
    CheckCircle,
    AlertCircle,
} from 'lucide-react'

const PRIORITY_STYLES = {
    1: { rank: 'bg-red-50 text-red-800', card: 'border-l-4 border-l-red-400' },
    2: { rank: 'bg-amber-50 text-amber-800', card: 'border-l-4 border-l-amber-400' },
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

function TrendIcon({ trend }) {
    if (trend === 'up') return <TrendingUp size={14} className="text-red-500" />
    if (trend === 'down') return <TrendingDown size={14} className="text-green-600" />
    return <Minus size={14} className="text-gray-400" />
}

export default function ClusterCard({ cluster, rank }) {
    const [expanded, setExpanded] = useState(false)
    const [acknowledged, setAcknowledged] = useState(false)
    const [resolved, setResolved] = useState(cluster.status === 'resolved')

    const ps = PRIORITY_STYLES[cluster.priority] ?? PRIORITY_STYLES[4]

    return (
        <div
            className={`
        bg-white dark:bg-gray-800
        rounded-xl border border-gray-200 dark:border-gray-700
        overflow-hidden
        ${ps.card}
        transition-shadow hover:shadow-md
      `}
        >
            {/* ── Card top ───────────────────────────── */}
            <div className="p-4 relative">
                {/* Rank badge — top-left */}
                <div
                    className={`
            absolute top-0 left-0 w-7 h-7 flex items-center justify-center
            text-[11px] font-semibold rounded-tl-xl rounded-br-lg
            ${ps.rank}
          `}
                >
                    #{rank}
                </div>

                <div className="pl-6">
                    {/* Problem title */}
                    <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-1">
                        {cluster.problem}
                    </p>

                    {/* Summary */}
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
                        {cluster.summary}
                    </p>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            <Building2 size={10} />
                            {cluster.department}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                            <MapPin size={10} />
                            {cluster.location.split(',')[0]}
                        </span>
                        <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLES[cluster.status]}`}>
                            {STATUS_LABELS[cluster.status]}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Stats row ──────────────────────────── */}
            <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-700">
                <div className="py-2.5 text-center border-r border-gray-100 dark:border-gray-700">
                    <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">
                        {cluster.complaint_count}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Complaints</p>
                </div>
                <div className="py-2.5 text-center border-r border-gray-100 dark:border-gray-700">
                    <p className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">
                        {cluster.rt_reach.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">RT reach</p>
                </div>
                <div className="py-2.5 text-center">
                    <div className="flex justify-center mb-0.5">
                        <TrendIcon trend={cluster.trend} />
                    </div>
                    <p className="text-[10px] text-gray-400">Trend</p>
                </div>
            </div>

            {/* ── Expand toggle ──────────────────────── */}
            <button
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 transition-colors"
            >
                <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
                {expanded ? 'Hide details' : 'View details + tweets'}
            </button>

            {/* ── Expandable details ─────────────────── */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 space-y-3">

                    {/* Detail rows */}
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
                        <div className="flex gap-2">
                            <span className="text-gray-400 dark:text-gray-500 w-28 flex-shrink-0">Recommended</span>
                            <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {cluster.recommended_action}
                            </span>
                        </div>
                    </div>

                    {/* Sample tweets */}
                    <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
                            <XIcon size={11} />
                            Sample tweets
                        </p>
                        <div className="space-y-2">
                            {cluster.sample_tweets.map((tweet, i) => (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                                >
                                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-0.5">
                                        {tweet.handle}
                                    </p>
                                    <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {tweet.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => setAcknowledged(true)}
                            disabled={acknowledged}
                            className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium
                border transition-colors
                ${acknowledged
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 text-blue-600 dark:text-blue-400 cursor-default'
                                    : 'border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                }
              `}
                        >
                            <AlertCircle size={13} />
                            {acknowledged ? 'Acknowledged' : 'Acknowledge'}
                        </button>

                        <button
                            onClick={() => setResolved(true)}
                            disabled={resolved}
                            className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium
                transition-colors
                ${resolved
                                    ? 'bg-green-600 text-white cursor-default opacity-80'
                                    : 'bg-indigo-700 hover:bg-indigo-600 text-white'
                                }
              `}
                        >
                            <CheckCircle size={13} />
                            {resolved ? 'Resolved' : 'Mark resolved'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
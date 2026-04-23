import { useEffect, useRef } from 'react'
import {
    analyticsStats,
    velocityData,
    deptData,
    priorityData,
    statusData,
} from '../data/analytics'
import { AlertTriangle, Zap, Clock, BarChart3, TrendingUp } from 'lucide-react'

// ── Shared Chart.js config helpers ────────────────────────────
const GRID_COLOR = 'rgba(99,102,241,0.06)'
const TICK_COLOR = '#9ca3af'
const DARK_TOOLTIP = {
    backgroundColor: 'rgba(15,15,30,0.92)',
    titleColor: '#e2e8f0',
    bodyColor: '#94a3b8',
    borderColor: 'rgba(99,102,241,0.3)',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 10,
    titleFont: { size: 12, weight: 'bold' },
    bodyFont: { size: 12 },
    displayColors: true,
    boxPadding: 4,
}

// ── Reusable chart card wrapper ────────────────────────────────
function ChartCard({ title, sub, badge, children, className = '' }) {
    return (
        <div className={`glass-panel flex flex-col gap-3 p-5 ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[14px] font-bold text-gray-800 dark:text-gray-100">{title}</p>
                    {sub && <p className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
                </div>
                {badge && (
                    <span className="flex-shrink-0 text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-700/40">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    )
}

// ── Velocity line chart ────────────────────────────────────────
function VelocityChart() {
    const ref = useRef(null)
    const instance = useRef(null)

    useEffect(() => {
        if (!window.Chart || !ref.current) return
        instance.current?.destroy()

        const ctx = ref.current.getContext('2d')
        const gradient = ctx.createLinearGradient(0, 0, 0, 280)
        gradient.addColorStop(0,   'rgba(99,102,241,0.22)')
        gradient.addColorStop(0.7, 'rgba(99,102,241,0.04)')
        gradient.addColorStop(1,   'rgba(99,102,241,0)')

        instance.current = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: velocityData.labels,
                datasets: [
                    {
                        label: 'Complaints filed',
                        data: velocityData.complaints,
                        borderColor: '#6366f1',
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointHoverBorderWidth: 3,
                        tension: 0.45,
                        fill: true,
                    },
                    {
                        label: '7-day average',
                        data: velocityData.avgLine,
                        borderColor: 'rgba(167,139,250,0.55)',
                        borderWidth: 1.5,
                        borderDash: [5, 4],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 900, easing: 'easeInOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...DARK_TOOLTIP,
                        callbacks: {
                            title: (items) => `${items[0].label} — Last 7 days`,
                            label: (item) => {
                                if (item.datasetIndex === 0) return ` Complaints filed: ${item.raw}`
                                return ` 7-day avg: ${item.raw}`
                            },
                            afterBody: (items) => {
                                const val = items[0]?.raw
                                const avg = velocityData.avgLine[0]
                                const diff = val - avg
                                return diff > 0
                                    ? [`  \u2191 ${diff} above average`]
                                    : [`  \u2193 ${Math.abs(diff)} below average`]
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { color: GRID_COLOR },
                        ticks: { color: TICK_COLOR, font: { size: 11 } },
                        border: { display: false },
                    },
                    y: {
                        grid: { color: GRID_COLOR },
                        ticks: { color: TICK_COLOR, font: { size: 11 } },
                        border: { display: false },
                        beginAtZero: true,
                    },
                },
            },
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[240px]">
            <canvas ref={ref} role="img" aria-label="Line chart: complaint velocity over last 7 days." />
        </div>
    )
}

// ── Critical takeaways ─────────────────────────────────────────
function VelocityTakeaways() {
    const data   = velocityData.complaints
    const labels = velocityData.labels
    const avg    = velocityData.avgLine[0]
    const maxVal = Math.max(...data)
    const minVal = Math.min(...data)
    const maxDay = labels[data.indexOf(maxVal)]
    const minDay = labels[data.indexOf(minVal)]
    const latest = data[data.length - 1]
    const prev   = data[data.length - 2]
    const trend  = latest > prev ? 'up' : 'down'
    const delta  = Math.abs(latest - prev)
    const aboveAvgDays = data.filter(v => v > avg).length
    const aboveAvgLabels = labels.filter((_, i) => data[i] > avg).join(', ')

    const takeaways = [
        {
            icon: AlertTriangle,
            colorClass: 'text-red-500',
            bg: 'bg-red-500/5 border-red-200/50 dark:border-red-800/40',
            title: 'Peak complaint day',
            body: `${maxDay} recorded the highest volume at ${maxVal} complaints — ${maxVal - avg} above the weekly average.`,
        },
        {
            icon: Zap,
            colorClass: 'text-amber-500',
            bg: 'bg-amber-500/5 border-amber-200/50 dark:border-amber-800/40',
            title: trend === 'up' ? 'Volume rising' : 'Volume easing',
            body: trend === 'up'
                ? `${minDay} had the quietest day at ${minVal} complaints. Recent weekend dip of ${delta} vs prior day.`
                : `Latest day dropped by ${delta} complaints from previous — a positive de-escalation signal.`,
        },
        {
            icon: Clock,
            colorClass: 'text-indigo-500',
            bg: 'bg-indigo-500/5 border-indigo-200/50 dark:border-indigo-800/40',
            title: '7-day baseline',
            body: `Weekly average sits at ${avg} complaints/day. ${aboveAvgDays} of 7 days exceeded this threshold.`,
        },
        {
            icon: TrendingUp,
            colorClass: 'text-emerald-500',
            bg: 'bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-800/40',
            title: 'Critical action windows',
            body: `High-volume days (${aboveAvgLabels}) are the priority windows for officer deployment and escalation.`,
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {takeaways.map(({ icon: Icon, colorClass, bg, title, body }) => (
                <div key={title} className={`glass-panel border ${bg} p-4 flex gap-3`}>
                    <div className={`mt-0.5 flex-shrink-0 ${colorClass}`}>
                        <Icon size={16} strokeWidth={2.2} />
                    </div>
                    <div>
                        <p className="text-[12px] font-bold text-gray-700 dark:text-gray-200 mb-1">{title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Horizontal bar chart — dept load ──────────────────────────
const DEPT_COLORS = [
    { bar: '#6366f1', hover: '#4f46e5', light: 'bg-indigo-500' },
    { bar: '#f97316', hover: '#ea6a00', light: 'bg-orange-500' },
    { bar: '#22c55e', hover: '#16a34a', light: 'bg-green-500' },
    { bar: '#8b5cf6', hover: '#7c3aed', light: 'bg-violet-500' },
    { bar: '#06b6d4', hover: '#0891b2', light: 'bg-cyan-500' },
    { bar: '#f43f5e', hover: '#e11d48', light: 'bg-rose-500' },
]

function DeptChart() {
    const ref = useRef(null)
    const instance = useRef(null)

    useEffect(() => {
        if (!window.Chart || !ref.current) return
        instance.current?.destroy()

        // Inline plugin: draw count labels at end of each horizontal bar
        const dataLabelsPlugin = {
            id: 'deptDataLabels',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx
                const meta = chart.getDatasetMeta(0)
                const total = deptData.counts.reduce((a, b) => a + b, 0)
                meta.data.forEach((bar, i) => {
                    const value = deptData.counts[i]
                    const pct = ((value / total) * 100).toFixed(0)
                    const text = `${value}  (${pct}%)`
                    ctx.save()
                    ctx.font = 'bold 11px system-ui, sans-serif'
                    ctx.fillStyle = '#6b7280'
                    ctx.textAlign = 'left'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(text, bar.x + 7, bar.y)
                    ctx.restore()
                })
            },
        }

        instance.current = new window.Chart(ref.current, {
            type: 'bar',
            data: {
                labels: deptData.labels,
                datasets: [{
                    label: 'Complaints',
                    data: deptData.counts,
                    backgroundColor: DEPT_COLORS.map(c => c.bar),
                    hoverBackgroundColor: DEPT_COLORS.map(c => c.hover),
                    borderRadius: 8,
                    borderSkipped: false,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 900, easing: 'easeInOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...DARK_TOOLTIP,
                        callbacks: {
                            label: (item) => ` Total complaints: ${item.raw}`,
                            afterLabel: (item) => {
                                const total = deptData.counts.reduce((a, b) => a + b, 0)
                                const pct = ((item.raw / total) * 100).toFixed(1)
                                return ` Share of load: ${pct}%`
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { color: GRID_COLOR },
                        ticks: { color: TICK_COLOR, font: { size: 11 } },
                        border: { display: false },
                        beginAtZero: true,
                        // leave room on right for the inline labels
                        max: Math.max(...deptData.counts) * 1.35,
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#6b7280', font: { size: 12, weight: 'bold' } },
                        border: { display: false },
                    },
                },
            },
            plugins: [dataLabelsPlugin],
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[240px]">
            <canvas ref={ref} role="img" aria-label="Horizontal bar chart of complaints per department." />
        </div>
    )
}

// ── Location hotspot chart ─────────────────────────────────────
const locationData = {
    labels: [
        'Rohini, NW Delhi',
        'AIIMS Flyover',
        'Karol Bagh',
        'Mayur Vihar',
        'Rajiv Chowk',
        'Janakpuri',
        'Lajpat Nagar',
        'Nehru Place',
        'Shahdara',
        'Chandni Chowk',
    ],
    counts:    [412, 356, 298, 287, 245, 221, 193, 178, 177, 158],
    priority1: [412, 356, 298, 287,   0,   0,   0,   0,   0,   0], // critical (p1)
    priority2: [  0,   0,   0,   0, 245, 221, 193, 178,   0,   0], // high (p2)
    priority3: [  0,   0,   0,   0,   0,   0,   0,   0, 177, 158], // medium (p3)
}

function LocationChart() {
    const ref = useRef(null)
    const instance = useRef(null)

    useEffect(() => {
        if (!window.Chart || !ref.current) return
        instance.current?.destroy()

        // Inline plugin: draw count + severity indicator
        const labelPlugin = {
            id: 'locLabels',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx
                chart.data.datasets.forEach((_, di) => {
                    const meta = chart.getDatasetMeta(di)
                    meta.data.forEach((bar, i) => {
                        const value = chart.data.datasets[di].data[i]
                        if (!value) return
                        ctx.save()
                        ctx.font = 'bold 11px system-ui, sans-serif'
                        ctx.fillStyle = '#6b7280'
                        ctx.textAlign = 'left'
                        ctx.textBaseline = 'middle'
                        ctx.fillText(value, bar.x + 6, bar.y)
                        ctx.restore()
                    })
                })
            },
        }

        instance.current = new window.Chart(ref.current, {
            type: 'bar',
            data: {
                labels: locationData.labels,
                datasets: [
                    {
                        label: 'Critical (P1)',
                        data: locationData.priority1,
                        backgroundColor: 'rgba(239,68,68,0.82)',
                        hoverBackgroundColor: '#ef4444',
                        borderRadius: 7,
                        borderSkipped: false,
                    },
                    {
                        label: 'High (P2)',
                        data: locationData.priority2,
                        backgroundColor: 'rgba(249,115,22,0.82)',
                        hoverBackgroundColor: '#f97316',
                        borderRadius: 7,
                        borderSkipped: false,
                    },
                    {
                        label: 'Medium (P3)',
                        data: locationData.priority3,
                        backgroundColor: 'rgba(99,102,241,0.82)',
                        hoverBackgroundColor: '#6366f1',
                        borderRadius: 7,
                        borderSkipped: false,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 900, easing: 'easeInOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...DARK_TOOLTIP,
                        callbacks: {
                            title: (items) => items[0].label,
                            label: (item) => {
                                if (!item.raw) return null
                                return ` ${item.dataset.label}: ${item.raw} complaints`
                            },
                            afterBody: (items) => {
                                const total = items.reduce((s, i) => s + (i.raw || 0), 0)
                                return total ? [`  Total: ${total} complaints`] : []
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: { color: GRID_COLOR },
                        ticks: { color: TICK_COLOR, font: { size: 11 } },
                        border: { display: false },
                        beginAtZero: true,
                        max: Math.max(...locationData.counts) * 1.35,
                    },
                    y: {
                        stacked: false,
                        grid: { display: false },
                        ticks: { color: '#6b7280', font: { size: 11, weight: '600' } },
                        border: { display: false },
                    },
                },
            },
            plugins: [labelPlugin],
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[320px]">
            <canvas ref={ref} role="img" aria-label="Horizontal bar chart of complaints per location." />
        </div>
    )
}

// ── Doughnut chart — resolution status ────────────────────────
function StatusChart() {
    const ref = useRef(null)
    const instance = useRef(null)

    useEffect(() => {
        if (!window.Chart || !ref.current) return
        instance.current?.destroy()
        instance.current = new window.Chart(ref.current, {
            type: 'doughnut',
            data: {
                labels: statusData.labels,
                datasets: [{
                    data: statusData.counts,
                    backgroundColor: ['rgba(249,115,22,0.85)', 'rgba(99,102,241,0.85)', 'rgba(34,197,94,0.85)'],
                    hoverBackgroundColor: ['#f97316', '#6366f1', '#22c55e'],
                    borderWidth: 3,
                    borderColor: 'rgba(255,255,255,0.08)',
                    hoverBorderColor: '#ffffff',
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                animation: { animateRotate: true, duration: 900, easing: 'easeInOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        ...DARK_TOOLTIP,
                        callbacks: {
                            label: (item) => {
                                const total = item.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
                                const pct = ((item.raw / total) * 100).toFixed(1)
                                return ` ${item.label}: ${item.raw} clusters (${pct}%)`
                            },
                        },
                    },
                },
            },
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[220px] flex items-center justify-center">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-bold text-gray-800 dark:text-white">10</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">Clusters</p>
            </div>
            <canvas ref={ref} role="img" aria-label="Doughnut: Pending 50%, In progress 30%, Resolved 20%." />
        </div>
    )
}

// ── Status detail legend ───────────────────────────────────────
const STATUS_DETAIL = [
    { label: 'Pending',     count: 5, pct: 50, bg: 'bg-orange-500', ring: 'border-orange-200/60 dark:border-orange-900/40', icon: '⏳', risk: 'High risk — needs assignment' },
    { label: 'In Progress', count: 3, pct: 30, bg: 'bg-indigo-500', ring: 'border-indigo-200/60 dark:border-indigo-900/40', icon: '🔧', risk: 'Being actively handled' },
    { label: 'Resolved',    count: 2, pct: 20, bg: 'bg-green-500',  ring: 'border-green-200/60 dark:border-green-900/40',  icon: '✅', risk: 'Successfully closed' },
]

function StatusLegend() {
    return (
        <div className="flex flex-col gap-3">
            {STATUS_DETAIL.map(({ label, count, pct, bg, ring, icon, risk }) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl border ${ring} bg-white/40 dark:bg-gray-900/30 px-3.5 py-2.5`}>
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[12.5px] font-bold text-gray-700 dark:text-gray-200">{label}</span>
                            <span className="text-[12px] font-bold text-gray-800 dark:text-white">
                                {count} <span className="text-[10px] font-normal text-gray-400">clusters</span>
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{risk} · {pct}% of total</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Main page ──────────────────────────────────────────────────
export default function Analytics() {
    return (
        <div className="space-y-6">

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Analytics &amp; Insights
                    </h2>
                    <p className="text-[13.5px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                        Comprehensive overview of complaint trends, department performance, and resolution velocity.
                        Use these interactive metrics to identify operational bottlenecks and optimize civic response.
                    </p>
                </div>
                <span className="text-[12px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full self-start sm:self-auto flex-shrink-0">
                    Last 7 days
                </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {analyticsStats.map(({ label, value, sub, subColor }, i) => (
                    <div key={label} className={`glass-panel px-4 py-4 animate-fade-in-up animate-stagger-${i % 4 + 1}`}>
                        <p className="text-[10.5px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                        <p className={`text-[11px] mt-1 font-medium ${subColor}`}>{sub}</p>
                    </div>
                ))}
            </div>

            {/* Velocity chart */}
            <ChartCard
                title="Complaint Volume Velocity"
                sub="Interactive — hover for daily breakdown vs 7-day average"
                badge="Last 7 days"
                className="animate-fade-in-up animate-stagger-2"
            >
                <div className="flex gap-5 -mt-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="inline-block w-5 h-0.5 rounded bg-indigo-500" /> Complaints filed
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="inline-block w-5 border-t border-dashed border-violet-400" /> 7-day avg
                    </span>
                </div>
                <VelocityChart />
            </ChartCard>

            {/* Critical takeaways */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={15} className="text-indigo-500" />
                    <p className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Critical Takeaways from Volume Data
                    </p>
                </div>
                <VelocityTakeaways />
            </div>

            {/* Department load */}
            <ChartCard
                title="Department Load Distribution"
                sub="Complaint burden per responsible department — counts shown on bars"
                badge="6 departments"
                className="animate-fade-in-up animate-stagger-3"
            >
                <DeptChart />
            </ChartCard>
            {/* Location hotspot chart */}
            <ChartCard
                title="Location-wise Issue Hotspots"
                sub="Top 10 locations ranked by complaint volume — colour-coded by severity"
                badge="Top 10 areas"
                className="animate-fade-in-up animate-stagger-4"
            >
                {/* Legend */}
                <div className="flex flex-wrap gap-4 -mt-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Critical (P1)
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" /> High (P2)
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Medium (P3)
                    </span>
                </div>
                <LocationChart />
            </ChartCard>

            {/* Resolution status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                    title="Resolution Status Breakdown"
                    sub="Distribution of all 10 active complaint clusters — hover segment for detail"
                    badge="10 total"
                    className="animate-fade-in-up animate-stagger-4"
                >
                    <StatusChart />
                </ChartCard>

                <ChartCard
                    title="Status Detail"
                    sub="Per-status cluster counts and resolution risk rating"
                    className="animate-fade-in-up animate-stagger-5"
                >
                    <StatusLegend />
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Based on 10 active clusters</span>
                        <span className="font-semibold text-indigo-500">Last 24 hours</span>
                    </div>
                </ChartCard>
            </div>

            {/* Priority load */}
            <ChartCard
                title="Priority Load Distribution"
                sub="Complaint volume broken down by severity level"
                badge={priorityData.activeTotal.toLocaleString() + ' complaints'}
                className="animate-fade-in-up animate-stagger-5"
            >
                <div className="flex flex-col gap-3 mt-1">
                    {priorityData.priorities.map(({ label, count, dot, color, pct }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                            <span className="text-[12.5px] font-semibold text-gray-600 dark:text-gray-300 w-36 flex-shrink-0">{label}</span>
                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200 w-10 text-right">{count}</span>
                            <span className="text-[10.5px] text-gray-400 w-10 text-right">{pct}%</span>
                        </div>
                    ))}
                </div>
            </ChartCard>

        </div>
    )
}
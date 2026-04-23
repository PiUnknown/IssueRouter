import { useEffect, useRef } from 'react'
import {
    analyticsStats,
    velocityData,
    deptData,
    priorityData,
    statusData,
} from '../data/analytics'

// ── Shared Chart.js config helpers ────────────────────────────
const GRID_COLOR = 'rgba(0,0,0,0.06)'
const TICK_COLOR = '#9ca3af'

// ── Reusable chart card wrapper ───────────────────────────────
function ChartCard({ title, sub, legend, children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 ${className}`}>
            <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{title}</p>
            {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 mb-3">{sub}</p>}
            {legend && (
                <div className="flex flex-wrap gap-3 mb-3">
                    {legend.map(({ label, color }) => (
                        <span key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                            {label}
                        </span>
                    ))}
                </div>
            )}
            {children}
        </div>
    )
}

// ── Line chart — complaint velocity ──────────────────────────
function VelocityChart() {
    const ref = useRef(null)
    const instance = useRef(null)

    useEffect(() => {
        if (!window.Chart || !ref.current) return
        instance.current?.destroy()
        instance.current = new window.Chart(ref.current, {
            type: 'line',
            data: {
                labels: velocityData.labels,
                datasets: [
                    {
                        label: 'Complaints filed',
                        data: velocityData.complaints,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.08)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#6366f1',
                        tension: 0.35,
                        fill: true,
                    },
                    {
                        label: '7-day avg',
                        data: velocityData.avgLine,
                        borderColor: '#6366f1',
                        borderWidth: 1.5,
                        borderDash: [5, 4],
                        pointRadius: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } } },
                    y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } }, beginAtZero: true },
                },
            },
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[200px]">
            <canvas
                ref={ref}
                role="img"
                aria-label="Line chart showing daily complaint volume Mon through Sun, peaking Thursday at 320."
            />
        </div>
    )
}

// ── Bar chart — department load ───────────────────────────────
function DeptChart() {
    const ref = useRef(null)
    const instance = useRef(null)

    useEffect(() => {
        if (!window.Chart || !ref.current) return
        instance.current?.destroy()
        instance.current = new window.Chart(ref.current, {
            type: 'bar',
            data: {
                labels: deptData.labels,
                datasets: [{
                    label: 'Complaints',
                    data: deptData.counts,
                    backgroundColor: '#6366f1',
                    borderRadius: 4,
                    borderSkipped: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: TICK_COLOR, font: { size: 11 } } },
                    y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { size: 11 } }, beginAtZero: true },
                },
            },
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[200px]">
            <canvas
                ref={ref}
                role="img"
                aria-label="Bar chart of total complaints by department."
            />
        </div>
    )
}

// ── Doughnut chart — resolution status ───────────────────────
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
                    backgroundColor: statusData.colors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: { legend: { display: false } },
            },
        })
        return () => instance.current?.destroy()
    }, [])

    return (
        <div className="relative w-full h-[200px]">
            <canvas
                ref={ref}
                role="img"
                aria-label="Doughnut chart: Pending 50%, In progress 30%, Resolved 20%."
            />
        </div>
    )
}

// ── Priority load panel ───────────────────────────────────────
function PriorityPanel() {
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3">
            <div>
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">Priority load</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Distribution by severity</p>
            </div>

            {/* Active complaints box */}
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg px-4 py-3 text-center">
                <p className="text-[28px] font-semibold text-gray-800 dark:text-gray-100">
                    {priorityData.activeTotal.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Active complaints</p>
            </div>

            {/* Priority rows */}
            <div className="flex flex-col gap-2.5">
                {priorityData.priorities.map(({ label, count, dot, color, pct }) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                        <span className="text-[12px] text-gray-600 dark:text-gray-300 flex-1 whitespace-nowrap">
                            {label}
                        </span>
                        <div className="flex-[2] h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 min-w-[28px] text-right">
                            {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────
export default function Analytics() {
    // Load Chart.js once from CDN


    return (
        <div className="space-y-5">

            {/* ── Page header ───────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Analytics</h2>
                    <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Complaint trends and department performance
                    </p>
                </div>
                <span className="text-[12px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full self-start sm:self-auto">
                    Last 7 days
                </span>
            </div>

            {/* ── Stat cards ────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {analyticsStats.map(({ label, value, sub, subColor }) => (
                    <div
                        key={label}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
                    >
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{value}</p>
                        <p className={`text-[11px] mt-1 ${subColor}`}>{sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Velocity line chart ───────────────── */}
            <ChartCard
                title="Complaint volume velocity"
                sub="New complaints per day — last 7 days"
                legend={[
                    { label: 'Complaints filed', color: 'bg-indigo-500' },
                    { label: '7-day average', color: 'bg-indigo-200' },
                ]}
            >
                <VelocityChart />
            </ChartCard>

            {/* ── Dept bar + Priority panel ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard
                    title="Department load distribution"
                    sub="Total complaints by responsible department"
                    legend={[{ label: 'Complaints', color: 'bg-indigo-500' }]}
                    className="lg:col-span-2"
                >
                    <DeptChart />
                </ChartCard>

                <PriorityPanel />
            </div>

            {/* ── Doughnut chart ────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChartCard
                    title="Resolution status breakdown"
                    sub="Share of clusters by current status"
                    legend={statusData.legend.map(({ label, pct, color }) => ({
                        label: `${label} ${pct}`,
                        color,
                    }))}
                >
                    <StatusChart />
                </ChartCard>

                {/* Totals summary next to pie */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-center gap-3">
                    <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">Status summary</p>
                    {statusData.legend.map(({ label, pct, color }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${color}`} />
                            <span className="text-[13px] text-gray-600 dark:text-gray-300 flex-1">{label}</span>
                            <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{pct}</span>
                        </div>
                    ))}
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                        Based on 10 active clusters · last 24 hours
                    </p>
                </div>
            </div>

        </div>
    )
}
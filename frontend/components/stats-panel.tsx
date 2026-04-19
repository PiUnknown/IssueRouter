'use client'

import { Card } from '@/components/ui/card'
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

const stats = [
  {
    label: 'Total Grievances',
    value: '247',
    icon: Activity,
    color: 'text-chart-1',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'Urgent',
    value: '12',
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-red-500/10',
  },
  {
    label: 'Resolved',
    value: '156',
    icon: CheckCircle2,
    color: 'text-chart-5',
    bgColor: 'bg-green-500/10',
  },
  {
    label: 'Pending',
    value: '79',
    icon: Clock,
    color: 'text-chart-3',
    bgColor: 'bg-yellow-500/10',
  },
]

export function StatsPanel() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground px-2">Overview</h2>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-4 border border-border bg-card hover:bg-card/80 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

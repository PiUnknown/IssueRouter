import { TrendingUp, AlertCircle, CheckCircle, TimerReset } from 'lucide-react';

export function StatCards() {
  const stats = [
    {
      title: 'Total Ingested (24h)',
      value: '342',
      icon: <TrendingUp className="h-5 w-5" />,
      tint: 'from-blue-500/16 to-transparent',
      accent: 'text-blue-300',
      meta: '+12.4% vs yesterday',
    },
    {
      title: 'Unassigned Issues',
      value: '14',
      icon: <AlertCircle className="h-5 w-5" />,
      tint: 'from-orange-500/14 to-transparent',
      accent: 'text-orange-300',
      badge: 'Needs review',
    },
    {
      title: 'Critical Urgency',
      value: '8',
      icon: <AlertCircle className="h-5 w-5" />,
      tint: 'from-red-500/14 to-transparent',
      accent: 'text-red-300',
      badge: 'Field action',
    },
    {
      title: 'AI Routing Accuracy',
      value: '94.2%',
      icon: <CheckCircle className="h-5 w-5" />,
      tint: 'from-blue-500/12 to-transparent',
      accent: 'text-blue-300',
      meta: 'Across last 100 cases',
    },
    {
      title: 'Median Triage Time',
      value: '01:48',
      icon: <TimerReset className="h-5 w-5" />,
      tint: 'from-slate-500/14 to-transparent',
      accent: 'text-slate-300',
      meta: 'From ingest to action',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`rounded-[24px] border border-white/6 bg-gradient-to-br ${stat.tint} p-5 shadow-[0_18px_44px_rgba(3,8,20,0.26)]`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">{stat.title}</h3>
            <div className={`rounded-2xl border border-white/8 bg-white/[0.04] p-2 ${stat.accent}`}>{stat.icon}</div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              {stat.meta && <p className="mt-2 text-xs text-slate-500">{stat.meta}</p>}
            </div>
            {stat.badge && (
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-200">
                {stat.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

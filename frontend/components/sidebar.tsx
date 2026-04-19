import Image from 'next/image';
import { BarChart3, LayoutDashboard, ListTodo, Map, Settings, ShieldAlert } from 'lucide-react';

export type DashboardTab = 'dashboard' | 'triage' | 'map' | 'analytics';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  triageCount?: number;
}

export function Sidebar({ activeTab, onTabChange, triageCount = 0 }: SidebarProps) {
  return (
    <aside className="hidden w-[304px] border-r border-white/6 bg-[#080c12]/92 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="border-b border-white/6 px-6 py-6">
        <div className="rounded-[26px] border border-white/6 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4">
          <Image
            src="/issuerouter-logo.svg"
            alt="IssueRouter"
            width={220}
            height={48}
            className="h-auto w-[220px]"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <NavItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onClick={() => onTabChange('dashboard')}
        />
        <NavItem
          icon={<ListTodo className="h-5 w-5" />}
          label="Triage Queue"
          active={activeTab === 'triage'}
          badge={triageCount}
          onClick={() => onTabChange('triage')}
        />
        <NavItem
          icon={<Map className="h-5 w-5" />}
          label="Map View"
          active={activeTab === 'map'}
          onClick={() => onTabChange('map')}
        />
        <NavItem
          icon={<BarChart3 className="h-5 w-5" />}
          label="Analytics"
          active={activeTab === 'analytics'}
          onClick={() => onTabChange('analytics')}
        />
      </nav>

      <div className="mx-4 mb-4 rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-orange-500/16 p-2">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Response readiness</p>
            <p className="text-xs text-slate-400">3 field teams available</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/6 px-4 py-6">
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          onClick={() => onTabChange(activeTab)}
        />
        <button className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.04]">
          Sign Out
        </button>
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, badge, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-3 transition ${
        active
          ? 'rounded-2xl border border-blue-400/20 bg-blue-500/12 text-white shadow-[0_14px_32px_rgba(37,99,235,0.18)]'
          : 'rounded-2xl text-slate-300 hover:bg-white/[0.04]'
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </span>
      {badge ? (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

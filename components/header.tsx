import { Activity, Bell, Search, LogOut, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/6 bg-[#0b1018]/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by complaint ID, location, keyword..."
              className="w-full rounded-2xl border border-white/8 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 ml-6">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 md:flex">
            <Activity className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-semibold tracking-[0.18em] text-emerald-200">LIVE INGESTION</span>
          </div>

          <button className="relative rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition hover:bg-white/[0.06]">
            <Bell className="h-5 w-5 text-slate-300" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          <button className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition hover:bg-white/[0.06]">
            <Settings className="h-5 w-5 text-slate-300" />
          </button>

          <button className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 transition hover:bg-white/[0.06]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700">
              <span className="text-xs font-bold text-white">SJ</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-white">S. Jenkins</p>
              <p className="text-xs text-slate-500">System Admin</p>
            </div>
          </button>

          <button className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 transition hover:bg-white/[0.06]">
            <LogOut className="h-5 w-5 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}

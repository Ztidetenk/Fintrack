import { PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react';
import { HORIZON_MONTHS } from '../../data/roadmap';
import { useTwoStepConfirm } from '../../lib/useTwoStepConfirm';
import { useDashboard } from '../../state/DashboardContext';
import { cn } from '../ui/cn';
import { ProgressBar } from '../ui/ProgressBar';
import { SessionPill } from '../SessionPill';
import { Logo } from './Logo';
import { NAV } from './nav';

export function Sidebar() {
  const { tab, setTab, sidebarCollapsed: collapsed, setSidebarCollapsed, currentMonth, currentPhase, resetAll } = useDashboard();

  const reset = useTwoStepConfirm(resetAll);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-[width] duration-300 md:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center gap-3 border-b border-zinc-800/80', collapsed ? 'justify-center px-0' : 'px-5')}>
        <Logo className="size-8 shrink-0" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">Apex Horizon</p>
            <p className="truncate text-[11px] text-zinc-500">Capital & Milestone Tracker</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Sections">
        {NAV.map((item) => {
          const active = item.id === tab;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl text-sm font-medium transition-colors',
                collapsed ? 'h-11 justify-center' : 'h-10 px-3',
                active ? 'bg-zinc-800/70 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-400" aria-hidden />}
              <Icon className={cn('size-[18px] shrink-0', active && 'text-emerald-400')} strokeWidth={1.75} aria-hidden />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-zinc-800/80 p-3">
        {!collapsed && (
          <div className="rounded-xl bg-zinc-900/70 p-3 ring-1 ring-zinc-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Horizon</span>
              <span className="font-mono text-zinc-300">
                M{currentMonth}/{HORIZON_MONTHS}
              </span>
            </div>
            <ProgressBar value={currentMonth / HORIZON_MONTHS} size="xs" className="mt-2" label="15-year horizon progress" />
            <p className="mt-2 truncate text-[11px] text-zinc-500">
              Phase {currentPhase.id} · {currentPhase.codename}
            </p>
            <div className="mt-3">
              <SessionPill />
            </div>
          </div>
        )}
        <div className={cn('flex gap-1', collapsed ? 'flex-col items-center' : 'items-center justify-between')}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!collapsed)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
          <button
            type="button"
            onClick={reset.trigger}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[11px] transition-colors',
              reset.armed
                ? 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30'
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200',
            )}
            title={reset.armed ? 'Click again to reset every tracker to the demo state' : 'Reset all data to the demo state'}
            aria-label={reset.armed ? 'Confirm reset of all data' : 'Reset all data'}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {!collapsed && (reset.armed ? 'Click to confirm' : 'Reset data')}
          </button>
        </div>
      </div>
    </aside>
  );
}

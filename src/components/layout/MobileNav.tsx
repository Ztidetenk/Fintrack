import { useDashboard } from '../../state/DashboardContext';
import { cn } from '../ui/cn';
import { NAV } from './nav';

export function MobileNav() {
  const { tab, setTab } = useDashboard();
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid grid-cols-5">
        {NAV.map((item) => {
          const active = item.id === tab;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                active ? 'text-emerald-400' : 'text-zinc-500 active:text-zinc-200',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                  active && 'bg-emerald-500/10',
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              {item.short}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

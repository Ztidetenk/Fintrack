import { Cake, Crosshair, Hourglass, SquareTerminal, UserRound } from 'lucide-react';
import { PROFILE } from '../../data/roadmap';
import { ageAt, daysUntilNextBirthday, parseISODate } from '../../lib/format';
import { useDashboard, useNow } from '../../state/DashboardContext';
import { cn } from '../ui/cn';
import { SessionPill } from '../SessionPill';
import { Logo } from './Logo';

const birth = parseISODate(PROFILE.birthDate);

const etFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
});

/** CME equity-index futures session for a moment in New York time. */
function marketSession(now: Date) {
  const parts = Object.fromEntries(etFormatter.formatToParts(now).map((p) => [p.type, p.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const day = parts.weekday;
  const clock = `${parts.hour}:${parts.minute}:${parts.second}`;

  const closed = day === 'Sat' || (day === 'Sun' && minutes < 18 * 60) || (day === 'Fri' && minutes >= 17 * 60);
  if (closed) return { clock, label: 'Market closed', tone: 'zinc' as const };
  if (minutes >= 17 * 60 && minutes < 18 * 60) return { clock, label: 'CME maintenance', tone: 'zinc' as const };
  if (minutes >= 9 * 60 + 30 && minutes < 11 * 60) return { clock, label: 'NY AM session', tone: 'emerald' as const };
  if (minutes >= 13 * 60 + 30 && minutes < 16 * 60) return { clock, label: 'NY PM session', tone: 'cyan' as const };
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) return { clock, label: 'NY lunch · low prob.', tone: 'amber' as const };
  return { clock, label: 'Globex overnight', tone: 'zinc' as const };
}

const DOT = { emerald: 'bg-emerald-400', cyan: 'bg-cyan-400', amber: 'bg-amber-400', zinc: 'bg-zinc-500' };

export function Header() {
  const { setTab } = useDashboard();
  const now = useNow(1_000);
  const age = ageAt(birth, now);
  const daysToBirthday = daysUntilNextBirthday(birth, now);
  const birthdayLabel = birth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const session = marketSession(now);

  const chips = [
    {
      icon: Cake,
      label: `Age ${age}`,
      value: daysToBirthday === 0 ? `Turning ${age} today` : `Turns ${age + 1} on ${birthdayLabel} · ${daysToBirthday}d`,
    },
    { icon: Crosshair, label: 'Strategy', value: PROFILE.strategy },
    { icon: Hourglass, label: 'Horizon', value: PROFILE.horizon },
  ];

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Logo className="size-8 shrink-0 md:hidden" />
        <div className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 p-px md:flex">
          <span className="flex size-full items-center justify-center rounded-full bg-zinc-950">
            <UserRound className="size-5 text-zinc-300" strokeWidth={1.75} aria-hidden />
          </span>
        </div>

        <div className="scrollbar-none -my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
          {chips.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-zinc-900/70 px-2.5 py-1.5 ring-1 ring-zinc-800"
            >
              <Icon className="size-3.5 text-zinc-500" aria-hidden />
              <span className="text-[11px] text-zinc-500">{label}</span>
              <span className="text-xs font-medium text-zinc-200">{value}</span>
            </div>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <div className="text-right leading-tight">
            <p className="font-mono text-sm text-zinc-100 tabular-nums">
              {session.clock} <span className="text-[10px] text-zinc-500">ET</span>
            </p>
            <p className="flex items-center justify-end gap-1.5 text-[11px] text-zinc-400">
              <span className={cn('size-1.5 rounded-full', DOT[session.tone])} aria-hidden />
              {session.label}
            </p>
          </div>
          <button type="button" onClick={() => setTab('terminal')} title="Open the Execution Terminal" className="rounded-full">
            <SessionPill />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setTab('terminal')}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800 lg:hidden"
          aria-label="Open the Execution Terminal"
        >
          <SquareTerminal className="size-4" aria-hidden />
        </button>
      </div>
    </header>
  );
}

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';
import type { Tone } from './Card';

const STYLES: Record<Tone, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  cyan: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/25',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/25',
  zinc: 'bg-zinc-800/70 text-zinc-300 ring-zinc-700',
};

const DOT: Record<Tone, string> = {
  emerald: 'bg-emerald-400',
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
  zinc: 'bg-zinc-500',
};

interface StatusPillProps {
  tone?: Tone;
  icon?: LucideIcon;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

/** Status is never color-only: every pill carries an icon or dot plus a text label. */
export function StatusPill({ tone = 'zinc', icon: Icon, pulse, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset',
        STYLES[tone],
        className,
      )}
    >
      {Icon ? (
        <Icon className="size-3" strokeWidth={2.25} aria-hidden />
      ) : (
        <span className="relative flex size-1.5">
          {pulse && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-75', DOT[tone])} />}
          <span className={cn('relative size-1.5 rounded-full', DOT[tone])} />
        </span>
      )}
      {children}
    </span>
  );
}

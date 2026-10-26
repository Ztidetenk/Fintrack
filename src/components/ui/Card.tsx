import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconTone?: Tone;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export type Tone = 'emerald' | 'cyan' | 'amber' | 'rose' | 'violet' | 'zinc';

export const TONE_TEXT: Record<Tone, string> = {
  emerald: 'text-emerald-400',
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  violet: 'text-violet-400',
  zinc: 'text-zinc-400',
};

export const TONE_TILE: Record<Tone, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  zinc: 'bg-zinc-800/60 text-zinc-300 ring-zinc-700/60',
};

export function IconTile({
  icon: Icon,
  tone = 'zinc',
  size = 'md',
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
}) {
  const box = size === 'sm' ? 'size-7 rounded-lg' : size === 'lg' ? 'size-12 rounded-xl' : 'size-9 rounded-lg';
  const glyph = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-6' : 'size-[18px]';
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center ring-1 ring-inset', box, TONE_TILE[tone])}>
      <Icon className={glyph} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export function Card({ title, subtitle, icon, iconTone = 'zinc', action, className, bodyClassName, children }: CardProps) {
  return (
    <section className={cn('glass rounded-2xl shadow-[0_1px_0_0_rgb(255_255_255/0.03)_inset]', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <IconTile icon={icon} tone={iconTone} />}
            <div className="min-w-0">
              {title && <h2 className="truncate text-sm font-semibold tracking-tight text-zinc-100">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Tiny uppercase label used above stat values. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[10px] font-medium tracking-[0.14em] text-zinc-500 uppercase', className)}>{children}</p>
  );
}

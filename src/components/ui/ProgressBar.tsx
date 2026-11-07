import { cn } from './cn';
import type { Tone } from './Card';

const FILL: Record<Tone, string> = {
  emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgb(16_185_129/0.35)]',
  cyan: 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgb(6_182_212/0.35)]',
  amber: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgb(245_158_11/0.35)]',
  rose: 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_12px_rgb(244_63_94/0.35)]',
  violet: 'bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_12px_rgb(139_92_246/0.35)]',
  zinc: 'bg-zinc-500',
};

const TRACK: Record<Tone, string> = {
  emerald: 'bg-emerald-950/60',
  cyan: 'bg-cyan-950/60',
  amber: 'bg-amber-950/50',
  rose: 'bg-rose-950/60',
  violet: 'bg-violet-950/60',
  zinc: 'bg-zinc-800',
};

interface ProgressBarProps {
  value: number;
  tone?: Tone;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  className?: string;
}

export function ProgressBar({ value, tone = 'emerald', size = 'sm', label, className }: ProgressBarProps) {
  const v = Math.max(0, Math.min(1, value));
  const h = size === 'xs' ? 'h-1' : size === 'md' ? 'h-2.5' : 'h-1.5';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('w-full overflow-hidden rounded-full', h, TRACK[tone], className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', FILL[tone])}
        style={{ width: `${v * 100}%`, minWidth: v > 0 ? '4px' : 0 }}
      />
    </div>
  );
}

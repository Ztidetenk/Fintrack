import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_20px_rgb(16_185_129/0.25)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none',
  amber:
    'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_20px_rgb(245_158_11/0.25)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none',
  secondary: 'bg-zinc-800/80 text-zinc-100 ring-1 ring-inset ring-zinc-700 hover:bg-zinc-700/80 disabled:text-zinc-500',
  ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:text-zinc-600',
  danger: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'xs' | 'sm' | 'md';
  icon?: LucideIcon;
}

export function Button({
  variant = 'secondary',
  size = 'sm',
  icon: Icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const sizing =
    size === 'xs' ? 'h-7 px-2 text-xs gap-1' : size === 'md' ? 'h-11 px-4 text-sm gap-2' : 'h-9 px-3 text-xs gap-1.5';
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        sizing,
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className={size === 'md' ? 'size-4' : 'size-3.5'} aria-hidden />}
      {children}
    </button>
  );
}

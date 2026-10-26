import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

export function Segmented<T extends string>({ value, options, onChange, label, size = 'sm' }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-zinc-950/70 p-0.5 ring-1 ring-zinc-800">
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

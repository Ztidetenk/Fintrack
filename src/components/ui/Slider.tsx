import type { CSSProperties, ReactNode } from 'react';
import { cn } from './cn';

interface SliderProps {
  id: string;
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  display: ReactNode;
  accent?: string;
  hint?: ReactNode;
  minLabel?: string;
  maxLabel?: string;
  size?: 'md' | 'lg';
}

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  accent,
  hint,
  minLabel,
  maxLabel,
  size = 'md',
}: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-zinc-400">
          {label}
        </label>
        <output htmlFor={id} className={cn('font-semibold text-zinc-50', size === 'lg' ? 'text-3xl tracking-tight' : 'text-sm')}>
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-2"
        style={{ '--fill': `${fill}%`, ...(accent ? { '--accent': accent } : {}) } as CSSProperties}
      />
      {(minLabel || maxLabel) && (
        <div className="mt-0.5 flex justify-between font-mono text-[10px] text-zinc-500">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

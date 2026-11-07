import type { ReactNode } from 'react';

export function PageIntro({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="font-mono text-[11px] tracking-[0.16em] text-emerald-400/90 uppercase">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[28px]">{title}</h1>
        {children && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{children}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

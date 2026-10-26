import { ArrowUpRight, Briefcase, Flag, Landmark, Minus, Plus, Shield, Target } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ACCOUNT_TYPES, HARD_ASSET_TARGET, MILESTONES, RULES } from '../data/roadmap';
import { addMonths, monthYear, pct, signedUsd, usd, usdCompact } from '../lib/format';
import { dateForMonth } from '../lib/projection';
import { planEta, useDashboard } from '../state/DashboardContext';
import { Eyebrow, IconTile, type Tone } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SessionPill } from '../components/SessionPill';

function KpiCard({
  icon,
  tone,
  label,
  children,
  footer,
  className,
}: {
  icon: typeof Flag;
  tone: Tone;
  label: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('glass group flex flex-col rounded-2xl p-4 transition-colors hover:border-zinc-700/80', className)}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{label}</Eyebrow>
        <IconTile icon={icon} tone={tone} size="sm" />
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {footer && <div className="mt-3 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">{footer}</div>}
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-100"
    >
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
    </button>
  );
}

export function KpiGrid() {
  const d = useDashboard();
  const phase = d.currentPhase;
  const monthInPhase = d.currentMonth - phase.startMonth + 1;
  const phaseLength = phase.endMonth - phase.startMonth + 1;

  const active = d.vault.active;
  const activeEta = active ? planEta(d.planProjection, active.milestone.id) : undefined;
  const acquiredCount = d.acquired.length;

  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0].id);
  const count = d.accounts[accountType] ?? 0;
  const fleet = ACCOUNT_TYPES.filter((t) => (d.accounts[t.id] ?? 0) > 0);

  const ts = d.terminalStatus;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6 2xl:grid-cols-5">
      {/* Current phase */}
      <KpiCard
        icon={Flag}
        tone="emerald"
        label="Current phase"
        className="xl:col-span-2 2xl:col-span-1"
        footer={
          <div className="flex items-center justify-between">
            <span>
              {phase.window} · {phase.ages}
            </span>
            <LinkButton onClick={() => d.openPhase(phase.id)}>Roadmap</LinkButton>
          </div>
        }
      >
        <p className="text-xs text-emerald-400">Phase {phase.id}</p>
        <p className="mt-0.5 text-lg leading-snug font-semibold tracking-tight">{phase.codename}</p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
          <span>
            Month {monthInPhase} of {phaseLength}
          </span>
          <span className="font-mono">{pct(monthInPhase / phaseLength)}</span>
        </div>
        <ProgressBar value={monthInPhase / phaseLength} size="xs" className="mt-1.5" label="Phase progress" />
      </KpiCard>

      {/* Active accounts */}
      <KpiCard
        icon={Briefcase}
        tone="cyan"
        label="Active accounts"
        className="xl:col-span-2 2xl:col-span-1"
        footer={
          <div className="flex items-center justify-between gap-2">
            <span>
              Est. capacity{' '}
              <span className="font-medium text-zinc-200">
                {d.accountCapacity ? `${usd(d.accountCapacity)}/mo` : '$0 · in eval'}
              </span>
            </span>
            {d.accountCapacity > 0 && (
              <button
                type="button"
                onClick={() => d.updateSim({ monthlyPayout: Math.min(80_000, d.accountCapacity) })}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
              >
                Use in simulator
              </button>
            )}
          </div>
        }
      >
        <p className="text-lg leading-snug font-semibold tracking-tight">
          {fleet.length === 0 ? 'No accounts' : `${d.accounts[fleet[0].id]}× ${fleet[0].label}`}
        </p>
        <p className="text-[11px] text-zinc-500">
          {fleet.length > 1
            ? `+ ${fleet
                .slice(1)
                .map((t) => `${d.accounts[t.id]}× ${t.label}`)
                .join(', ')}`
            : `${d.accountTotal} account${d.accountTotal === 1 ? '' : 's'} in the fleet`}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="kpi-account-type" className="sr-only">
            Account type
          </label>
          <select
            id="kpi-account-type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="h-8 min-w-0 flex-1 rounded-lg bg-zinc-950/80 px-2 text-xs text-zinc-200 ring-1 ring-zinc-800 outline-none focus:ring-cyan-500/50"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="flex items-center rounded-lg bg-zinc-950/80 ring-1 ring-zinc-800">
            <button
              type="button"
              onClick={() => d.setAccountCount(accountType, count - 1)}
              disabled={count === 0}
              className="flex size-8 items-center justify-center text-zinc-400 hover:text-zinc-100 disabled:text-zinc-700"
              aria-label="Remove one account"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center font-mono text-xs tabular-nums" aria-live="polite">
              {count}
            </span>
            <button
              type="button"
              onClick={() => d.setAccountCount(accountType, count + 1)}
              className="flex size-8 items-center justify-center text-zinc-400 hover:text-zinc-100"
              aria-label="Add one account"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </KpiCard>

      {/* Next milestone */}
      <KpiCard
        icon={Target}
        tone="amber"
        label="Next milestone"
        className="xl:col-span-2 2xl:col-span-1"
        footer={
          active ? (
            <div className="flex items-center justify-between">
              <span>
                Plan ETA{' '}
                <span className="font-medium text-zinc-200">
                  {activeEta ? monthYear(addMonths(dateForMonth(activeEta.month), d.delayMonths)) : 'Beyond Y15'}
                </span>
                {d.delayMonths > 0 && <span className="text-rose-300"> (+{d.delayMonths} mo)</span>}
              </span>
              <LinkButton onClick={() => d.setTab('vault')}>Vault</LinkButton>
            </div>
          ) : (
            'Every trophy acquired.'
          )
        }
      >
        {active ? (
          <>
            <p className="text-lg leading-snug font-semibold tracking-tight">{active.milestone.name}</p>
            <p className="text-[11px] text-zinc-500">
              {active.milestone.range
                ? `${usd(active.milestone.range[0])} – ${usd(active.milestone.range[1])}`
                : usd(active.milestone.target)}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-zinc-300">
                {usd(active.funded)} <span className="text-zinc-500">/ {usdCompact(active.milestone.target)}</span>
              </span>
              <span className="font-mono text-amber-300">{pct(active.progress, 1)}</span>
            </div>
            <ProgressBar
              value={active.progress}
              tone="amber"
              size="sm"
              className="mt-1.5"
              label={`${active.milestone.name} progress`}
            />
          </>
        ) : (
          <p className="text-lg font-semibold">Trophy room complete</p>
        )}
      </KpiCard>

      {/* Hard assets */}
      <KpiCard
        icon={Landmark}
        tone="amber"
        label="Hard assets acquired"
        className="xl:col-span-3 2xl:col-span-1"
        footer={
          <div className="flex items-center justify-between">
            <span>
              {acquiredCount} of {MILESTONES.length} trophies
            </span>
            <span className="font-mono">{pct(d.vault.hardAssetsAcquired / HARD_ASSET_TARGET, 1)}</span>
          </div>
        }
      >
        <p className="text-2xl font-semibold tracking-tight">
          {usdCompact(d.vault.hardAssetsAcquired)}
          <span className="text-sm font-normal text-zinc-500"> / {usdCompact(HARD_ASSET_TARGET)}+ target</span>
        </p>
        <ProgressBar
          value={d.vault.hardAssetsAcquired / HARD_ASSET_TARGET}
          tone="amber"
          size="sm"
          className="mt-3"
          label="Hard assets vs target"
        />
        <div className="mt-2 flex gap-1" aria-hidden>
          {MILESTONES.map((m) => {
            const owned = d.acquired.some((a) => a.id === m.id);
            const Icon = m.icon;
            return (
              <span
                key={m.id}
                title={m.name}
                className={cn(
                  'flex size-6 items-center justify-center rounded-md ring-1',
                  owned ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30' : 'bg-zinc-900 text-zinc-600 ring-zinc-800',
                )}
              >
                <Icon className="size-3.5" />
              </span>
            );
          })}
        </div>
      </KpiCard>

      {/* Daily rule status */}
      <KpiCard
        icon={Shield}
        tone={ts.status === 'locked' ? 'rose' : 'emerald'}
        label="Daily trade rules"
        className="xl:col-span-3 2xl:col-span-1"
        footer={
          <div className="flex items-center justify-between">
            <SessionPill />
            <LinkButton onClick={() => d.setTab('terminal')}>Terminal</LinkButton>
          </div>
        }
      >
        <dl className="grid grid-cols-3 gap-2">
          {[
            { k: 'Max risk', v: usd(RULES.maxRiskPerTrade), sub: 'per trade' },
            { k: 'Max trades', v: String(RULES.maxTrades), sub: `${ts.tradesUsed} used` },
            { k: 'Daily lock', v: usd(RULES.dailyLock), sub: `${usd(ts.lossBudgetLeft)} left` },
          ].map((r) => (
            <div key={r.k} className="rounded-lg bg-zinc-950/60 p-2 ring-1 ring-zinc-800">
              <dt className="text-[10px] text-zinc-500">{r.k}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{r.v}</dd>
              <dd className="text-[10px] text-zinc-500">{r.sub}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2.5 text-[11px] text-zinc-400">
          Today's P&L{' '}
          <span
            className={cn(
              'font-mono font-medium',
              ts.pnl < 0 ? 'text-rose-300' : ts.pnl > 0 ? 'text-emerald-300' : 'text-zinc-200',
            )}
          >
            {signedUsd(ts.pnl)}
          </span>
        </p>
      </KpiCard>
    </div>
  );
}

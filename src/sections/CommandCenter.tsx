import { ArrowRight, Calculator, CheckCircle2, Lock, Route, ShieldCheck, SquareTerminal, Trophy } from 'lucide-react';
import { MILESTONES, PHASES, RULES } from '../data/roadmap';
import { monthYear, pct, signedUsd, usd, usdCompact } from '../lib/format';
import { planEta, useDashboard } from '../state/DashboardContext';
import { AcquisitionChips, ProjectionChart, ProjectionLegend } from '../components/ProjectionChart';
import { PageIntro } from '../components/PageIntro';
import { Button } from '../components/ui/Button';
import { Card, Eyebrow } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusPill } from '../components/ui/StatusPill';
import { KpiGrid } from './KpiGrid';

export function CommandCenter() {
  const d = useDashboard();
  const plan = d.planProjection;

  return (
    <div className="space-y-6">
      <PageIntro eyebrow={`Month ${d.currentMonth} · ${monthYear(d.now)}`} title="Command Center">
        One $25k eval today. A multi-million-dollar private fund by 34. Everything below updates live.
      </PageIntro>

      <KpiGrid />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="15-Year Horizon Projection"
          subtitle={`Roadmap payout curve · ${pct(d.sim.vaultPct)} vault · ${pct(1 - 0.35 - d.sim.vaultPct)} treasury at ${pct(d.sim.treasuryReturn)}/yr`}
          icon={Route}
          iconTone="cyan"
          action={
            <Button size="xs" variant="ghost" icon={Calculator} onClick={() => d.setTab('treasury')}>
              Simulator
            </Button>
          }
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>Net worth at Year 15 · Age {plan.final.age}</Eyebrow>
              <p className="mt-1 text-5xl font-semibold tracking-tight text-zinc-50">{usdCompact(plan.final.netWorth)}</p>
            </div>
            <ProjectionLegend projection={plan} />
          </div>
          <div className="mt-4">
            <ProjectionChart projection={plan} height={280} />
          </div>
          <div className="mt-3">
            <AcquisitionChips projection={plan} />
          </div>
        </Card>

        <DisciplineCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Phase Strip"
          subtitle="Tap a phase to open it on the roadmap"
          icon={Route}
          iconTone="emerald"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {PHASES.map((p) => {
              const status = d.currentMonth > p.endMonth ? 'done' : d.currentMonth >= p.startMonth ? 'active' : 'upcoming';
              const done = p.objectives.filter((o) => d.roadmapDone.includes(o.id)).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => d.openPhase(p.id)}
                  className={cn(
                    'group flex flex-col rounded-xl p-3 text-left ring-1 transition-all hover:-translate-y-0.5',
                    status === 'active'
                      ? 'bg-emerald-500/[0.07] ring-emerald-500/30 hover:ring-emerald-500/50'
                      : 'bg-zinc-950/50 ring-zinc-800 hover:ring-zinc-700',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'font-mono text-[10px] tracking-widest uppercase',
                        status === 'active' ? 'text-emerald-400' : 'text-zinc-500',
                      )}
                    >
                      Phase {p.id}
                    </span>
                    {status === 'active' && (
                      <StatusPill tone="emerald" pulse>
                        Now
                      </StatusPill>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-snug font-medium text-zinc-100">{p.codename}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{p.ages}</p>
                  <p className="mt-auto pt-3 text-xs font-medium text-zinc-300">{p.payoutLabel}</p>
                  <ProgressBar
                    value={done / p.objectives.length}
                    size="xs"
                    className="mt-2"
                    tone={status === 'active' ? 'emerald' : 'zinc'}
                    label={`Phase ${p.id} objectives`}
                  />
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title="Trophy Shelf"
          subtitle={`${usdCompact(d.vault.available)} in the vault`}
          icon={Trophy}
          iconTone="amber"
          action={
            <Button size="xs" variant="ghost" onClick={() => d.setTab('vault')}>
              Open <ArrowRight className="size-3" />
            </Button>
          }
        >
          <ul className="space-y-3">
            {d.vault.items.map((item) => {
              const Icon = item.milestone.icon;
              const eta = planEta(plan, item.milestone.id);
              return (
                <li key={item.milestone.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1',
                      item.status === 'acquired'
                        ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                        : item.status === 'active'
                          ? 'bg-zinc-900 text-amber-300 ring-amber-500/20'
                          : 'bg-zinc-900 text-zinc-600 ring-zinc-800',
                    )}
                  >
                    {item.status === 'locked' ? <Lock className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-xs font-medium',
                          item.status === 'locked' ? 'text-zinc-500' : 'text-zinc-100',
                        )}
                      >
                        {item.milestone.name}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-500">{usdCompact(item.milestone.target)}</span>
                    </div>
                    <ProgressBar
                      value={item.progress}
                      tone={item.status === 'locked' ? 'zinc' : 'amber'}
                      size="xs"
                      className="mt-1.5"
                      label={`${item.milestone.name} progress`}
                    />
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {item.status === 'acquired'
                        ? 'Acquired'
                        : item.status === 'active'
                          ? `${pct(item.progress, 1)} funded · plan ${eta ? monthYear(eta.date) : '—'}`
                          : `Locked · plan ${eta ? monthYear(eta.date) : '—'}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[11px] text-zinc-500">{MILESTONES.length} trophies · unlocked strictly in order.</p>
        </Card>
      </div>
    </div>
  );
}

function DisciplineCard() {
  const d = useDashboard();
  const ts = d.terminalStatus;
  const locked = ts.status === 'locked';

  return (
    <Card
      title="Today's Discipline"
      subtitle="The only day you can actually trade"
      icon={locked ? Lock : ShieldCheck}
      iconTone={locked ? 'rose' : 'emerald'}
      className={cn(locked && 'border-rose-500/30')}
    >
      <div
        className={cn(
          'terminal-grid rounded-xl p-4 ring-1',
          locked
            ? 'bg-rose-500/[0.06] ring-rose-500/25'
            : ts.status === 'active'
              ? 'bg-emerald-500/[0.06] ring-emerald-500/25'
              : 'bg-zinc-950/60 ring-zinc-800',
        )}
      >
        <Eyebrow>Session status</Eyebrow>
        <p
          className={cn(
            'mt-1 font-mono text-xl font-semibold tracking-tight',
            locked ? 'text-rose-300' : ts.status === 'active' ? 'text-emerald-300' : 'text-zinc-100',
          )}
        >
          {locked ? 'LOCKED OUT' : ts.status === 'active' ? 'SESSION ACTIVE' : 'STANDBY'}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {locked
            ? `${ts.lockReason}. Platform closed until tomorrow.`
            : ts.status === 'active'
              ? 'Gate cleared. One trade armed.'
              : 'Clear the 5-question gate to unlock.'}
        </p>
      </div>

      <dl className="mt-4 space-y-3 text-xs">
        <div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Gatekeeper</dt>
            <dd className="font-mono text-zinc-200">{ts.gatePassed}/5</dd>
          </div>
          <ProgressBar value={ts.gatePassed / 5} size="xs" className="mt-1.5" label="Gatekeeper progress" />
        </div>
        <div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Trades</dt>
            <dd className="font-mono text-zinc-200">
              {ts.tradesUsed}/{RULES.maxTrades}
            </dd>
          </div>
          <ProgressBar value={ts.tradesUsed / RULES.maxTrades} size="xs" tone="cyan" className="mt-1.5" label="Trades used" />
        </div>
        <div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Loss budget left</dt>
            <dd className="font-mono text-zinc-200">
              {usd(ts.lossBudgetLeft)} <span className="text-zinc-500">· P&L {signedUsd(ts.pnl)}</span>
            </dd>
          </div>
          <ProgressBar
            value={ts.lossBudgetLeft / RULES.dailyLock}
            size="xs"
            tone={ts.lossBudgetLeft <= RULES.maxRiskPerTrade ? 'rose' : 'emerald'}
            className="mt-1.5"
            label="Loss budget left"
          />
        </div>
      </dl>

      <blockquote className="mt-4 flex gap-2 rounded-xl bg-amber-500/[0.06] p-3 text-xs text-amber-100/90 ring-1 ring-amber-500/20">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-amber-400" aria-hidden />
        <span>{d.anchor.message}</span>
      </blockquote>

      <Button variant="primary" size="md" icon={SquareTerminal} className="mt-4 w-full" onClick={() => d.setTab('terminal')}>
        Open Execution Terminal
      </Button>
    </Card>
  );
}

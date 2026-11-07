import { ArrowUpRight, Check, CheckCircle2, Lock, Route } from 'lucide-react';
import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { MILESTONES, PHASE1_STAIRCASE, PHASES, phaseById, type Phase } from '../data/roadmap';
import { monthYear, pct, usd, usdAxis, usdCompact } from '../lib/format';
import { CHART, PAYOUT } from '../lib/palette';
import { dateForMonth, planPayout } from '../lib/projection';
import { planEta, useDashboard } from '../state/DashboardContext';
import { PageIntro } from '../components/PageIntro';
import { SplitBar } from '../components/SplitBar';
import { Card, Eyebrow } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusPill } from '../components/ui/StatusPill';

type PhaseStatus = 'done' | 'active' | 'upcoming';

const statusOf = (p: Phase, month: number): PhaseStatus =>
  month > p.endMonth ? 'done' : month >= p.startMonth ? 'active' : 'upcoming';

export function Roadmap() {
  const d = useDashboard();
  const phase = phaseById(d.selectedPhase);

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="5 phases · 180 months" title="The 15-Year Phase Roadmap">
        From a single Lucid 25k eval to a low-leverage private fund. Pick a phase to see its payouts, moves and milestone
        triggers.
      </PageIntro>

      <PhaseStepper />

      <PhaseDetail phase={phase} />
    </div>
  );
}

function PhaseStepper() {
  const d = useDashboard();
  return (
    <div className="glass rounded-2xl p-3 sm:p-4">
      <ol className="scrollbar-none -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-5 md:overflow-visible">
        {PHASES.map((p, i) => {
          const status = statusOf(p, d.currentMonth);
          const selected = p.id === d.selectedPhase;
          const span = p.endMonth - p.startMonth + 1;
          const fill = status === 'done' ? 1 : status === 'active' ? (d.currentMonth - p.startMonth + 1) / span : 0;
          return (
            <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto">
              <button
                type="button"
                onClick={() => d.setSelectedPhase(p.id)}
                aria-pressed={selected}
                className={cn(
                  'relative flex h-full w-full flex-col rounded-xl p-3 text-left ring-1 transition-all',
                  selected
                    ? 'bg-zinc-800/60 ring-emerald-500/40 shadow-[0_0_24px_-8px_rgb(16_185_129/0.5)]'
                    : 'bg-zinc-950/40 ring-zinc-800 hover:bg-zinc-900/70',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ring-1',
                      status === 'done'
                        ? 'bg-emerald-500 text-zinc-950 ring-emerald-400'
                        : status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/50'
                          : 'bg-zinc-900 text-zinc-500 ring-zinc-700',
                    )}
                  >
                    {status === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : p.id}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">{p.window}</p>
                    <p className="truncate text-xs text-zinc-400">{p.ages}</p>
                  </div>
                  {i < PHASES.length - 1 && <span className="ml-auto hidden h-px flex-1 bg-zinc-800 lg:block" aria-hidden />}
                </div>
                <p className="mt-2.5 text-sm leading-snug font-medium text-zinc-100">{p.title}</p>
                <p className="mt-auto pt-2 text-xs text-zinc-400">{p.payoutLabel}</p>
                <ProgressBar value={fill} size="xs" className="mt-2" label={`Phase ${p.id} time elapsed`} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PhaseDetail({ phase }: { phase: Phase }) {
  const d = useDashboard();
  const status = statusOf(phase, d.currentMonth);
  const done = phase.objectives.filter((o) => d.roadmapDone.includes(o.id)).length;
  const span = phase.endMonth - phase.startMonth + 1;
  const milestones = MILESTONES.filter((m) => phase.milestoneIds.includes(m.id));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2" bodyClassName="p-0 sm:p-0">
        <div className="terminal-grid relative overflow-hidden rounded-t-2xl border-b border-zinc-800/80 p-5 sm:p-6">
          <div
            className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-emerald-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.16em] text-emerald-400 uppercase">Phase {phase.id}</span>
            <span className="text-zinc-700">/</span>
            <span className="text-xs text-zinc-400">
              {phase.window} · {phase.ages}
            </span>
            <span className="ml-auto">
              {status === 'active' ? (
                <StatusPill tone="emerald" pulse>
                  Active · month {d.currentMonth - phase.startMonth + 1} of {span}
                </StatusPill>
              ) : status === 'done' ? (
                <StatusPill tone="emerald" icon={CheckCircle2}>
                  Complete
                </StatusPill>
              ) : (
                <StatusPill tone="zinc" icon={Lock}>
                  Starts {monthYear(dateForMonth(phase.startMonth))}
                </StatusPill>
              )}
            </span>
          </div>
          <h2 className="relative mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{phase.title}</h2>
          <p className="relative mt-1.5 max-w-2xl text-sm text-zinc-400">{phase.summary}</p>

          <dl className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {phase.highlights.map((h) => (
              <div key={h.label} className="rounded-xl bg-zinc-950/70 px-3 py-2.5 ring-1 ring-zinc-800">
                <dt className="text-[11px] text-zinc-500">{h.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-zinc-100">{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>{phase.id === 1 ? 'Staircase payouts · net / month' : 'Planned net payout ramp'}</Eyebrow>
            <span className="text-[11px] text-zinc-500">{phase.capitalBase}</span>
          </div>
          <div className="mt-3">{phase.id === 1 ? <StaircaseChart /> : <PayoutRamp phase={phase} />}</div>
          {phase.note && <p className="mt-2 text-[11px] text-zinc-500">{phase.note}</p>}

          {phase.split && (
            <div className="mt-6">
              <Eyebrow>Capital split</Eyebrow>
              <div className="mt-2">
                <SplitBar split={phase.split} />
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card
          title={phase.id === 1 ? 'Staircase steps' : 'Phase objectives'}
          subtitle={`${done} of ${phase.objectives.length} complete`}
          icon={Route}
          iconTone="emerald"
        >
          <ProgressBar value={done / phase.objectives.length} size="xs" label="Objectives complete" />
          <ol className="mt-4 space-y-1">
            {phase.objectives.map((o, i) => {
              const checked = d.roadmapDone.includes(o.id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => d.toggleObjective(o.id)}
                    className="group flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-zinc-800/50"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors',
                        checked
                          ? 'bg-emerald-500 text-zinc-950 ring-emerald-400'
                          : 'bg-zinc-950 text-transparent ring-zinc-700 group-hover:ring-zinc-500',
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block text-sm',
                          checked ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-100',
                        )}
                      >
                        {phase.id === 1 && <span className="mr-1.5 font-mono text-[11px] text-zinc-500">0{i + 1}</span>}
                        {o.label}
                      </span>
                      {o.detail && <span className="block text-xs text-zinc-500">{o.detail}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card
          title="Milestone triggers"
          subtitle={milestones.length ? 'Funded by the vault, in order' : 'No hard-asset trigger this phase'}
          icon={Lock}
          iconTone="amber"
        >
          {milestones.length === 0 ? (
            <p className="text-xs text-zinc-400">
              {phase.id === 1
                ? "Phase 1 is pure fleet-building. 40% of every payout still lands in the vault for Dad's Mercedes."
                : 'Phase 5 is about protecting the machine: compounding the book and stacking paid-off rentals.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {milestones.map((m) => {
                const item = d.vault.items.find((i) => i.milestone.id === m.id)!;
                const eta = planEta(d.planProjection, m.id);
                const Icon = m.icon;
                return (
                  <li key={m.id} className="rounded-xl bg-zinc-950/60 p-3 ring-1 ring-zinc-800">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-[11px] text-zinc-500">{m.spec}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-zinc-500">Target</p>
                        <p className="font-medium text-zinc-200">
                          {m.range ? `${usdCompact(m.range[0])}–${usdCompact(m.range[1])}` : usd(m.target)}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Roadmap · model</p>
                        <p className="font-medium text-zinc-200">
                          {m.window} · {eta ? `M${eta.month}` : '—'}
                        </p>
                      </div>
                    </div>
                    <ProgressBar
                      value={item.progress}
                      tone={item.status === 'locked' ? 'zinc' : 'amber'}
                      size="xs"
                      className="mt-3"
                      label={`${m.name} funding`}
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">
                        {item.status === 'acquired'
                          ? 'Acquired'
                          : item.status === 'active'
                            ? `${pct(item.progress, 1)} funded`
                            : 'Locked'}
                      </span>
                      {m.rentalYield && <span className="text-emerald-300">+{usd(m.rentalYield)}/mo yield</span>}
                    </div>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={() => d.setTab('vault')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200"
                >
                  Open Trophy Room <ArrowUpRight className="size-3" />
                </button>
              </li>
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StaircaseChart() {
  const d = useDashboard();
  const data = PHASE1_STAIRCASE.map((payout, i) => ({ month: i + 1, payout }));
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={(m) => `M${m}`}
            stroke={CHART.axis}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={usdAxis}
            width={48}
            stroke={CHART.axis}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
          />
          <Tooltip
            cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
            content={(props) => (
              <MiniTooltip
                active={props.active}
                month={Number(props.label)}
                value={Number(props.payload?.[0]?.value ?? 0)}
                current={d.currentMonth}
              />
            )}
          />
          <Bar dataKey="payout" fill={PAYOUT} maxBarSize={24} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="payout"
              position="top"
              formatter={(v) => (Number(v) > 0 ? usdCompact(Number(v)) : '')}
              fill="#d4d4d8"
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PayoutRamp({ phase }: { phase: Phase }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const data = Array.from({ length: phase.endMonth - phase.startMonth + 1 }, (_, i) => {
    const month = phase.startMonth + i;
    return { month, payout: planPayout(month) };
  });
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PAYOUT} stopOpacity={0.22} />
              <stop offset="100%" stopColor={PAYOUT} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={(m) => `M${m}`}
            stroke={CHART.axis}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tickFormatter={usdAxis}
            width={48}
            stroke={CHART.axis}
            tick={{ fill: CHART.tick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            domain={[0, 'auto']}
          />
          <Tooltip
            cursor={{ stroke: CHART.reference, strokeOpacity: 0.6 }}
            content={(props) => (
              <MiniTooltip active={props.active} month={Number(props.label)} value={Number(props.payload?.[0]?.value ?? 0)} />
            )}
          />
          <Area
            type="monotone"
            dataKey="payout"
            stroke={PAYOUT}
            strokeWidth={2}
            fill={`url(#${id})`}
            activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniTooltip({ active, month, value, current }: { active?: boolean; month: number; value: number; current?: number }) {
  if (!active || !month) return null;
  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-zinc-50">{usd(value)}/mo</p>
      <p className="text-zinc-400">
        Month {month} · {monthYear(dateForMonth(month))}
        {current === month && <span className="text-emerald-300"> · now</span>}
      </p>
    </div>
  );
}

import {
  AreaChart as AreaIcon,
  ChartColumn,
  Coins,
  Landmark,
  PiggyBank,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { BUCKETS, LIFESTYLE_PCT, PHASES, VAULT_PCT_RANGE, type Bucket } from '../data/roadmap';
import { addMonths, monthYear, pct, usd, usdCompact } from '../lib/format';
import { SERIES } from '../lib/palette';
import { splitPayout, type SimMode } from '../lib/projection';
import { useDashboard } from '../state/DashboardContext';
import {
  AcquisitionChips,
  ProjectionChart,
  ProjectionLegend,
  ProjectionTable,
  type ChartView,
} from '../components/ProjectionChart';
import { PageIntro } from '../components/PageIntro';
import { SplitBar } from '../components/SplitBar';
import { Card, Eyebrow, IconTile } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { Segmented } from '../components/ui/Segmented';
import { Slider } from '../components/ui/Slider';

const PRESETS = PHASES.map((p) => ({
  label: `P${p.id}`,
  value: p.id === 1 ? 6_750 : Math.round((p.payout.from + p.payout.to) / 2),
}));

const BUCKET_ICON: Record<Bucket, typeof Wallet> = { lifestyle: Wallet, vault: Landmark, treasury: PiggyBank };

export function TreasurySimulator() {
  const d = useDashboard();
  const { sim, updateSim, projection, planProjection, vault } = d;
  const [view, setView] = useState<ChartView>('area');

  const split = splitPayout(sim.monthlyPayout, sim.vaultPct);
  const shares: Record<Bucket, number> = {
    lifestyle: LIFESTYLE_PCT,
    vault: sim.vaultPct,
    treasury: 1 - LIFESTYLE_PCT - sim.vaultPct,
  };

  const active = vault.active;
  const monthsToActive = active && split.vault > 0 ? Math.ceil(active.remaining / split.vault) : undefined;
  const f = projection.final;
  const passive = f.rental;

  const bucketNotes: Record<Bucket, string> = {
    lifestyle: `${usdCompact(split.lifestyle * 12)}/yr · ${usdCompact(f.lifestyleCum)} spent over 15 yrs`,
    vault: active
      ? monthsToActive != null
        ? `${active.milestone.shortName} fully funded in ${monthsToActive} mo · ${monthYear(addMonths(d.now, monthsToActive))}`
        : `${active.milestone.shortName} needs a payout to start funding`
      : 'Every trophy acquired',
    treasury: `${usdCompact(f.treasury)} brokerage at Year 15 (${pct(sim.treasuryReturn)}/yr)`,
  };

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Dynamic treasury split" title="Treasury Split Calculator & Simulator">
        Slide your monthly net payout. 35% is yours to spend, 35–40% buys hard assets, the rest compounds into the capital that
        ends prop-firm reliance.
      </PageIntro>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="scrollbar-none lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
          <Card title="Inputs" subtitle="Everything recalculates instantly" icon={SlidersHorizontal} iconTone="emerald">
            <div className="space-y-6">
              <div>
                <Slider
                  id="payout"
                  label="Monthly net payout"
                  value={sim.monthlyPayout}
                  min={0}
                  max={80_000}
                  step={250}
                  onChange={(v) => updateSim({ monthlyPayout: v })}
                  display={usd(sim.monthlyPayout)}
                  size="lg"
                  minLabel="$0"
                  maxLabel="$80K"
                />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => updateSim({ monthlyPayout: p.value })}
                      className={cn(
                        'rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-colors',
                        sim.monthlyPayout === p.value
                          ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40'
                          : 'bg-zinc-950/60 text-zinc-400 ring-zinc-800 hover:text-zinc-100',
                      )}
                    >
                      {p.label} · {usdCompact(p.value)}
                    </button>
                  ))}
                  {d.accountCapacity > 0 && (
                    <button
                      type="button"
                      onClick={() => updateSim({ monthlyPayout: Math.min(80_000, d.accountCapacity) })}
                      className="rounded-md bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-300 ring-1 ring-cyan-500/30 hover:bg-cyan-500/20"
                    >
                      My fleet · {usdCompact(d.accountCapacity)}
                    </button>
                  )}
                </div>
              </div>

              <Slider
                id="vault-share"
                label="Vault ⟷ Treasury balance"
                value={Math.round(sim.vaultPct * 100)}
                min={VAULT_PCT_RANGE[0] * 100}
                max={VAULT_PCT_RANGE[1] * 100}
                step={1}
                onChange={(v) => updateSim({ vaultPct: v / 100 })}
                display={`${pct(sim.vaultPct)} / ${pct(shares.treasury)}`}
                accent={SERIES.vault}
                minLabel="35% vault · 30% treasury"
                maxLabel="40% · 25%"
                hint="Lifestyle stays locked at 35%."
              />

              <div className="rounded-xl bg-zinc-950/50 p-3 ring-1 ring-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <Eyebrow>Chart model</Eyebrow>
                  <Segmented<SimMode>
                    label="Projection model"
                    value={sim.mode}
                    onChange={(mode) => updateSim({ mode })}
                    options={[
                      { value: 'custom', label: 'Slider' },
                      { value: 'plan', label: 'Roadmap' },
                    ]}
                  />
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">
                  {sim.mode === 'custom'
                    ? 'Projects your slider payout forward, raised every year by the growth rate.'
                    : "Uses the roadmap's phase-by-phase payout curve. The slider still drives the split above."}
                </p>
                <div className="mt-4 space-y-5">
                  {sim.mode === 'custom' && (
                    <Slider
                      id="growth"
                      label="Annual payout growth"
                      value={Math.round(sim.payoutGrowth * 100)}
                      min={0}
                      max={30}
                      step={1}
                      onChange={(v) => updateSim({ payoutGrowth: v / 100 })}
                      display={`${pct(sim.payoutGrowth)}/yr`}
                      accent="#10b981"
                    />
                  )}
                  <Slider
                    id="return"
                    label="Treasury return"
                    value={Math.round(sim.treasuryReturn * 100)}
                    min={0}
                    max={36}
                    step={1}
                    onChange={(v) => updateSim({ treasuryReturn: v / 100 })}
                    display={`${pct(sim.treasuryReturn)}/yr`}
                    accent={SERIES.treasury}
                    hint="Phase 5 targets 2–3%/mo on the book; keep the model conservative."
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card title="This month's split" subtitle={`${usd(sim.monthlyPayout)} net payout`} icon={Coins} iconTone="amber">
            <SplitBar split={shares} amounts={split} />
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['lifestyle', 'vault', 'treasury'] as Bucket[]).map((b) => (
                <div key={b} className="relative overflow-hidden rounded-xl bg-zinc-950/60 p-4 ring-1 ring-zinc-800">
                  <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: SERIES[b] }} aria-hidden />
                  <div className="flex items-center justify-between">
                    <IconTile
                      icon={BUCKET_ICON[b]}
                      tone={b === 'lifestyle' ? 'violet' : b === 'vault' ? 'amber' : 'cyan'}
                      size="sm"
                    />
                    <span className="font-mono text-xs text-zinc-400">{pct(shares[b])}</span>
                  </div>
                  <p className="mt-3 text-[11px] text-zinc-500">{BUCKETS[b].label}</p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight">{usd(split[b])}</p>
                  <p className="text-[11px] text-zinc-500">per month</p>
                  <p className="mt-3 text-xs text-zinc-300">{BUCKETS[b].blurb}</p>
                  <p className="mt-1.5 text-[11px] text-zinc-500">{bucketNotes[b]}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Net worth · Y15', value: usdCompact(f.netWorth), sub: `Age ${f.age}` },
              { label: 'Private brokerage', value: usdCompact(f.treasury), sub: 'Liquid, compounding' },
              {
                label: 'Hard asset equity',
                value: usdCompact(f.hardAssets),
                sub: `${projection.acquisitions.length} assets bought`,
              },
              {
                label: 'Passive rent · Y15',
                value: `${usdCompact(passive)}/mo`,
                sub: `${projection.acquisitions.filter((a) => a.key === 'dubai' || a.key.startsWith('expansion')).length} Dubai units`,
              },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3.5">
                <Eyebrow>{s.label}</Eyebrow>
                <p className="mt-1.5 text-xl font-semibold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-zinc-500">{s.sub}</p>
              </div>
            ))}
          </div>

          <Card
            title="15-Year Capital Projection"
            subtitle={
              sim.mode === 'custom'
                ? `Slider scenario: ${usd(sim.monthlyPayout)}/mo growing ${pct(sim.payoutGrowth)}/yr`
                : 'Roadmap payout curve, Phase 1 → Phase 5'
            }
            icon={Sparkles}
            iconTone="cyan"
            action={
              <Segmented<ChartView>
                label="Chart view"
                value={view}
                onChange={setView}
                options={[
                  { value: 'area', label: 'Area', icon: AreaIcon },
                  { value: 'bar', label: 'Bars', icon: ChartColumn },
                  { value: 'table', label: 'Table', icon: Table2 },
                ]}
              />
            }
          >
            <ProjectionLegend
              projection={projection}
              compareLabel={sim.mode === 'custom' && view === 'area' ? 'Roadmap plan · net worth' : undefined}
            />
            <div className="mt-4">
              {view === 'table' ? (
                <ProjectionTable projection={projection} />
              ) : (
                <ProjectionChart
                  projection={projection}
                  compareTo={sim.mode === 'custom' ? planProjection : undefined}
                  view={view}
                  height={340}
                />
              )}
            </div>
            <div className="mt-4 space-y-2">
              <AcquisitionChips projection={projection} />
              <p className="text-[11px] text-zinc-500">
                Hard asset equity = owned assets at market value + vault cash not yet deployed.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

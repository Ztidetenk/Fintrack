import { CalendarClock, CheckCircle2, History, KeyRound, Landmark, Lock, Plus, Trash2, Trophy, Undo2, Vault } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { HARD_ASSET_TARGET, MILESTONES } from '../data/roadmap';
import { addMonths, monthYear, parseISODate, pct, shortDate, usd, usdCompact } from '../lib/format';
import { dateForMonth } from '../lib/projection';
import type { MilestoneProgress } from '../lib/vault';
import { planEta, useDashboard } from '../state/DashboardContext';
import { PageIntro } from '../components/PageIntro';
import { Button } from '../components/ui/Button';
import { Card, Eyebrow } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusPill } from '../components/ui/StatusPill';

export function TrophyRoom() {
  const d = useDashboard();
  const { vault } = d;

  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Milestone vault" title="Trophy Room">
        Every vault dollar funds the next trophy in line. Fill it, take the keys, and the overflow rolls straight into the next
        one.
      </PageIntro>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Vault balance',
            value: usd(vault.available),
            sub: vault.overflow > 0 ? `${usd(vault.overflow)} rolling over` : 'Ready to deploy',
          },
          { label: 'Total deposited', value: usd(vault.totalDeposited), sub: `${d.deposits.length} deposits logged` },
          {
            label: 'Hard assets acquired',
            value: usdCompact(vault.hardAssetsAcquired),
            sub: `${pct(vault.hardAssetsAcquired / HARD_ASSET_TARGET, 1)} of ${usdCompact(HARD_ASSET_TARGET)}+`,
          },
          {
            label: 'Vault allocation',
            value: `${usd(d.monthlyVaultAllocation)}/mo`,
            sub: `${pct(d.sim.vaultPct)} of ${usdCompact(d.sim.monthlyPayout)} payout`,
          },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <Eyebrow>{s.label}</Eyebrow>
            <p className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">{s.value}</p>
            <p className="text-[11px] text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {vault.items.map((item, i) => (
          <TrophyCard key={item.milestone.id} item={item} index={i} />
        ))}
      </div>

      <DepositLog />
    </div>
  );
}

function TrophyCard({ item, index }: { item: MilestoneProgress; index: number }) {
  const d = useDashboard();
  const { milestone: m, status } = item;
  const Icon = m.icon;
  const plan = planEta(d.planProjection, m.id);
  const paceMonths =
    status === 'active' && d.monthlyVaultAllocation > 0 ? Math.ceil(item.remaining / d.monthlyVaultAllocation) : undefined;
  const isLastAcquired = status === 'acquired' && d.acquired[d.acquired.length - 1]?.id === m.id;
  const ready = status === 'active' && item.remaining <= 0;

  return (
    <article
      className={cn(
        'glass group relative flex flex-col overflow-hidden rounded-2xl transition-all',
        status === 'active' && 'border-amber-500/30 shadow-[0_0_40px_-16px_rgb(245_158_11/0.45)]',
        status === 'acquired' && 'border-amber-500/20',
      )}
    >
      {/* Visual */}
      <div
        className={cn(
          'terminal-grid relative flex h-36 items-center justify-center overflow-hidden border-b border-zinc-800/80',
          status === 'locked' ? 'bg-zinc-950/60' : 'bg-gradient-to-br from-amber-500/[0.12] via-zinc-950/40 to-zinc-950/80',
        )}
      >
        <span className="absolute top-3 left-3 font-mono text-[10px] tracking-widest text-zinc-500">0{index + 1}</span>
        <span className="absolute top-3 right-3">
          {status === 'acquired' ? (
            <StatusPill tone="amber" icon={KeyRound}>
              Acquired
            </StatusPill>
          ) : status === 'active' ? (
            <StatusPill tone="amber" pulse>
              {ready ? 'Fully funded' : 'In progress'}
            </StatusPill>
          ) : (
            <StatusPill tone="zinc" icon={Lock}>
              Locked
            </StatusPill>
          )}
        </span>
        <div
          className={cn(
            'pointer-events-none absolute size-40 rounded-full blur-3xl transition-opacity',
            status === 'locked' ? 'opacity-0' : 'bg-amber-500/20 opacity-100',
          )}
          aria-hidden
        />
        <Icon
          className={cn(
            'relative size-16 transition-transform duration-500 group-hover:scale-105',
            status === 'locked' ? 'text-zinc-700' : 'text-amber-300 drop-shadow-[0_0_18px_rgb(245_158_11/0.5)]',
          )}
          strokeWidth={1.1}
          aria-hidden
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className={cn('text-sm font-semibold', status === 'locked' ? 'text-zinc-400' : 'text-zinc-50')}>{m.name}</h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">{m.spec}</p>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-xl font-semibold tracking-tight">{usd(m.target)}</span>
          <span className="text-[11px] text-zinc-500">
            {m.range ? `${usdCompact(m.range[0])}–${usdCompact(m.range[1])}` : 'Cash down'}
          </span>
        </div>

        <ProgressBar
          value={item.progress}
          tone={status === 'locked' ? 'zinc' : 'amber'}
          size="md"
          className="mt-3"
          label={`${m.name} funding`}
        />
        <div className="mt-1.5 flex justify-between text-[11px]">
          <span className="text-zinc-400">
            {usd(item.funded)} <span className="text-zinc-600">funded</span>
          </span>
          <span className="font-mono text-zinc-300">{pct(item.progress, 1)}</span>
        </div>

        <dl className="mt-4 space-y-1.5 text-[11px]">
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Roadmap window</dt>
            <dd className="text-right text-zinc-300">
              Phase {m.phase} · {m.window}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Plan model ETA</dt>
            <dd className="text-right text-zinc-300">
              {plan ? `${monthYear(addMonths(dateForMonth(plan.month), d.delayMonths))} · Age ${plan.age}` : 'Beyond Y15'}
            </dd>
          </div>
          {status === 'active' && (
            <div className="flex justify-between gap-2">
              <dt className="flex items-center gap-1 text-zinc-500">
                <CalendarClock className="size-3" aria-hidden /> At current pace
              </dt>
              <dd className="text-right font-medium text-amber-200">
                {ready
                  ? 'Now'
                  : paceMonths != null
                    ? `${monthYear(addMonths(d.now, paceMonths))} · ${paceMonths} mo`
                    : 'Set a payout'}
              </dd>
            </div>
          )}
          {status === 'acquired' && item.acquiredOn && (
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Keys handed over</dt>
              <dd className="text-right text-zinc-300">{shortDate(parseISODate(item.acquiredOn))}</dd>
            </div>
          )}
          {m.rentalYield && (
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Rental yield</dt>
              <dd className="text-right text-emerald-300">+{usd(m.rentalYield)}/mo</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto pt-4">
          {status === 'active' && (
            <Button
              variant="amber"
              size="md"
              icon={ready ? KeyRound : Lock}
              className="w-full"
              disabled={!ready}
              onClick={d.acquireActive}
            >
              {ready ? 'Mark acquired' : `${usd(item.remaining)} to go`}
            </Button>
          )}
          {isLastAcquired && (
            <Button variant="ghost" size="sm" icon={Undo2} className="w-full" onClick={d.undoLastAcquisition}>
              Undo acquisition
            </Button>
          )}
          {status === 'acquired' && !isLastAcquired && (
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-amber-300/80">
              <CheckCircle2 className="size-3.5" aria-hidden /> In the trophy room
            </p>
          )}
          {status === 'locked' && (
            <p className="text-center text-[11px] text-zinc-600">Unlocks after {MILESTONES[index - 1]?.shortName}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function DepositLog() {
  const d = useDashboard();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const monthly = Math.round(d.monthlyVaultAllocation);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(/[$,\s]/g, ''));
    if (!Number.isFinite(value) || value <= 0) return;
    d.addDeposit(value, note.trim() || 'Manual deposit');
    setAmount('');
    setNote('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card title="Log a deposit" subtitle="Simulate payouts hitting the vault" icon={Vault} iconTone="amber">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="deposit-amount" className="text-xs text-zinc-400">
              Amount
            </label>
            <div className="mt-1 flex items-center rounded-lg bg-zinc-950/80 ring-1 ring-zinc-800 focus-within:ring-amber-500/50">
              <span className="pl-3 text-sm text-zinc-500">$</span>
              <input
                id="deposit-amount"
                inputMode="decimal"
                placeholder="2,700"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 w-full bg-transparent px-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>
          <div>
            <label htmlFor="deposit-note" className="text-xs text-zinc-400">
              Note
            </label>
            <input
              id="deposit-note"
              placeholder="Lucid payout #3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg bg-zinc-950/80 px-3 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none placeholder:text-zinc-600 focus:ring-amber-500/50"
            />
          </div>
          <Button type="submit" variant="amber" size="md" icon={Plus} className="w-full">
            Add to vault
          </Button>
        </form>

        <div className="mt-5 border-t border-zinc-800/80 pt-4">
          <Eyebrow>Quick simulate</Eyebrow>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => d.addDeposit(500, 'Quick deposit')}>
              +$500
            </Button>
            <Button size="sm" onClick={() => d.addDeposit(1_000, 'Quick deposit')}>
              +$1,000
            </Button>
            <Button
              size="sm"
              className="col-span-2"
              disabled={monthly <= 0}
              onClick={() => d.addDeposit(monthly, `1 month @ ${pct(d.sim.vaultPct)} of ${usdCompact(d.sim.monthlyPayout)}`)}
            >
              +1 month allocation · {usd(monthly)}
            </Button>
            <Button
              size="sm"
              className="col-span-2"
              disabled={monthly <= 0}
              onClick={() => d.addDeposit(monthly * 6, `6 months @ ${pct(d.sim.vaultPct)} of ${usdCompact(d.sim.monthlyPayout)}`)}
            >
              +6 months · {usd(monthly * 6)}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">Allocation follows the Treasury Split slider.</p>
        </div>
      </Card>

      <Card
        className="lg:col-span-2"
        title="Deposit history"
        subtitle={`${usd(d.vault.totalDeposited)} deposited in total`}
        icon={History}
        iconTone="zinc"
      >
        {d.deposits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-12 text-center">
            <Trophy className="size-8 text-zinc-700" aria-hidden />
            <p className="mt-3 text-sm text-zinc-300">The vault is empty</p>
            <p className="mt-1 text-xs text-zinc-500">Your first payout split lands here.</p>
          </div>
        ) : (
          <ul className="max-h-[420px] divide-y divide-zinc-800/80 overflow-y-auto rounded-xl ring-1 ring-zinc-800">
            {d.deposits.map((dep) => (
              <li key={dep.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/30">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20">
                  <Landmark className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-100">{dep.note}</p>
                  <p className="text-[11px] text-zinc-500">{shortDate(parseISODate(dep.date))}</p>
                </div>
                <span className="font-mono text-sm text-amber-200 tabular-nums">+{usd(dep.amount)}</span>
                <button
                  type="button"
                  onClick={() => d.removeDeposit(dep.id)}
                  className="flex size-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-rose-300"
                  aria-label={`Delete deposit ${dep.note}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

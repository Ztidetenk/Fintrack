import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  ImagePlus,
  Lock,
  NotebookPen,
  OctagonX,
  Pencil,
  Power,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { GATE_QUESTIONS, MILESTONES, RULE_BREAK_REASONS, RULES, milestoneById, type MilestoneId } from '../data/roadmap';
import { addMonths, monthYear, parseISODate, shortDate, signedUsd, usd } from '../lib/format';
import { dateForMonth } from '../lib/projection';
import { useTwoStepConfirm } from '../lib/useTwoStepConfirm';
import { planEta, useDashboard, type GateAnswer } from '../state/DashboardContext';
import { PageIntro } from '../components/PageIntro';
import { Button } from '../components/ui/Button';
import { Card, Eyebrow } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusPill } from '../components/ui/StatusPill';

export function ExecutionTerminal() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={`Today · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
        title="Daily Execution Terminal"
      >
        Forget the 15 years. Only today counts: clear the gate, take at most two trades, and walk away.
      </PageIntro>

      <StatusBanner />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Gatekeeper />
        <VisualAnchor />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TradeLog />
        <RuleLedger />
      </div>
    </div>
  );
}

function StatusBanner() {
  const { terminalStatus: ts } = useDashboard();
  const locked = ts.status === 'locked';
  const active = ts.status === 'active';

  return (
    <div
      className={cn(
        'terminal-grid relative overflow-hidden rounded-2xl border p-4 sm:p-5',
        locked
          ? 'border-rose-500/40 bg-rose-950/30'
          : active
            ? 'border-emerald-500/40 bg-emerald-950/20'
            : 'border-zinc-800/80 bg-zinc-900/60',
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-none absolute -top-20 left-1/3 h-40 w-2/3 rounded-full blur-3xl',
          locked ? 'bg-rose-500/15' : active ? 'bg-emerald-500/15' : 'bg-transparent',
        )}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl ring-1',
              locked
                ? 'bg-rose-500/15 text-rose-300 ring-rose-500/40'
                : active
                  ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40'
                  : 'bg-zinc-800/80 text-zinc-300 ring-zinc-700',
            )}
          >
            {locked ? <OctagonX className="size-6" /> : active ? <Zap className="size-6" /> : <Shield className="size-6" />}
          </span>
          <div>
            <Eyebrow>Session status</Eyebrow>
            <p
              className={cn(
                'font-mono text-2xl font-semibold tracking-tight',
                locked ? 'text-rose-200' : active ? 'text-emerald-300' : 'text-zinc-50',
              )}
            >
              {locked ? 'HARD LOCKOUT' : active ? 'SESSION ACTIVE' : 'STANDBY'}
            </p>
            <p className="text-xs text-zinc-400">
              {locked
                ? `${ts.lockReason}. Close the platform — the day is done.`
                : active
                  ? 'Gate cleared. One trade is armed. Log it the moment it closes.'
                  : `Gatekeeper ${ts.gatePassed}/5. The session stays closed until every answer is right.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-950/70 px-3 py-2 ring-1 ring-rose-500/30">
            <ShieldAlert className="size-4 text-rose-400" aria-hidden />
            <div className="leading-tight">
              <p className="text-[10px] font-medium tracking-wider text-rose-300/80 uppercase">Circuit breaker</p>
              <p className="text-xs font-medium text-zinc-100">
                Max Risk {usd(RULES.dailyLock)} Daily Stop | Hard Platform Lockout
              </p>
            </div>
          </div>
          <dl className="flex gap-2">
            {[
              { k: 'Trades', v: `${ts.tradesUsed}/${RULES.maxTrades}` },
              { k: 'P&L', v: signedUsd(ts.pnl) },
              { k: 'Loss left', v: usd(ts.lossBudgetLeft) },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-zinc-950/70 px-3 py-2 ring-1 ring-zinc-800">
                <dt className="text-[10px] text-zinc-500">{s.k}</dt>
                <dd className="font-mono text-sm font-medium text-zinc-100 tabular-nums">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Gatekeeper() {
  const d = useDashboard();
  const ts = d.terminalStatus;
  const locked = ts.status === 'locked';
  const active = ts.status === 'active';

  return (
    <Card
      className="lg:col-span-2"
      title="Pre-Trade Gatekeeper"
      subtitle={`Trade #${Math.min(ts.tradesUsed + 1, RULES.maxTrades)} of ${RULES.maxTrades} · re-arms after every trade`}
      icon={ShieldCheck}
      iconTone="emerald"
      action={<span className="font-mono text-xs text-zinc-400">{ts.gatePassed}/5</span>}
    >
      <ProgressBar value={ts.gatePassed / 5} size="sm" label="Gatekeeper progress" />

      <ol className={cn('mt-4 space-y-2', locked && 'pointer-events-none opacity-40')} aria-disabled={locked}>
        {GATE_QUESTIONS.map((q, i) => {
          const answer = d.terminal.answers[q.id];
          const passed = q.id === 'mindset' ? answer === 'patience' : answer === true;
          return (
            <li
              key={q.id}
              className={cn(
                'rounded-xl p-3 ring-1 transition-colors sm:p-4',
                q.id === 'mindset' && answer === 'impulse'
                  ? 'bg-rose-500/[0.07] ring-rose-500/30'
                  : passed
                    ? 'bg-emerald-500/[0.06] ring-emerald-500/25'
                    : 'bg-zinc-950/50 ring-zinc-800',
              )}
            >
              {q.id === 'mindset' ? (
                <MindsetQuestion
                  index={i}
                  question={q.question}
                  hint={q.hint}
                  answer={answer}
                  onAnswer={(v) => d.setAnswer(q.id, v)}
                />
              ) : (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={passed}
                  disabled={locked}
                  onClick={() => d.setAnswer(q.id, !passed)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <GateBox index={i} checked={passed} />
                  <span className="min-w-0">
                    <span className="block text-sm text-zinc-100">{q.question}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">{q.hint}</span>
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          {locked
            ? 'Circuit breaker tripped. Nothing to unlock until tomorrow.'
            : ts.impulseFlag
              ? 'Boredom or greed detected. Step away from the charts for 30 minutes.'
              : active
                ? 'Session live. Changing any answer re-locks it.'
                : ts.gateCleared
                  ? 'All five answered correctly.'
                  : `${5 - ts.gatePassed} answer${5 - ts.gatePassed === 1 ? '' : 's'} left.`}
        </p>
        <Button
          variant="primary"
          size="md"
          icon={active ? CheckCircle2 : locked ? Lock : Power}
          disabled={!ts.gateCleared || locked || active}
          onClick={d.unlockSession}
          className="sm:min-w-48"
        >
          {active ? 'Session active' : locked ? 'Locked out' : 'Unlock session'}
        </Button>
      </div>
    </Card>
  );
}

function GateBox({ index, checked }: { index: number; checked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs ring-1 transition-all',
        checked ? 'bg-emerald-500 text-zinc-950 ring-emerald-400' : 'bg-zinc-900 text-zinc-500 ring-zinc-700',
      )}
    >
      {checked ? <Check className="size-4" strokeWidth={3} /> : index + 1}
    </span>
  );
}

function MindsetQuestion({
  index,
  question,
  hint,
  answer,
  onAnswer,
}: {
  index: number;
  question: string;
  hint: string;
  answer?: GateAnswer;
  onAnswer: (v: GateAnswer) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <GateBox index={index} checked={answer === 'patience'} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-100">{question}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Why am I taking this trade?">
          <button
            type="button"
            role="radio"
            aria-checked={answer === 'patience'}
            onClick={() => onAnswer('patience')}
            className={cn(
              'flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium ring-1 transition-colors',
              answer === 'patience'
                ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40'
                : 'bg-zinc-900 text-zinc-400 ring-zinc-700 hover:text-zinc-100',
            )}
          >
            <Clock className="size-3.5" aria-hidden /> Patience
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={answer === 'impulse'}
            onClick={() => onAnswer('impulse')}
            className={cn(
              'flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium ring-1 transition-colors',
              answer === 'impulse'
                ? 'bg-rose-500/15 text-rose-300 ring-rose-500/40'
                : 'bg-zinc-900 text-zinc-400 ring-zinc-700 hover:text-zinc-100',
            )}
          >
            <AlertTriangle className="size-3.5" aria-hidden /> Boredom / greed
          </button>
        </div>
      </div>
    </div>
  );
}

function VisualAnchor() {
  const d = useDashboard();
  const [editing, setEditing] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const m = milestoneById(d.anchor.milestoneId);
  const Icon = m.icon;
  const plan = planEta(d.planProjection, m.id);
  const eta = plan ? addMonths(dateForMonth(plan.month), d.delayMonths) : undefined;
  const acquired = d.acquired.some((a) => a.id === m.id);
  const showImage = d.anchor.imageUrl && !imgFailed;

  return (
    <Card
      title="Visual Anchor"
      subtitle="Why the rules matter"
      icon={Target}
      iconTone="amber"
      action={
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label={editing ? 'Close anchor editor' : 'Customize anchor'}
          aria-expanded={editing}
        >
          {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
        </button>
      }
    >
      <div className="relative flex aspect-[4/3] items-end overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 ring-1 ring-amber-500/25">
        {showImage ? (
          <img
            src={d.anchor.imageUrl}
            alt={m.name}
            onError={() => setImgFailed(true)}
            className="absolute inset-0 size-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="terminal-grid absolute inset-0 flex items-center justify-center">
            <div className="absolute size-44 rounded-full bg-amber-500/20 blur-3xl" aria-hidden />
            <Icon
              className="relative size-24 text-amber-300 drop-shadow-[0_0_24px_rgb(245_158_11/0.55)]"
              strokeWidth={0.9}
              aria-hidden
            />
          </div>
        )}
        <div className="relative w-full bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent p-4 pt-10">
          <p className="text-[10px] font-medium tracking-[0.16em] text-amber-300 uppercase">
            {acquired ? 'Delivered' : 'The target'}
          </p>
          <p className="text-lg font-semibold tracking-tight">{m.name}</p>
          <p className="text-[11px] text-zinc-400">
            {acquired ? 'Keys handed over.' : eta ? `Plan ETA ${monthYear(eta)}` : 'Beyond the 15-year model'}
            {d.delayMonths > 0 && !acquired && <span className="text-rose-300"> · +{d.delayMonths} mo from rule breaks</span>}
          </p>
        </div>
      </div>

      <blockquote className="mt-4 rounded-xl border-l-2 border-amber-500 bg-amber-500/[0.06] p-3 text-sm leading-relaxed text-amber-50/90 italic">
        “{d.anchor.message}”
      </blockquote>

      {editing && (
        <div className="mt-4 space-y-3 rounded-xl bg-zinc-950/60 p-3 ring-1 ring-zinc-800">
          <div>
            <label htmlFor="anchor-milestone" className="text-xs text-zinc-400">
              Anchor milestone
            </label>
            <select
              id="anchor-milestone"
              value={d.anchor.milestoneId}
              onChange={(e) => d.setAnchor({ ...d.anchor, milestoneId: e.target.value as MilestoneId })}
              className="mt-1 h-10 w-full rounded-lg bg-zinc-900 px-2 text-sm text-zinc-100 ring-1 ring-zinc-700 outline-none focus:ring-amber-500/50"
            >
              {MILESTONES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="anchor-message" className="text-xs text-zinc-400">
              Reminder
            </label>
            <textarea
              id="anchor-message"
              rows={3}
              value={d.anchor.message}
              onChange={(e) => d.setAnchor({ ...d.anchor, message: e.target.value })}
              className="mt-1 w-full resize-none rounded-lg bg-zinc-900 p-2 text-sm text-zinc-100 ring-1 ring-zinc-700 outline-none focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label htmlFor="anchor-image" className="flex items-center gap-1.5 text-xs text-zinc-400">
              <ImagePlus className="size-3.5" aria-hidden /> Image URL (optional)
            </label>
            <input
              id="anchor-image"
              type="url"
              placeholder="https://…/mercedes-e-class.jpg"
              value={d.anchor.imageUrl}
              onChange={(e) => {
                setImgFailed(false);
                d.setAnchor({ ...d.anchor, imageUrl: e.target.value.trim() });
              }}
              className="mt-1 h-10 w-full rounded-lg bg-zinc-900 px-2 text-sm text-zinc-100 ring-1 ring-zinc-700 outline-none placeholder:text-zinc-600 focus:ring-amber-500/50"
            />
            {imgFailed && <p className="mt-1 text-[11px] text-rose-300">That image didn't load — showing the icon instead.</p>}
          </div>
        </div>
      )}
    </Card>
  );
}

function TradeLog() {
  const d = useDashboard();
  const ts = d.terminalStatus;
  const [custom, setCustom] = useState('');
  const resetDay = useTwoStepConfirm(d.resetDay);
  const canLog = ts.status === 'active';

  const submitCustom = (e: FormEvent) => {
    e.preventDefault();
    const raw = custom.replace(/[$,\s]/g, '').replace('−', '-');
    const value = Number(raw);
    if (!raw || !Number.isFinite(value)) return;
    d.logTrade(value);
    setCustom('');
  };

  return (
    <Card
      className="lg:col-span-2"
      title="Trade Log"
      subtitle="Log every closed trade. Each one re-locks the gate."
      icon={TrendingUp}
      iconTone="cyan"
      action={
        <Button size="xs" variant={resetDay.armed ? 'danger' : 'ghost'} icon={RotateCcw} onClick={resetDay.trigger}>
          {resetDay.armed ? 'Confirm reset' : 'Reset day'}
        </Button>
      }
    >
      <div className={cn('grid gap-2 sm:grid-cols-3', !canLog && 'opacity-50')}>
        <Button
          size="md"
          variant="danger"
          icon={TrendingDown}
          disabled={!canLog}
          onClick={() => d.logTrade(-RULES.maxRiskPerTrade)}
        >
          Stop hit · −{usd(RULES.maxRiskPerTrade)}
        </Button>
        <Button size="md" disabled={!canLog} onClick={() => d.logTrade(0)}>
          Breakeven · $0
        </Button>
        <Button size="md" variant="primary" icon={TrendingUp} disabled={!canLog} onClick={() => d.logTrade(200)}>
          Target · +$200
        </Button>
      </div>
      <form onSubmit={submitCustom} className="mt-2 flex gap-2">
        <label htmlFor="custom-pnl" className="sr-only">
          Custom P&L
        </label>
        <input
          id="custom-pnl"
          placeholder="Custom P&L, e.g. 145 or -60"
          value={custom}
          disabled={!canLog}
          onChange={(e) => setCustom(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-lg bg-zinc-950/80 px-3 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none placeholder:text-zinc-600 focus:ring-cyan-500/50 disabled:opacity-50"
        />
        <Button type="submit" size="md" disabled={!canLog || !custom}>
          Log
        </Button>
      </form>
      {!canLog && (
        <p className="mt-2 text-xs text-zinc-500">
          {ts.status === 'locked' ? 'Locked out for the day.' : 'Unlock the session with the gatekeeper to log a trade.'}
        </p>
      )}

      <div className="mt-5">
        <Eyebrow>Today's executions</Eyebrow>
        {d.terminal.trades.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-500">
            No trades yet. Zero trades is a valid day.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-800/80 rounded-xl ring-1 ring-zinc-800">
            {d.terminal.trades.map((t, i) => {
              const grade = t.pnl < -RULES.maxRiskPerTrade ? 'F' : t.pnl < 0 ? 'A+' : 'A';
              const gradeNote =
                t.pnl < -RULES.maxRiskPerTrade
                  ? 'Risk exceeded — rule break logged'
                  : t.pnl < 0
                    ? 'Controlled loss. Plan executed.'
                    : t.pnl === 0
                      ? 'Protected capital.'
                      : 'Clean execution.';
              return (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="font-mono text-[11px] text-zinc-500">#{i + 1}</span>
                  <span className="text-xs text-zinc-400">{t.time}</span>
                  <span
                    className={cn(
                      'font-mono text-sm font-medium tabular-nums',
                      t.pnl < 0 ? 'text-rose-300' : t.pnl > 0 ? 'text-emerald-300' : 'text-zinc-200',
                    )}
                  >
                    {signedUsd(t.pnl)}
                  </span>
                  <span className="ml-auto hidden text-[11px] text-zinc-500 sm:inline">{gradeNote}</span>
                  <StatusPill tone={grade === 'F' ? 'rose' : 'emerald'} icon={grade === 'F' ? Ban : CheckCircle2}>
                    {grade}
                  </StatusPill>
                </li>
              );
            })}
          </ul>
        )}
        {d.terminal.trades.length > 0 && (
          <Button size="xs" variant="ghost" icon={NotebookPen} className="mt-2" onClick={() => d.setTab('journal')}>
            Log today in the journal
          </Button>
        )}
      </div>
    </Card>
  );
}

function RuleLedger() {
  const d = useDashboard();
  const [reason, setReason] = useState(RULE_BREAK_REASONS[0]);
  const anchor = milestoneById(d.anchor.milestoneId);

  return (
    <Card
      title="Rule-Break Ledger"
      subtitle={`Each break costs ${RULES.ruleBreakDelayMonths} months`}
      icon={AlertTriangle}
      iconTone="rose"
    >
      <div className="rounded-xl bg-zinc-950/60 p-3 ring-1 ring-zinc-800">
        <Eyebrow>Total delay to {anchor.shortName}</Eyebrow>
        <p className={cn('mt-1 text-3xl font-semibold tracking-tight', d.delayMonths > 0 ? 'text-rose-300' : 'text-emerald-300')}>
          {d.delayMonths > 0 ? `+${d.delayMonths} months` : '0 months'}
        </p>
        <p className="text-[11px] text-zinc-500">
          {d.ruleBreaks.length} break{d.ruleBreaks.length === 1 ? '' : 's'} logged · applied to every plan ETA
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <label htmlFor="rule-reason" className="text-xs text-zinc-400">
          Be honest — log it
        </label>
        <select
          id="rule-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-10 w-full rounded-lg bg-zinc-950/80 px-2 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none focus:ring-rose-500/50"
        >
          {RULE_BREAK_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <Button variant="danger" size="md" icon={AlertTriangle} className="w-full" onClick={() => d.logRuleBreak(reason)}>
          Log rule break (+{RULES.ruleBreakDelayMonths} mo)
        </Button>
      </div>

      {d.ruleBreaks.length > 0 && (
        <ul className="mt-4 max-h-48 space-y-1.5 overflow-y-auto">
          {d.ruleBreaks.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg bg-rose-500/[0.05] px-2.5 py-2 ring-1 ring-rose-500/15">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-zinc-200">{r.reason}</span>
                <span className="text-[10px] text-zinc-500">{shortDate(parseISODate(r.date))}</span>
              </span>
              <button
                type="button"
                onClick={() => d.removeRuleBreak(r.id)}
                className="flex size-7 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label={`Remove rule break: ${r.reason}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

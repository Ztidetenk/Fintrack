import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FlaskConical,
  Gauge,
  NotebookPen,
  Pencil,
  Plus,
  SquareTerminal,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ACCOUNT_TYPES, RULES } from '../data/roadmap';
import { parseISODate, pct, shortDate, signedMoney, toDayKey, usdAxis, usdCompact } from '../lib/format';
import { JOURNAL_SETUPS, computeStats, equityCurve, groupByDay, toCsv, type DaySummary, type JournalEntry } from '../lib/journal';
import { CHART, LOSS, PROFIT } from '../lib/palette';
import { useTwoStepConfirm } from '../lib/useTwoStepConfirm';
import { useDashboard } from '../state/DashboardContext';
import { PageIntro } from '../components/PageIntro';
import { Button } from '../components/ui/Button';
import { Card, Eyebrow } from '../components/ui/Card';
import { cn } from '../components/ui/cn';
import { Segmented } from '../components/ui/Segmented';
import { StatusPill } from '../components/ui/StatusPill';

const signedCompact = (n: number) => (n > 0 ? `+${usdCompact(n)}` : n < 0 ? `−${usdCompact(Math.abs(n))}` : '$0');
const pnlText = (n: number) => (n > 0 ? 'text-emerald-300' : n < 0 ? 'text-rose-300' : 'text-zinc-200');
const longDate = (key: string) =>
  parseISODate(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const accountLabel = (id: string) => ACCOUNT_TYPES.find((a) => a.id === id)?.label ?? id;

export function Journal() {
  const d = useDashboard();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const stats = useMemo(() => computeStats(d.journal, d.now), [d.journal, d.now]);
  const editing = d.journal.find((e) => e.id === editingId);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(d.journal)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-horizon-journal-${toDayKey(new Date())}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="P&L journal · saved on this device"
        title="Trade Journal"
        action={
          <Button size="sm" icon={Download} disabled={d.journal.length === 0} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      >
        Log what you made or lost each day, why, and whether you followed your rules. The streaks and the curve take care of
        themselves.
      </PageIntro>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Today', value: stats.today, sub: `${stats.todayEntries} entr${stats.todayEntries === 1 ? 'y' : 'ies'}` },
          { label: 'This week', value: stats.week, sub: 'Since Monday' },
          { label: 'This month', value: stats.month, sub: d.now.toLocaleDateString('en-US', { month: 'long' }) },
          { label: 'All-time net', value: stats.allTime, sub: `${stats.tradingDays} trading days` },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <Eyebrow>{s.label}</Eyebrow>
            <p className={cn('mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl', pnlText(s.value))}>
              {signedMoney(s.value)}
            </p>
            <p className="text-[11px] text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="scrollbar-none lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
          <EntryForm key={editingId ?? 'new'} editing={editing} onDone={() => setEditingId(null)} />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <PnlCalendar entries={d.journal} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          <PnlCharts entries={d.journal} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Performance stats={stats} />
        <EntryList
          selectedDay={selectedDay}
          onClearDay={() => setSelectedDay(null)}
          editingId={editingId}
          onEdit={(id) => {
            setEditingId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Entry form                                                          */
/* ------------------------------------------------------------------ */

function EntryForm({ editing, onDone }: { editing?: JournalEntry; onDone: () => void }) {
  const d = useDashboard();
  const todayKey = toDayKey(d.now);
  const defaultAccount =
    ACCOUNT_TYPES.find((t) => t.status === 'funded' && (d.accounts[t.id] ?? 0) > 0)?.id ??
    ACCOUNT_TYPES.find((t) => (d.accounts[t.id] ?? 0) > 0)?.id ??
    ACCOUNT_TYPES[0].id;

  const [date, setDate] = useState(editing?.date ?? todayKey);
  const [side, setSide] = useState<'profit' | 'loss'>(editing && editing.pnl < 0 ? 'loss' : 'profit');
  const [amount, setAmount] = useState(editing ? String(Math.abs(editing.pnl)) : '');
  const [trades, setTrades] = useState(editing?.trades ?? 1);
  const [accountId, setAccountId] = useState(editing?.accountId ?? defaultAccount);
  const [setup, setSetup] = useState(editing?.setup ?? JOURNAL_SETUPS[0]);
  const [followedRules, setFollowedRules] = useState(editing?.followedRules ?? true);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2_500);
    return () => window.clearTimeout(t);
  }, [saved]);

  const terminalTrades = d.terminal.trades;
  const terminalPnl = d.terminalStatus.pnl;
  const brokeRulesToday = d.ruleBreaks.some((r) => r.date === todayKey);
  const terminalJournaled = d.journal.some(
    (e) => e.date === todayKey && e.pnl === terminalPnl && e.trades === terminalTrades.length,
  );

  const fillFromTerminal = () => {
    setDate(todayKey);
    setSide(terminalPnl < 0 ? 'loss' : 'profit');
    setAmount(String(Math.abs(terminalPnl)));
    setTrades(terminalTrades.length);
    setFollowedRules(!brokeRulesToday);
    setError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(/[$,\s]/g, ''));
    if (amount.trim() === '' || !Number.isFinite(value) || value < 0) {
      setError('Enter the amount as a number, like 200 or 87.50.');
      return;
    }
    if (!date || date > todayKey) {
      setError("Pick a date up to today. You can't journal a day that hasn't happened.");
      return;
    }
    const pnl = Math.round((side === 'loss' ? -value : value) * 100) / 100;
    d.saveJournalEntry({ date, pnl, trades, accountId, setup, followedRules, notes: notes.trim() }, editing?.id);
    setError('');
    if (editing) {
      onDone();
    } else {
      setAmount('');
      setNotes('');
      setSaved(true);
    }
  };

  const overLimit = trades > RULES.maxTrades;

  return (
    <Card
      title={editing ? 'Edit entry' : "Log today's P&L"}
      subtitle={editing ? longDate(editing.date) : 'One entry per session or per account'}
      icon={NotebookPen}
      iconTone="emerald"
      className={cn(editing && 'border-cyan-500/40')}
      action={
        editing && (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Cancel editing"
          >
            <X className="size-4" />
          </button>
        )
      }
    >
      {!editing && terminalTrades.length > 0 && !terminalJournaled && (
        <button
          type="button"
          onClick={fillFromTerminal}
          className="mb-4 flex w-full items-center gap-2.5 rounded-xl bg-cyan-500/[0.07] p-3 text-left ring-1 ring-cyan-500/25 transition-colors hover:bg-cyan-500/[0.12]"
        >
          <SquareTerminal className="size-4 shrink-0 text-cyan-300" aria-hidden />
          <span className="min-w-0 flex-1 text-xs text-zinc-300">
            Fill from today's terminal log:{' '}
            <span className={cn('font-mono font-medium', pnlText(terminalPnl))}>{signedMoney(terminalPnl)}</span> ·{' '}
            {terminalTrades.length} trade{terminalTrades.length === 1 ? '' : 's'}
          </span>
        </button>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="journal-date" className="text-xs text-zinc-400">
              Date
            </label>
            <input
              id="journal-date"
              type="date"
              value={date}
              max={todayKey}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg bg-zinc-950/80 px-3 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label htmlFor="journal-account" className="text-xs text-zinc-400">
              Account
            </label>
            <select
              id="journal-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg bg-zinc-950/80 px-2 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none focus:ring-emerald-500/50"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="text-xs text-zinc-400">Result</legend>
          <div className="mt-1 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Result">
            {(['profit', 'loss'] as const).map((s) => {
              const active = side === s;
              const Icon = s === 'profit' ? TrendingUp : TrendingDown;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSide(s)}
                  className={cn(
                    'flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium ring-1 transition-colors',
                    active
                      ? s === 'profit'
                        ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40'
                        : 'bg-rose-500/15 text-rose-300 ring-rose-500/40'
                      : 'bg-zinc-950/60 text-zinc-400 ring-zinc-800 hover:text-zinc-100',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {s === 'profit' ? 'Profit' : 'Loss'}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="journal-amount" className="text-xs text-zinc-400">
            Amount
          </label>
          <div
            className={cn(
              'mt-1 flex items-center rounded-lg bg-zinc-950/80 ring-1 ring-zinc-800',
              side === 'profit' ? 'focus-within:ring-emerald-500/50' : 'focus-within:ring-rose-500/50',
            )}
          >
            <span className={cn('pl-3 font-mono text-sm', side === 'profit' ? 'text-emerald-400' : 'text-rose-400')}>
              {side === 'profit' ? '+$' : '−$'}
            </span>
            <input
              id="journal-amount"
              inputMode="decimal"
              placeholder="200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(error)}
              className="h-11 w-full bg-transparent px-2 font-mono text-base text-zinc-100 outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <fieldset>
            <legend className="text-xs text-zinc-400">Trades taken</legend>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={trades === n}
                  onClick={() => setTrades(n)}
                  className={cn(
                    'h-10 rounded-lg font-mono text-sm ring-1 transition-colors',
                    trades === n
                      ? n > RULES.maxTrades
                        ? 'bg-rose-500/15 text-rose-300 ring-rose-500/40'
                        : 'bg-zinc-800 text-zinc-50 ring-zinc-600'
                      : 'bg-zinc-950/60 text-zinc-400 ring-zinc-800 hover:text-zinc-100',
                  )}
                >
                  {n === 3 ? '3+' : n}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="journal-setup" className="text-xs text-zinc-400">
              Setup
            </label>
            <select
              id="journal-setup"
              value={setup}
              onChange={(e) => setSetup(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg bg-zinc-950/80 px-2 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none focus:ring-emerald-500/50"
            >
              {JOURNAL_SETUPS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        {overLimit && (
          <p className="text-xs text-rose-300">
            That's over your {RULES.maxTrades}-trade limit. Log the rule break in the terminal.
          </p>
        )}

        <button
          type="button"
          role="checkbox"
          aria-checked={followedRules}
          onClick={() => setFollowedRules((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg bg-zinc-950/50 p-3 text-left ring-1 ring-zinc-800 hover:ring-zinc-700"
        >
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-md ring-1 transition-colors',
              followedRules ? 'bg-emerald-500 text-zinc-950 ring-emerald-400' : 'bg-zinc-950 text-transparent ring-zinc-600',
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="text-sm text-zinc-200">I followed all my rules</span>
        </button>

        <div>
          <label htmlFor="journal-notes" className="text-xs text-zinc-400">
            Notes
          </label>
          <textarea
            id="journal-notes"
            rows={3}
            placeholder="What did price do? What did you do? What would you repeat?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full resize-y rounded-lg bg-zinc-950/80 p-3 text-sm text-zinc-100 ring-1 ring-zinc-800 outline-none placeholder:text-zinc-600 focus:ring-emerald-500/50"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-300" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="md" icon={editing ? Check : Plus} className="flex-1">
            {editing ? 'Update entry' : 'Save to journal'}
          </Button>
          {editing && (
            <Button size="md" onClick={onDone}>
              Cancel
            </Button>
          )}
        </div>
        <p className="h-4 text-xs text-emerald-300" role="status" aria-live="polite">
          {saved ? 'Saved to your journal.' : ''}
        </p>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function PnlCalendar({
  entries,
  selectedDay,
  onSelectDay,
}: {
  entries: JournalEntry[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const { now } = useDashboard();
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const todayKey = toDayKey(now);
  const days = useMemo(() => new Map(groupByDay(entries).map((day) => [day.date, day])), [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => toDayKey(new Date(year, month, i + 1)));
  const traded = monthDays.map((k) => days.get(k)).filter((x): x is DaySummary => Boolean(x));
  const monthPnl = traded.reduce((s, x) => s + x.pnl, 0);
  const maxAbs = Math.max(1, ...traded.map((x) => Math.abs(x.pnl)));

  return (
    <Card
      title={cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      subtitle={
        traded.length
          ? `${signedMoney(monthPnl)} · ${traded.length} trading day${traded.length === 1 ? '' : 's'} · ${traded.filter((x) => x.pnl > 0).length} green`
          : 'No entries this month'
      }
      icon={CalendarDays}
      iconTone="cyan"
      action={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            disabled={isCurrentMonth}
            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:text-zinc-700 disabled:hover:bg-transparent"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {monthDays.map((key, i) => {
          const day = days.get(key);
          const future = key > todayKey;
          const weekend = (offset + i) % 7 >= 5;
          const intensity = day ? 0.16 + 0.5 * Math.min(1, Math.abs(day.pnl) / maxAbs) : 0;
          const rgb = day && day.pnl > 0 ? '5 150 105' : '244 63 94';
          return (
            <button
              key={key}
              type="button"
              disabled={!day}
              onClick={() => onSelectDay(selectedDay === key ? null : key)}
              aria-pressed={selectedDay === key}
              aria-label={
                day
                  ? `${shortDate(parseISODate(key))}: ${signedMoney(day.pnl)}, ${day.entries.length} entries`
                  : shortDate(parseISODate(key))
              }
              className={cn(
                'flex aspect-square min-w-0 flex-col justify-between rounded-lg p-1 text-left ring-1 transition-all sm:aspect-[5/4] sm:p-2',
                day ? 'hover:brightness-125' : 'cursor-default',
                day && day.pnl === 0 ? 'bg-zinc-800/80' : !day && 'bg-zinc-950/40',
                selectedDay === key ? 'ring-2 ring-zinc-100' : key === todayKey ? 'ring-emerald-400/70' : 'ring-zinc-800/80',
                (future || (weekend && !day)) && 'opacity-40',
              )}
              style={day && day.pnl !== 0 ? { background: `rgb(${rgb} / ${intensity})` } : undefined}
            >
              <span
                className={cn('text-[10px] sm:text-xs', key === todayKey ? 'font-semibold text-emerald-300' : 'text-zinc-400')}
              >
                {i + 1}
              </span>
              {day && (
                <span className="truncate font-mono text-[9px] font-medium text-zinc-50 sm:text-[11px]">
                  {signedCompact(day.pnl)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: PROFIT }} aria-hidden /> Green day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: LOSS }} aria-hidden /> Red day
        </span>
        <span>Deeper color = bigger day. Tap a day to filter the log.</span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

function PnlCharts({ entries }: { entries: JournalEntry[] }) {
  const [view, setView] = useState<'equity' | 'daily'>('equity');
  const gradient = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const curve = useMemo(() => equityCurve(entries), [entries]);
  const daily = curve.slice(-30);
  const axis = { stroke: CHART.axis, tick: { fill: CHART.tick, fontSize: 11 }, tickLine: false } as const;
  const dateTick = (k: string) => shortDate(parseISODate(k));

  return (
    <Card
      title={view === 'equity' ? 'Equity curve' : 'Daily P&L'}
      subtitle={view === 'equity' ? 'Cumulative P&L across every journaled day' : 'Last 30 trading days'}
      icon={Gauge}
      iconTone="emerald"
      action={
        <Segmented
          label="Chart"
          value={view}
          onChange={setView}
          options={[
            { value: 'equity', label: 'Equity' },
            { value: 'daily', label: 'Daily' },
          ]}
        />
      }
    >
      {curve.length < 2 ? (
        <p className="flex h-56 items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 text-center text-xs text-zinc-500">
          Log at least two days to draw the curve.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'equity' ? (
              <AreaChart data={curve} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PROFIT} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={PROFIT} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" tickFormatter={dateTick} {...axis} axisLine={{ stroke: CHART.axis }} minTickGap={32} />
                <YAxis tickFormatter={usdAxis} width={52} {...axis} axisLine={false} tickCount={5} />
                <ReferenceLine y={0} stroke={CHART.reference} strokeOpacity={0.4} />
                <Tooltip
                  cursor={{ stroke: CHART.reference, strokeOpacity: 0.6 }}
                  content={({ active, payload }) => (
                    <ChartTip active={active} row={payload?.[0]?.payload as (typeof curve)[number]} />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke={PROFIT}
                  strokeWidth={2}
                  fill={`url(#${gradient})`}
                  activeDot={{ r: 4, stroke: CHART.surface, strokeWidth: 2, fill: PROFIT }}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="date" tickFormatter={dateTick} {...axis} axisLine={false} minTickGap={24} />
                <YAxis tickFormatter={usdAxis} width={52} {...axis} axisLine={false} tickCount={5} />
                <ReferenceLine y={0} stroke={CHART.axis} />
                <Tooltip
                  cursor={{ fill: 'rgb(255 255 255 / 0.04)' }}
                  content={({ active, payload }) => (
                    <ChartTip active={active} row={payload?.[0]?.payload as (typeof curve)[number]} />
                  )}
                />
                <Bar dataKey="pnl" maxBarSize={22} radius={[4, 4, 4, 4]} isAnimationActive={false}>
                  {daily.map((r) => (
                    <Cell key={r.date} fill={r.pnl >= 0 ? PROFIT : LOSS} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function ChartTip({ active, row }: { active?: boolean; row?: { date: string; pnl: number; equity: number } }) {
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{longDate(row.date)}</p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full" style={{ background: row.pnl >= 0 ? PROFIT : LOSS }} aria-hidden />
          <span className="font-semibold text-zinc-50 tabular-nums">{signedMoney(row.pnl)}</span>
          <span className="text-zinc-400">day</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full bg-zinc-500" aria-hidden />
          <span className="font-semibold text-zinc-50 tabular-nums">{signedMoney(row.equity)}</span>
          <span className="text-zinc-400">running total</span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Performance                                                         */
/* ------------------------------------------------------------------ */

function Performance({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const rows: { label: string; value: string; tone?: string; sub?: string }[] = [
    {
      label: 'Green-day rate',
      value: stats.tradingDays ? pct(stats.winRate) : '—',
      sub: `${stats.greenDays} green · ${stats.redDays} red`,
    },
    {
      label: 'Profit factor',
      value: stats.profitFactor === Infinity ? '∞' : stats.tradingDays ? stats.profitFactor.toFixed(2) : '—',
      sub: 'Gross profit ÷ gross loss',
    },
    { label: 'Avg green day', value: stats.greenDays ? signedMoney(stats.avgWin) : '—', tone: 'text-emerald-300' },
    { label: 'Avg red day', value: stats.redDays ? signedMoney(stats.avgLoss) : '—', tone: 'text-rose-300' },
    {
      label: 'Best day',
      value: stats.best ? signedMoney(stats.best.pnl) : '—',
      tone: 'text-emerald-300',
      sub: stats.best ? shortDate(parseISODate(stats.best.date)) : undefined,
    },
    {
      label: 'Worst day',
      value: stats.worst ? signedMoney(stats.worst.pnl) : '—',
      tone: 'text-rose-300',
      sub: stats.worst ? shortDate(parseISODate(stats.worst.date)) : undefined,
    },
    {
      label: 'Current streak',
      value:
        stats.streak.kind === 'none'
          ? '—'
          : `${stats.streak.length} ${stats.streak.kind} day${stats.streak.length === 1 ? '' : 's'}`,
      tone: stats.streak.kind === 'green' ? 'text-emerald-300' : stats.streak.kind === 'red' ? 'text-rose-300' : undefined,
    },
    {
      label: 'Rules followed',
      value: stats.tradingDays ? pct(stats.rulesFollowed) : '—',
      sub: 'Of all entries',
      tone: stats.rulesFollowed >= 0.9 ? 'text-emerald-300' : stats.tradingDays ? 'text-amber-300' : undefined,
    },
  ];

  return (
    <Card title="Performance" subtitle="Across every journaled day" icon={Gauge} iconTone="cyan">
      <dl className="divide-y divide-zinc-800/80">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-xs text-zinc-400">
              {r.label}
              {r.sub && <span className="block text-[11px] text-zinc-600">{r.sub}</span>}
            </dt>
            <dd className={cn('font-mono text-sm font-medium tabular-nums', r.tone ?? 'text-zinc-100')}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Entry list                                                          */
/* ------------------------------------------------------------------ */

function EntryList({
  selectedDay,
  onClearDay,
  editingId,
  onEdit,
}: {
  selectedDay: string | null;
  onClearDay: () => void;
  editingId: string | null;
  onEdit: (id: string) => void;
}) {
  const d = useDashboard();
  const days = useMemo(() => groupByDay(d.journal), [d.journal]);
  const visible = selectedDay ? days.filter((x) => x.date === selectedDay) : days;
  const hasSamples = d.journal.some((e) => e.sample);

  return (
    <Card
      className="lg:col-span-2"
      title="Journal entries"
      subtitle={
        selectedDay
          ? `Showing ${longDate(selectedDay)}`
          : `${d.journal.length} entr${d.journal.length === 1 ? 'y' : 'ies'} across ${days.length} day${days.length === 1 ? '' : 's'}`
      }
      icon={NotebookPen}
      iconTone="zinc"
      action={
        <>
          {selectedDay && (
            <Button size="xs" variant="ghost" icon={X} onClick={onClearDay}>
              Show all
            </Button>
          )}
          {hasSamples && (
            <Button size="xs" variant="ghost" icon={Trash2} onClick={d.clearSampleJournal}>
              Remove samples
            </Button>
          )}
        </>
      }
    >
      {d.journal.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center">
          <NotebookPen className="size-8 text-zinc-700" aria-hidden />
          <p className="mt-3 text-sm text-zinc-200">Your journal is empty</p>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            Use the form to log today's result. Entries stay in this browser until you delete them, and Reset data never touches
            them.
          </p>
          <Button size="sm" variant="ghost" icon={FlaskConical} className="mt-4" onClick={d.loadSampleJournal}>
            Load a sample week to preview
          </Button>
        </div>
      ) : (
        <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
          {visible.map((day) => (
            <section key={day.date} aria-label={longDate(day.date)}>
              <header className="sticky top-0 z-10 flex items-center justify-between bg-zinc-900/95 py-1.5 backdrop-blur">
                <h3 className="text-xs font-medium text-zinc-300">{longDate(day.date)}</h3>
                <span className={cn('font-mono text-xs font-medium tabular-nums', pnlText(day.pnl))}>
                  {signedMoney(day.pnl)} · {day.trades} trade{day.trades === 1 ? '' : 's'}
                </span>
              </header>
              <ul className="mt-1.5 space-y-2">
                {day.entries.map((e) => (
                  <JournalRow key={e.id} entry={e} editing={editingId === e.id} onEdit={() => onEdit(e.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}

function JournalRow({ entry: e, editing, onEdit }: { entry: JournalEntry; editing: boolean; onEdit: () => void }) {
  const d = useDashboard();
  const del = useTwoStepConfirm(() => d.removeJournalEntry(e.id));

  return (
    <li className={cn('rounded-xl bg-zinc-950/50 p-3 ring-1', editing ? 'ring-cyan-500/40' : 'ring-zinc-800')}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1',
            e.pnl > 0
              ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25'
              : e.pnl < 0
                ? 'bg-rose-500/10 text-rose-300 ring-rose-500/25'
                : 'bg-zinc-800 text-zinc-400 ring-zinc-700',
          )}
        >
          {e.pnl >= 0 ? <TrendingUp className="size-4" aria-hidden /> : <TrendingDown className="size-4" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn('font-mono text-sm font-semibold tabular-nums', pnlText(e.pnl))}>{signedMoney(e.pnl)}</span>
            <span className="text-[11px] text-zinc-500">
              {e.trades} trade{e.trades === 1 ? '' : 's'} · {accountLabel(e.accountId)} · {e.setup}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {e.followedRules ? (
              <StatusPill tone="emerald" icon={Check}>
                Rules followed
              </StatusPill>
            ) : (
              <StatusPill tone="rose" icon={X}>
                Broke rules
              </StatusPill>
            )}
            {e.trades > RULES.maxTrades && (
              <StatusPill tone="rose" icon={X}>
                Over trade limit
              </StatusPill>
            )}
            {e.sample && (
              <StatusPill tone="zinc" icon={FlaskConical}>
                Sample
              </StatusPill>
            )}
          </div>
          {e.notes && <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-zinc-300">{e.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
            aria-label={`Edit entry from ${shortDate(parseISODate(e.date))}`}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={del.trigger}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs transition-colors',
              del.armed
                ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-rose-300',
            )}
            aria-label={del.armed ? 'Confirm delete' : `Delete entry from ${shortDate(parseISODate(e.date))}`}
          >
            <Trash2 className="size-3.5" />
            {del.armed && 'Delete?'}
          </button>
        </div>
      </div>
    </li>
  );
}

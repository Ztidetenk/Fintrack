import { ACCOUNT_TYPES } from '../data/roadmap';
import { parseISODate, toDayKey } from './format';

export interface JournalEntry {
  id: string;
  /** Trading day, YYYY-MM-DD. */
  date: string;
  pnl: number;
  trades: number;
  accountId: string;
  setup: string;
  followedRules: boolean;
  notes: string;
  createdAt: string;
  /** Example rows loaded from the empty state; removable in one click. */
  sample?: boolean;
}

export interface DaySummary {
  date: string;
  pnl: number;
  trades: number;
  entries: JournalEntry[];
}

export const JOURNAL_SETUPS = ['Sweep + IFVG', 'Liquidity sweep', 'IFVG only', 'Other'];

/** Entries grouped per trading day, newest first. */
export function groupByDay(entries: JournalEntry[]): DaySummary[] {
  const map = new Map<string, DaySummary>();
  for (const e of entries) {
    const day = map.get(e.date) ?? { date: e.date, pnl: 0, trades: 0, entries: [] };
    day.pnl += e.pnl;
    day.trades += e.trades;
    day.entries.push(e);
    map.set(e.date, day);
  }
  const days = [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  for (const d of days) d.entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return days;
}

/** Monday of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

const sumSince = (days: DaySummary[], fromKey: string) => days.filter((d) => d.date >= fromKey).reduce((s, d) => s + d.pnl, 0);

export interface JournalStats {
  today: number;
  todayEntries: number;
  week: number;
  month: number;
  allTime: number;
  tradingDays: number;
  greenDays: number;
  redDays: number;
  /** Share of trading days that closed green. */
  winRate: number;
  avgWin: number;
  avgLoss: number;
  /** Gross profit ÷ gross loss across days; Infinity with no losing days. */
  profitFactor: number;
  best?: DaySummary;
  worst?: DaySummary;
  streak: { kind: 'green' | 'red' | 'none'; length: number };
  rulesFollowed: number;
}

export function computeStats(entries: JournalEntry[], now: Date): JournalStats {
  const days = groupByDay(entries);
  const todayKey = toDayKey(now);
  const weekKey = toDayKey(startOfWeek(now));
  const monthKey = toDayKey(new Date(now.getFullYear(), now.getMonth(), 1));

  const green = days.filter((d) => d.pnl > 0);
  const red = days.filter((d) => d.pnl < 0);
  const grossWin = green.reduce((s, d) => s + d.pnl, 0);
  const grossLoss = Math.abs(red.reduce((s, d) => s + d.pnl, 0));

  let streak: JournalStats['streak'] = { kind: 'none', length: 0 };
  for (const d of days) {
    if (d.pnl === 0) break;
    const kind = d.pnl > 0 ? 'green' : 'red';
    if (streak.kind === 'none') streak = { kind, length: 1 };
    else if (streak.kind === kind) streak.length++;
    else break;
  }

  const byPnl = [...days].sort((a, b) => b.pnl - a.pnl);
  const todayDay = days.find((d) => d.date === todayKey);

  return {
    today: todayDay?.pnl ?? 0,
    todayEntries: todayDay?.entries.length ?? 0,
    week: sumSince(days, weekKey),
    month: sumSince(days, monthKey),
    allTime: days.reduce((s, d) => s + d.pnl, 0),
    tradingDays: days.length,
    greenDays: green.length,
    redDays: red.length,
    winRate: days.length ? green.length / days.length : 0,
    avgWin: green.length ? grossWin / green.length : 0,
    avgLoss: red.length ? -grossLoss / red.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    best: byPnl[0]?.pnl > 0 ? byPnl[0] : undefined,
    worst: byPnl[byPnl.length - 1]?.pnl < 0 ? byPnl[byPnl.length - 1] : undefined,
    streak,
    rulesFollowed: entries.length ? entries.filter((e) => e.followedRules).length / entries.length : 0,
  };
}

/** Cumulative P&L per trading day, oldest first. */
export function equityCurve(entries: JournalEntry[]) {
  let running = 0;
  return groupByDay(entries)
    .reverse()
    .map((d) => {
      running += d.pnl;
      return { date: d.date, pnl: d.pnl, equity: running };
    });
}

const accountLabel = (id: string) => ACCOUNT_TYPES.find((a) => a.id === id)?.label ?? id;

export function toCsv(entries: JournalEntry[]): string {
  const esc = (v: string | number | boolean) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['date', 'pnl', 'trades', 'account', 'setup', 'followed_rules', 'notes'];
  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((e) => [e.date, e.pnl, e.trades, accountLabel(e.accountId), e.setup, e.followedRules, e.notes].map(esc).join(','));
  return [header.join(','), ...rows].join('\n');
}

/** A short run of example days so the charts have something to show. */
export function sampleEntries(now: Date): JournalEntry[] {
  const plan: [number, number, string, boolean, string][] = [
    [-100, 1, 'Sweep + IFVG', true, 'Stopped out clean. A+ loss, walked away.'],
    [200, 1, 'Sweep + IFVG', true, 'NY AM sweep of Asia low into IFVG. Target hit.'],
    [140, 2, 'Liquidity sweep', true, 'Partial at 1R, runner to target.'],
    [0, 1, 'IFVG only', true, 'Moved to breakeven, scratched.'],
    [-250, 2, 'Other', false, 'Revenge trade after first stop. Logged rule break.'],
    [200, 1, 'Sweep + IFVG', true, 'One and done.'],
    [180, 2, 'Sweep + IFVG', true, 'Two A setups, both worked.'],
    [-100, 1, 'Liquidity sweep', true, 'No displacement after sweep. Stop hit.'],
    [200, 1, 'Sweep + IFVG', true, 'Textbook PM session setup.'],
  ];
  const out: JournalEntry[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let i = plan.length - 1;
  while (i >= 0) {
    cursor.setDate(cursor.getDate() - 1);
    const dow = cursor.getDay();
    if (dow === 0 || dow === 6) continue;
    const [pnl, trades, setup, followedRules, notes] = plan[i];
    const date = toDayKey(cursor);
    out.push({
      id: `sample-${date}`,
      date,
      pnl,
      trades,
      accountId: 'lucid-25k-funded',
      setup,
      followedRules,
      notes,
      createdAt: parseISODate(date).toISOString(),
      sample: true,
    });
    i--;
  }
  return out;
}

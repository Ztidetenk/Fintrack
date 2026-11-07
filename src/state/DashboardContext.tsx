import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ACCOUNT_TYPES,
  DEFAULT_ANCHOR_MESSAGE,
  GATE_QUESTIONS,
  MILESTONES,
  RULES,
  phaseForMonth,
  type GateId,
  type MilestoneId,
  type Phase,
  type PhaseId,
} from '../data/roadmap';
import { clamp, monthsBetween, toDayKey, uid } from '../lib/format';
import { roadmapStart, runProjection, type Projection, type SimSettings } from '../lib/projection';
import { usePersistentState } from '../lib/usePersistentState';
import { sampleEntries, type JournalEntry } from '../lib/journal';
import { computeVault, type AcquiredRecord, type Deposit, type VaultStatus } from '../lib/vault';

export type TabId = 'command' | 'roadmap' | 'treasury' | 'vault' | 'terminal' | 'journal';

export type GateAnswer = boolean | 'patience' | 'impulse';

export interface Trade {
  id: string;
  time: string;
  pnl: number;
}

export interface RuleBreak {
  id: string;
  date: string;
  reason: string;
}

export interface TerminalState {
  day: string;
  answers: Partial<Record<GateId, GateAnswer>>;
  sessionActive: boolean;
  trades: Trade[];
}

export interface AnchorSettings {
  milestoneId: MilestoneId;
  message: string;
  imageUrl: string;
}

export type SessionStatus = 'standby' | 'active' | 'locked';

export interface TerminalStatus {
  status: SessionStatus;
  pnl: number;
  tradesUsed: number;
  tradesLeft: number;
  lossBudgetLeft: number;
  gatePassed: number;
  gateCleared: boolean;
  impulseFlag: boolean;
  lockReason?: string;
}

const DEFAULT_SIM: SimSettings = {
  mode: 'custom',
  monthlyPayout: 6_750,
  vaultPct: 0.4,
  payoutGrowth: 0.12,
  treasuryReturn: 0.1,
};

const DEFAULT_DEPOSITS: Deposit[] = [{ id: 'seed-1', date: '2026-10-05', amount: 1_500, note: 'Opening vault seed (demo)' }];

const freshTerminal = (): TerminalState => ({
  day: toDayKey(new Date()),
  answers: {},
  sessionActive: false,
  trades: [],
});

const DEFAULT_ANCHOR: AnchorSettings = { milestoneId: 'mercedes', message: DEFAULT_ANCHOR_MESSAGE, imageUrl: '' };

function useDashboardValue() {
  const [tab, setTab] = usePersistentState<TabId>('tab', 'command');
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('sidebar-collapsed', false);
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | null>(null);

  /* ---------- day-level clock (the header runs its own per-second clock) ---------- */
  const now = useNow(60_000);
  const todayKey = toDayKey(now);
  const currentMonth = clamp(monthsBetween(roadmapStart, now) + 1, 1, 180);
  const currentPhase: Phase = phaseForMonth(currentMonth);

  /* ---------- accounts ---------- */
  const [accounts, setAccounts] = usePersistentState<Record<string, number>>('accounts', { 'lucid-25k-eval': 1 });
  const setAccountCount = useCallback(
    (typeId: string, count: number) => setAccounts((a) => ({ ...a, [typeId]: clamp(Math.round(count), 0, 20) })),
    [setAccounts],
  );
  const accountCapacity = ACCOUNT_TYPES.reduce((sum, t) => sum + (accounts[t.id] ?? 0) * t.estMonthly, 0);
  const accountTotal = ACCOUNT_TYPES.reduce((sum, t) => sum + (accounts[t.id] ?? 0), 0);

  /* ---------- simulator ---------- */
  const [sim, setSim] = usePersistentState<SimSettings>('sim', DEFAULT_SIM);
  const updateSim = useCallback((patch: Partial<SimSettings>) => setSim((s) => ({ ...s, ...patch })), [setSim]);
  const projection = useMemo<Projection>(() => runProjection(sim), [sim]);
  const { vaultPct, treasuryReturn } = sim;
  const planProjection = useMemo<Projection>(
    () => runProjection({ ...DEFAULT_SIM, mode: 'plan', vaultPct, treasuryReturn }),
    [vaultPct, treasuryReturn],
  );
  const monthlyVaultAllocation = sim.monthlyPayout * sim.vaultPct;

  /* ---------- vault ---------- */
  const [deposits, setDeposits] = usePersistentState<Deposit[]>('deposits', DEFAULT_DEPOSITS);
  const [acquired, setAcquired] = usePersistentState<AcquiredRecord[]>('acquired', []);
  const vault: VaultStatus = useMemo(() => computeVault(deposits, acquired), [deposits, acquired]);

  const addDeposit = useCallback(
    (amount: number, note: string) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      setDeposits((d) => [{ id: uid(), date: toDayKey(new Date()), amount: Math.round(amount), note }, ...d]);
    },
    [setDeposits],
  );
  const removeDeposit = useCallback((id: string) => setDeposits((d) => d.filter((x) => x.id !== id)), [setDeposits]);
  const acquireActive = useCallback(() => {
    const active = vault.active;
    if (!active || active.remaining > 0) return;
    setAcquired((a) => [...a, { id: active.milestone.id, date: toDayKey(new Date()) }]);
  }, [vault.active, setAcquired]);
  const undoLastAcquisition = useCallback(() => setAcquired((a) => a.slice(0, -1)), [setAcquired]);

  /* ---------- roadmap checklist ---------- */
  const [roadmapDone, setRoadmapDone] = usePersistentState<string[]>('roadmap-done', []);
  const toggleObjective = useCallback(
    (id: string) => setRoadmapDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id])),
    [setRoadmapDone],
  );

  /* ---------- execution terminal ---------- */
  const [terminal, setTerminal] = usePersistentState<TerminalState>('terminal', freshTerminal());
  const [ruleBreaks, setRuleBreaks] = usePersistentState<RuleBreak[]>('rule-breaks', []);
  const [anchor, setAnchor] = usePersistentState<AnchorSettings>('anchor', DEFAULT_ANCHOR);

  // The gatekeeper and trade count reset every calendar day.
  useEffect(() => {
    if (terminal.day !== todayKey) setTerminal(freshTerminal());
  }, [terminal.day, todayKey, setTerminal]);

  const setAnswer = useCallback(
    (id: GateId, value: GateAnswer) =>
      setTerminal((t) => ({ ...t, sessionActive: false, answers: { ...t.answers, [id]: value } })),
    [setTerminal],
  );

  const terminalStatus: TerminalStatus = useMemo(() => {
    const pnl = terminal.trades.reduce((s, t) => s + t.pnl, 0);
    const tradesUsed = terminal.trades.length;
    const gatePassed = GATE_QUESTIONS.filter((q) => {
      const a = terminal.answers[q.id];
      return q.id === 'mindset' ? a === 'patience' : a === true;
    }).length;
    const lossHit = pnl <= -RULES.dailyLock;
    const tradesHit = tradesUsed >= RULES.maxTrades;
    const locked = lossHit || tradesHit;
    return {
      status: locked ? 'locked' : terminal.sessionActive ? 'active' : 'standby',
      pnl,
      tradesUsed,
      tradesLeft: Math.max(0, RULES.maxTrades - tradesUsed),
      lossBudgetLeft: Math.max(0, RULES.dailyLock + Math.min(0, pnl)),
      gatePassed,
      gateCleared: gatePassed === GATE_QUESTIONS.length,
      impulseFlag: terminal.answers.mindset === 'impulse',
      lockReason: lossHit
        ? `Daily stop hit ($${RULES.dailyLock} loss limit)`
        : tradesHit
          ? `${RULES.maxTrades}-trade maximum reached`
          : undefined,
    };
  }, [terminal]);

  const unlockSession = useCallback(() => {
    if (!terminalStatus.gateCleared || terminalStatus.status === 'locked') return;
    setTerminal((t) => ({ ...t, sessionActive: true }));
  }, [terminalStatus.gateCleared, terminalStatus.status, setTerminal]);

  const logRuleBreak = useCallback(
    (reason: string) => setRuleBreaks((r) => [{ id: uid(), date: toDayKey(new Date()), reason }, ...r]),
    [setRuleBreaks],
  );

  const logTrade = useCallback(
    (pnl: number) => {
      if (terminalStatus.status !== 'active' || !Number.isFinite(pnl)) return;
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      // Every trade re-arms the gatekeeper: trade #2 has to earn its way in too.
      setTerminal((t) => ({
        ...t,
        sessionActive: false,
        answers: {},
        trades: [...t.trades, { id: uid(), time, pnl: Math.round(pnl) }],
      }));
      if (pnl < -RULES.maxRiskPerTrade) logRuleBreak(`Risked more than $${RULES.maxRiskPerTrade}`);
    },
    [terminalStatus.status, setTerminal, logRuleBreak],
  );

  const resetDay = useCallback(() => setTerminal(freshTerminal()), [setTerminal]);
  const removeRuleBreak = useCallback((id: string) => setRuleBreaks((r) => r.filter((x) => x.id !== id)), [setRuleBreaks]);

  const delayMonths = ruleBreaks.length * RULES.ruleBreakDelayMonths;

  /* ---------- journal (real P&L history — never touched by resetAll) ---------- */
  const [journal, setJournal] = usePersistentState<JournalEntry[]>('journal', []);
  const saveJournalEntry = useCallback(
    (entry: Omit<JournalEntry, 'id' | 'createdAt'>, id?: string) =>
      setJournal((j) =>
        id
          ? j.map((e) => (e.id === id ? { ...e, ...entry, sample: false } : e))
          : [...j, { ...entry, id: uid(), createdAt: new Date().toISOString() }],
      ),
    [setJournal],
  );
  const removeJournalEntry = useCallback((id: string) => setJournal((j) => j.filter((e) => e.id !== id)), [setJournal]);
  const loadSampleJournal = useCallback(
    () => setJournal((j) => [...j.filter((e) => !e.sample), ...sampleEntries(new Date())]),
    [setJournal],
  );
  const clearSampleJournal = useCallback(() => setJournal((j) => j.filter((e) => !e.sample)), [setJournal]);

  /* ---------- reset ---------- */
  const resetAll = useCallback(() => {
    setAccounts({ 'lucid-25k-eval': 1 });
    setSim(DEFAULT_SIM);
    setDeposits(DEFAULT_DEPOSITS);
    setAcquired([]);
    setRoadmapDone([]);
    setTerminal(freshTerminal());
    setRuleBreaks([]);
    setAnchor(DEFAULT_ANCHOR);
  }, [setAccounts, setSim, setDeposits, setAcquired, setRoadmapDone, setTerminal, setRuleBreaks, setAnchor]);

  /** Opens the roadmap on a given phase. */
  const openPhase = useCallback(
    (id: PhaseId) => {
      setSelectedPhase(id);
      setTab('roadmap');
    },
    [setTab],
  );

  return {
    tab,
    setTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    selectedPhase: selectedPhase ?? currentPhase.id,
    setSelectedPhase,
    openPhase,
    now,
    currentMonth,
    currentPhase,
    accounts,
    setAccountCount,
    accountCapacity,
    accountTotal,
    sim,
    updateSim,
    projection,
    planProjection,
    monthlyVaultAllocation,
    deposits,
    addDeposit,
    removeDeposit,
    acquired,
    acquireActive,
    undoLastAcquisition,
    vault,
    roadmapDone,
    toggleObjective,
    terminal,
    terminalStatus,
    setAnswer,
    unlockSession,
    logTrade,
    resetDay,
    ruleBreaks,
    logRuleBreak,
    removeRuleBreak,
    delayMonths,
    anchor,
    setAnchor,
    resetAll,
    journal,
    saveJournalEntry,
    removeJournalEntry,
    loadSampleJournal,
    clearSampleJournal,
  };
}

export type Dashboard = ReturnType<typeof useDashboardValue>;

/** Current time, refreshed every `intervalMs`. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

const DashboardContext = createContext<Dashboard | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboardValue();
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): Dashboard {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return ctx;
}

/** Plan-model month in which a milestone gets bought, if it fits inside the horizon. */
export function planEta(projection: Projection, id: MilestoneId) {
  return projection.acquisitions.find((a) => a.milestoneId === id);
}

export const MILESTONE_COUNT = MILESTONES.length;

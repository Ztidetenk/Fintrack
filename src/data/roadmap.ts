import { Car, CarFront, Building2, House, type LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export const PROFILE = {
  /** Birthday drives every "Age N" readout across the roadmap. */
  birthDate: '2006-11-19',
  /** Month 1 of the 15-year plan. */
  roadmapStart: '2026-10-01',
  strategy: 'MNQ/MES ICT Sweeps + IFVG',
  horizon: '15-Year Perpetual Trading Career',
} as const;

export const HORIZON_MONTHS = 180;
export const HARD_ASSET_TARGET = 1_500_000;

/* ------------------------------------------------------------------ */
/* Capital split                                                       */
/* ------------------------------------------------------------------ */

export const LIFESTYLE_PCT = 0.35;
/** Vault takes 35–40%; the treasury gets whatever is left of the remaining 65%. */
export const VAULT_PCT_RANGE = [0.35, 0.4] as const;

export type Bucket = 'lifestyle' | 'vault' | 'treasury';

export const BUCKETS: Record<Bucket, { label: string; short: string; blurb: string }> = {
  lifestyle: {
    label: 'Personal Lifestyle & Discretionary',
    short: 'Lifestyle',
    blurb: 'Cash to spend today, guilt-free.',
  },
  vault: {
    label: 'Milestone Vault',
    short: 'Vault',
    blurb: 'Funneled straight into cars and real estate.',
  },
  treasury: {
    label: 'Private Brokerage Treasury',
    short: 'Treasury',
    blurb: 'Compounding personal capital to kill prop-firm reliance.',
  },
};

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */

export type MilestoneId = 'mercedes' | 'dubai' | 'coupe' | 'residence';

export interface Milestone {
  id: MilestoneId;
  name: string;
  shortName: string;
  spec: string;
  target: number;
  range?: readonly [number, number];
  phase: PhaseId;
  window: string;
  icon: LucideIcon;
  /** Annual change in the asset's value once acquired (cars depreciate, property appreciates). */
  annualValueChange: number;
  rentalYield?: number;
}

export const MILESTONES: Milestone[] = [
  {
    id: 'mercedes',
    name: "Dad's Mercedes-Benz",
    shortName: 'Mercedes',
    spec: 'C-Class / E-Class · outright cash or down payment',
    target: 80_000,
    range: [75_000, 80_000],
    phase: 2,
    window: 'Month 16–18',
    icon: CarFront,
    annualValueChange: -0.12,
  },
  {
    id: 'dubai',
    name: 'Dubai Rental Unit (1BHK)',
    shortName: 'Dubai 1BHK',
    spec: 'JVC / Business Bay · cash down + DLD fees',
    target: 100_000,
    phase: 3,
    window: 'Months 25–60',
    icon: Building2,
    annualValueChange: 0.05,
    rentalYield: 1_600,
  },
  {
    id: 'coupe',
    name: 'Porsche 911 / BMW M4 Comp',
    shortName: '911 / M4',
    spec: '911 Carrera or M4 Competition · cash purchase',
    target: 180_000,
    range: [160_000, 190_000],
    phase: 3,
    window: 'Age 24',
    icon: Car,
    annualValueChange: -0.06,
  },
  {
    id: 'residence',
    name: 'Primary Luxury Residence',
    shortName: 'Residence',
    spec: 'Dubai / India · cash down payment',
    target: 500_000,
    range: [450_000, 500_000],
    phase: 4,
    window: 'Months 61–108',
    icon: House,
    annualValueChange: 0.04,
  },
];

export const milestoneById = (id: MilestoneId) => MILESTONES.find((m) => m.id === id)!;

/**
 * After the four trophies, the projection keeps buying Dubai rental units until
 * the portfolio reaches the Phase 5 target of four paid-off properties.
 */
export const EXPANSION_UNIT = {
  name: 'Dubai Rental Unit',
  cost: 150_000,
  rentalYield: 1_800,
  annualValueChange: 0.05,
  count: 3,
};

/* ------------------------------------------------------------------ */
/* Phases                                                              */
/* ------------------------------------------------------------------ */

export type PhaseId = 1 | 2 | 3 | 4 | 5;

export interface Phase {
  id: PhaseId;
  codename: string;
  title: string;
  window: string;
  ages: string;
  startMonth: number;
  endMonth: number;
  payout: { from: number; to: number };
  payoutLabel: string;
  capitalBase: string;
  summary: string;
  highlights: { label: string; value: string }[];
  objectives: { id: string; label: string; detail?: string }[];
  milestoneIds: MilestoneId[];
  split?: Record<Bucket, number>;
  note?: string;
}

/** Net monthly payouts for Months 1–6: the self-funded staircase. */
export const PHASE1_STAIRCASE = [0, 900, 3_150, 3_150, 6_750, 6_750];

export const PHASES: Phase[] = [
  {
    id: 1,
    codename: 'Seed Account Bootstrap',
    title: 'The Self-Funded Staircase',
    window: 'Months 1–6',
    ages: 'Age 19',
    startMonth: 1,
    endMonth: 6,
    payout: { from: 0, to: 6_750 },
    payoutLabel: '$0 → $6,750/mo',
    capitalBase: '1× → 5× Lucid 25k',
    summary: 'One eval funds the next two. Every payout buys more evals until a five-account fleet is printing on autopilot.',
    highlights: [
      { label: 'Net payouts', value: '$0 → $6,750/mo' },
      { label: 'Fleet', value: '1 → 5 accounts' },
      { label: 'Split', value: '35 / 40 / 25' },
    ],
    objectives: [
      { id: 'p1-eval', label: '1× Lucid 25k Eval', detail: 'Pass with rules intact · $0/mo' },
      { id: 'p1-payout', label: 'First payout', detail: '$900/mo net' },
      { id: 'p1-buy-1', label: 'Buy 2 evals → 3 accounts', detail: '$3,150/mo net' },
      { id: 'p1-fleet', label: 'Buy 2 evals → 5× fleet running', detail: '$6,750/mo net' },
    ],
    milestoneIds: [],
    split: { lifestyle: 0.35, vault: 0.4, treasury: 0.25 },
  },
  {
    id: 2,
    codename: 'Multi-Firm Scale',
    title: "Multi-Firm Scale & Dad's Mercedes",
    window: 'Months 7–24',
    ages: 'Ages 20–21',
    startMonth: 7,
    endMonth: 24,
    payout: { from: 12_000, to: 18_000 },
    payoutLabel: '$12K–$18K/mo',
    capitalBase: '3× $100k · tier-1 firms',
    summary: 'Graduate from 25k evals to three $100k accounts spread across tier-1 firms so no single firm can end the run.',
    highlights: [
      { label: 'Net payouts', value: '$12K–$18K/mo' },
      { label: 'Fleet', value: '3× $100k funded' },
      { label: 'Trigger', value: 'Mercedes · M16–18' },
    ],
    objectives: [
      { id: 'p2-fund', label: 'Fund 3× $100k accounts across tier-1 firms' },
      { id: 'p2-stable', label: 'Hold $12K–$18K/mo net for 3 straight months' },
      { id: 'p2-vault', label: 'Fill the Milestone Vault to $80K' },
      { id: 'p2-keys', label: 'Hand Dad the Mercedes keys', detail: 'C-Class / E-Class · Month 16–18' },
    ],
    milestoneIds: ['mercedes'],
  },
  {
    id: 3,
    codename: 'Asset Acquisition',
    title: 'Dubai Real Estate & Sports Coupe',
    window: 'Months 25–60',
    ages: 'Ages 22–24',
    startMonth: 25,
    endMonth: 60,
    payout: { from: 25_000, to: 35_000 },
    payoutLabel: '$25K–$35K/mo',
    capitalBase: 'Multi-firm prop fleet',
    summary: 'Payouts start buying assets that pay you back: a Dubai 1BHK throwing off rent, then the coupe — paid in cash.',
    highlights: [
      { label: 'Net payouts', value: '$25K–$35K/mo' },
      { label: 'Dubai 1BHK', value: '+$1,600/mo yield' },
      { label: 'Coupe', value: 'Age 24 · cash' },
    ],
    objectives: [
      { id: 'p3-scale', label: 'Scale to $25K–$35K/mo net payouts' },
      { id: 'p3-dubai', label: 'Close Dubai 1BHK (JVC / Business Bay)', detail: '~$100K cash outlay incl. DLD fees' },
      { id: 'p3-lease', label: 'Lease the unit', detail: '~$1,600/mo rental yield' },
      { id: 'p3-coupe', label: 'Buy Porsche 911 Carrera / BMW M4 Comp', detail: '$160K–$190K cash · Age 24' },
    ],
    milestoneIds: ['dubai', 'coupe'],
  },
  {
    id: 4,
    codename: 'Capital Independence',
    title: 'Primary Luxury Residence & Personal Capital',
    window: 'Months 61–108',
    ages: 'Ages 25–28',
    startMonth: 61,
    endMonth: 108,
    payout: { from: 40_000, to: 50_000 },
    payoutLabel: '$40K–$50K/mo',
    capitalBase: '$750K–$1.2M private capital',
    summary: '100% off prop firms. The treasury becomes the trading account, and the vault closes on the primary residence.',
    highlights: [
      { label: 'Net payouts', value: '$40K–$50K/mo' },
      { label: 'Capital', value: '$750K–$1.2M personal' },
      { label: 'Prop firms', value: '0 — fully independent' },
    ],
    objectives: [
      { id: 'p4-exit', label: 'Exit prop firms — trade private capital only' },
      { id: 'p4-balance', label: 'Grow personal balance to $750K–$1.2M' },
      { id: 'p4-payout', label: 'Sustain $40K–$50K/mo payouts' },
      { id: 'p4-home', label: 'Close the primary residence', detail: '$450K–$500K cash down · Dubai / India' },
    ],
    milestoneIds: ['residence'],
  },
  {
    id: 5,
    codename: 'Perpetual Wealth',
    title: 'Perpetual Wealth & Low-Leverage Fund',
    window: 'Years 11–15',
    ages: 'Ages 29–34',
    // Months 109–120 (Year 10) bridge Phase 4 into the fund era.
    startMonth: 109,
    endMonth: 180,
    payout: { from: 50_000, to: 70_000 },
    payoutLabel: '$50K–$70K/mo',
    capitalBase: '$2.5M+ liquid brokerage',
    summary: 'Low leverage, 2–3% a month on a $2.5M+ book, with paid-off Dubai rentals covering a big slice of the burn.',
    highlights: [
      { label: 'Returns', value: '2–3%/mo · $50K–$70K' },
      { label: 'Passive', value: '$6K–$9K/mo rent' },
      { label: 'Burn', value: '$25K/mo lifestyle' },
    ],
    objectives: [
      { id: 'p5-book', label: 'Hold $2.5M+ in the private brokerage' },
      { id: 'p5-returns', label: 'Compound 2–3% monthly on low leverage', detail: '$50K–$70K/mo' },
      { id: 'p5-rentals', label: 'Own 3–4 paid-off Dubai properties', detail: '$6K–$9K/mo passive flow' },
      { id: 'p5-burn', label: 'Cap lifestyle burn at $25K/mo' },
    ],
    milestoneIds: [],
    note: 'Year 10 (Months 109–120) is modeled as the bridge into this phase.',
  },
];

export const phaseById = (id: PhaseId) => PHASES.find((p) => p.id === id)!;

export function phaseForMonth(month: number): Phase {
  return PHASES.find((p) => month >= p.startMonth && month <= p.endMonth) ?? PHASES[PHASES.length - 1];
}

/* ------------------------------------------------------------------ */
/* Prop accounts                                                       */
/* ------------------------------------------------------------------ */

export interface AccountType {
  id: string;
  label: string;
  status: 'eval' | 'funded';
  /** Rough net payout per account per month, from the Phase 1–2 math. */
  estMonthly: number;
}

export const ACCOUNT_TYPES: AccountType[] = [
  { id: 'lucid-25k-eval', label: 'Lucid 25k Eval', status: 'eval', estMonthly: 0 },
  { id: 'lucid-25k-funded', label: 'Lucid 25k Funded', status: 'funded', estMonthly: 1_350 },
  { id: 'lucid-50k-funded', label: 'Lucid 50k Funded', status: 'funded', estMonthly: 2_500 },
  { id: 'tier1-100k-funded', label: 'Tier-1 $100k Funded', status: 'funded', estMonthly: 5_000 },
];

/* ------------------------------------------------------------------ */
/* Execution rules                                                     */
/* ------------------------------------------------------------------ */

export const RULES = {
  maxRiskPerTrade: 100,
  maxTrades: 2,
  dailyLock: 200,
  maxContracts: '2 Micros MNQ',
  ruleBreakDelayMonths: 3,
} as const;

export type GateId = 'setup' | 'stop' | 'mindset' | 'count' | 'acceptance';

export const GATE_QUESTIONS: { id: GateId; question: string; hint: string }[] = [
  {
    id: 'setup',
    question: 'Did price sweep liquidity into a valid IFVG / high-probability setup?',
    hint: 'No sweep, no IFVG, no trade.',
  },
  {
    id: 'stop',
    question: 'Is my stop loss mathematically defined?',
    hint: '$100 max risk · 2 Micros MNQ max.',
  },
  {
    id: 'mindset',
    question: 'Am I taking this trade out of patience — or boredom/greed?',
    hint: 'Be honest. Boredom trades are how funded accounts die.',
  },
  {
    id: 'count',
    question: 'Am I strictly within my 2-trade maximum daily limit?',
    hint: 'Trade #3 does not exist.',
  },
  {
    id: 'acceptance',
    question: 'Did I accept that a controlled loss is an A+ execution grade?',
    hint: 'The stop is the plan working, not failing.',
  },
];

export const RULE_BREAK_REASONS = [
  'Took a trade without the gatekeeper',
  'Risked more than $100',
  'Took a 3rd trade',
  'Moved or removed my stop',
  'Revenge / boredom entry',
];

export const DEFAULT_ANCHOR_MESSAGE = 'Breaking a rule today delays handing those car keys to Dad by 3 months.';

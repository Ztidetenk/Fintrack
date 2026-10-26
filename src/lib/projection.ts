import {
  EXPANSION_UNIT,
  HORIZON_MONTHS,
  LIFESTYLE_PCT,
  MILESTONES,
  PHASE1_STAIRCASE,
  PROFILE,
  phaseForMonth,
  type MilestoneId,
  type PhaseId,
} from '../data/roadmap';
import { addMonths, ageAt, parseISODate } from './format';

export type SimMode = 'custom' | 'plan';

export interface SimSettings {
  mode: SimMode;
  /** Monthly net payout used by the custom scenario and the split calculator. */
  monthlyPayout: number;
  /** Vault share of every payout (0.35–0.40). Treasury gets 0.65 − vaultPct. */
  vaultPct: number;
  /** Annual raise applied to the custom payout each plan year. */
  payoutGrowth: number;
  /** Annual return on the private brokerage treasury. */
  treasuryReturn: number;
}

export interface ProjectionPoint {
  month: number;
  date: Date;
  age: number;
  phase: PhaseId;
  payout: number;
  rental: number;
  treasury: number;
  vaultCash: number;
  assetValue: number;
  /** Acquired assets at today's value plus vault cash waiting to be deployed. */
  hardAssets: number;
  netWorth: number;
  lifestyleCum: number;
}

export interface Acquisition {
  key: string;
  milestoneId?: MilestoneId;
  name: string;
  cost: number;
  month: number;
  date: Date;
  age: number;
}

export interface Projection {
  points: ProjectionPoint[];
  yearly: ProjectionPoint[];
  acquisitions: Acquisition[];
  final: ProjectionPoint;
}

export const roadmapStart = parseISODate(PROFILE.roadmapStart);
export const birthDate = parseISODate(PROFILE.birthDate);

export const dateForMonth = (month: number) => addMonths(roadmapStart, month - 1);
export const ageForMonth = (month: number) => ageAt(birthDate, dateForMonth(month));

/** The roadmap's own payout curve: Phase 1 staircase, then a linear ramp across each phase's range. */
export function planPayout(month: number): number {
  if (month <= PHASE1_STAIRCASE.length) return PHASE1_STAIRCASE[month - 1];
  const p = phaseForMonth(month);
  const t = (month - p.startMonth) / Math.max(1, p.endMonth - p.startMonth);
  return Math.round(p.payout.from + (p.payout.to - p.payout.from) * t);
}

export function payoutForMonth(s: SimSettings, month: number): number {
  if (s.mode === 'plan') return planPayout(month);
  return s.monthlyPayout * Math.pow(1 + s.payoutGrowth, Math.floor((month - 1) / 12));
}

interface QueueItem {
  key: string;
  milestoneId?: MilestoneId;
  name: string;
  cost: number;
  annualValueChange: number;
  rentalYield: number;
}

const PURCHASE_QUEUE: QueueItem[] = [
  ...MILESTONES.map((m) => ({
    key: m.id,
    milestoneId: m.id,
    name: m.shortName,
    cost: m.target,
    annualValueChange: m.annualValueChange,
    rentalYield: m.rentalYield ?? 0,
  })),
  ...Array.from({ length: EXPANSION_UNIT.count }, (_, i) => ({
    key: `expansion-${i + 2}`,
    name: `${EXPANSION_UNIT.name} #${i + 2}`,
    cost: EXPANSION_UNIT.cost,
    annualValueChange: EXPANSION_UNIT.annualValueChange,
    rentalYield: EXPANSION_UNIT.rentalYield,
  })),
];

const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

/**
 * Month-by-month model of the treasury split. Each payout is cut into lifestyle / vault /
 * treasury; the treasury compounds; the vault buys the next milestone the moment it can
 * afford it; owned property pays rent into the treasury.
 */
export function runProjection(s: SimSettings, months = HORIZON_MONTHS): Projection {
  const vaultPct = s.vaultPct;
  const treasuryPct = 1 - LIFESTYLE_PCT - vaultPct;
  const treasuryGrowth = monthlyRate(s.treasuryReturn);

  const queue = [...PURCHASE_QUEUE];
  const owned: { value: number; rate: number; rental: number }[] = [];
  const acquisitions: Acquisition[] = [];
  const points: ProjectionPoint[] = [];

  let treasury = 0;
  let vault = 0;
  let lifestyleCum = 0;

  for (let month = 1; month <= months; month++) {
    const payout = payoutForMonth(s, month);
    const rental = owned.reduce((sum, a) => sum + a.rental, 0);

    lifestyleCum += payout * LIFESTYLE_PCT;
    vault += payout * vaultPct;
    treasury = treasury * (1 + treasuryGrowth) + payout * treasuryPct + rental;
    for (const a of owned) a.value *= 1 + a.rate;

    while (queue.length && vault >= queue[0].cost) {
      const item = queue.shift()!;
      vault -= item.cost;
      owned.push({ value: item.cost, rate: monthlyRate(item.annualValueChange), rental: item.rentalYield });
      acquisitions.push({
        key: item.key,
        milestoneId: item.milestoneId,
        name: item.name,
        cost: item.cost,
        month,
        date: dateForMonth(month),
        age: ageForMonth(month),
      });
    }

    const assetValue = owned.reduce((sum, a) => sum + a.value, 0);
    points.push({
      month,
      date: dateForMonth(month),
      age: ageForMonth(month),
      phase: phaseForMonth(month).id,
      payout,
      rental,
      treasury,
      vaultCash: vault,
      assetValue,
      hardAssets: assetValue + vault,
      netWorth: treasury + assetValue + vault,
      lifestyleCum,
    });
  }

  return {
    points,
    yearly: points.filter((p) => p.month % 12 === 0),
    acquisitions,
    final: points[points.length - 1],
  };
}

export function splitPayout(payout: number, vaultPct: number) {
  return {
    lifestyle: payout * LIFESTYLE_PCT,
    vault: payout * vaultPct,
    treasury: payout * (1 - LIFESTYLE_PCT - vaultPct),
  };
}

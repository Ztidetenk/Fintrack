import { MILESTONES, type Milestone, type MilestoneId } from '../data/roadmap';

export interface Deposit {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface AcquiredRecord {
  id: MilestoneId;
  date: string;
}

export type MilestoneStatus = 'acquired' | 'active' | 'locked';

export interface MilestoneProgress {
  milestone: Milestone;
  status: MilestoneStatus;
  funded: number;
  progress: number;
  remaining: number;
  acquiredOn?: string;
}

export interface VaultStatus {
  totalDeposited: number;
  /** Cash sitting in the vault after paying for acquired milestones. */
  available: number;
  hardAssetsAcquired: number;
  active?: MilestoneProgress;
  items: MilestoneProgress[];
  /** Cash beyond the active milestone's target that rolls into the next one. */
  overflow: number;
}

/**
 * Milestones unlock strictly in order: the vault funds the first un-acquired milestone,
 * and acquiring it spends its target from the vault balance.
 */
export function computeVault(deposits: Deposit[], acquired: AcquiredRecord[]): VaultStatus {
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
  const acquiredMap = new Map(acquired.map((a) => [a.id, a.date]));
  const hardAssetsAcquired = MILESTONES.filter((m) => acquiredMap.has(m.id)).reduce((s, m) => s + m.target, 0);
  const available = Math.max(0, totalDeposited - hardAssetsAcquired);

  let activeFound = false;
  const items: MilestoneProgress[] = MILESTONES.map((milestone) => {
    if (acquiredMap.has(milestone.id)) {
      return {
        milestone,
        status: 'acquired',
        funded: milestone.target,
        progress: 1,
        remaining: 0,
        acquiredOn: acquiredMap.get(milestone.id),
      };
    }
    if (!activeFound) {
      activeFound = true;
      const funded = Math.min(available, milestone.target);
      return {
        milestone,
        status: 'active',
        funded,
        progress: funded / milestone.target,
        remaining: milestone.target - funded,
      };
    }
    return { milestone, status: 'locked', funded: 0, progress: 0, remaining: milestone.target };
  });

  const active = items.find((i) => i.status === 'active');
  return {
    totalDeposited,
    available,
    hardAssetsAcquired,
    active,
    items,
    overflow: active ? Math.max(0, available - active.milestone.target) : available,
  };
}

import type { Bucket } from '../data/roadmap';

/**
 * Chart/series colors, validated as a set against the zinc-900 card surface
 * (lightness band, chroma floor, CVD separation, 3:1 contrast) — all pairs pass.
 * Emerald is kept for payouts/profit; UI accents (text, icons) use 300–500 steps.
 */
export const SERIES: Record<Bucket, string> = {
  lifestyle: '#8b5cf6',
  vault: '#d97706',
  treasury: '#0891b2',
};

/** Single-series payout charts. */
export const PAYOUT = '#059669';

/** Profit/loss polarity (journal). Validated as a pair; sign is also carried by position and text. */
export const PROFIT = '#059669';
export const LOSS = '#f43f5e';

export const CHART = {
  surface: '#18181b',
  grid: '#27272a',
  axis: '#3f3f46',
  tick: '#71717a',
  reference: '#a1a1aa',
};

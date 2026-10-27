const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdCompactFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});
const usdAxisFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const usd = (n: number) => usdFmt.format(Math.round(n));
export const usdCompact = (n: number) => (Math.abs(n) < 1_000 ? usd(n) : usdCompactFmt.format(n));
export const usdAxis = (n: number) => usdAxisFmt.format(n);
export const signedUsd = (n: number) => (n > 0 ? `+${usd(n)}` : n < 0 ? `−${usd(Math.abs(n))}` : usd(0));
/** Signed money that keeps cents when there are any (MNQ ticks are $0.50 per micro). */
export function signedMoney(n: number): string {
  const cents = Math.round(n * 100) / 100;
  const digits = Number.isInteger(cents) ? 0 : 2;
  const abs = Math.abs(cents).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return cents > 0 ? `+${abs}` : cents < 0 ? `−${abs}` : abs;
}

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

/** Parses YYYY-MM-DD as a local date (avoids the UTC shift of `new Date(str)`). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toDayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addMonths = (d: Date, months: number) => new Date(d.getFullYear(), d.getMonth() + months, 1);

export const monthsBetween = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

export function ageAt(birth: Date, at: Date): number {
  let age = at.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    at.getMonth() < birth.getMonth() || (at.getMonth() === birth.getMonth() && at.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function daysUntilNextBirthday(birth: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

export const monthYear = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
export const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

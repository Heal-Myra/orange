// Measure day (founder, 13 Nov 2026): on the 1st of each month a 1-minute waist and hip check with a soft tape, beside
// weight. Kept with the day (health.waistCm, health.hipsCm) and in the health vault. The card shows on the 1st to 3rd
// until measured, then compares with the last measure.

import type { DayLog } from './types';

export interface Measure { date: string; waist?: number; hips?: number; weight?: number }

/** The 1st to 3rd of a month, not measured yet this month. */
export function measureDue(days: Record<string, DayLog>, date: string) {
  const d = Number(date.slice(8, 10));
  if (d > 3) return false;
  const month = date.slice(0, 7);
  return !Object.keys(days).some(k => k.startsWith(month) && days[k]?.health?.waistCm != null);
}

/** The latest measure on or before a date (optionally strictly before). */
export function lastMeasure(days: Record<string, DayLog>, date: string, before = false): Measure | null {
  const k = Object.keys(days).filter(x => (before ? x < date : x <= date) && days[x]?.health?.waistCm != null).sort().pop();
  if (!k) return null;
  const h = days[k]!.health!;
  return { date: k, waist: h.waistCm, hips: h.hipsCm, weight: h.weightKg };
}

/** Myra's one line on the change (no medical claims; waist is the most useful number to watch). */
export function measureLine(now: Measure, was: Measure | null): [string, Record<string, number>?] {
  if (!was || now.waist == null || was.waist == null) return ['First measure saved. See you on the 1st.'];
  const d = Math.round((now.waist - was.waist) * 10) / 10;
  if (d <= -1) return ['Waist down {n} cm: keep it going.', { n: Math.abs(d) }];
  if (d >= 1) return ['Waist up {n} cm: more walks and fibre this month.', { n: d }];
  return ['Waist steady. Small habits are holding.'];
}

// Trends (founder, 22 Oct 2026): like Apple Health, every tab can show Day, Week, Month, Quarter or Year, so the
// direction of travel is easy to see. Calendar periods: a week starts on Monday; a quarter is Jan–Mar, Apr–Jun…
// Week and Month show one bar per day, Quarter one bar per week, Year one bar per month. Each bar is the average
// of the days that have data; days without data are left out (never counted as zero).

import { isoDate } from './dates';
import { bodyScore, mealTotals, mindScore, soulScore, wellBeing } from './scoring';
import type { DayLog, Profile } from './types';

export type Range = 'D' | 'W' | 'M' | 'Q' | 'Y';
export const RANGES: Range[] = ['D', 'W', 'M', 'Q', 'Y'];

export interface Bucket { start: string; end: string; label: string }
export interface Period { start: string; end: string; buckets: Bucket[]; range: Range }

const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The period that contains `anchor`, moved back by `offset` periods (0 = the current one). */
export function periodOf(range: Exclude<Range, 'D'>, anchor: string, offset = 0, monthNames?: string[], dayNames?: string[]): Period {
  const a = parse(anchor);
  const mon = monthNames ?? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const days = dayNames ?? ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  let start: Date, end: Date;
  if (range === 'W') {
    start = add(a, -((a.getDay() + 6) % 7) - 7 * offset); end = add(start, 6);
  } else if (range === 'M') {
    start = new Date(a.getFullYear(), a.getMonth() - offset, 1); end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  } else if (range === 'Q') {
    const q = Math.floor(a.getMonth() / 3) * 3;
    start = new Date(a.getFullYear(), q - 3 * offset, 1); end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  } else {
    start = new Date(a.getFullYear() - offset, 0, 1); end = new Date(start.getFullYear(), 11, 31);
  }
  const buckets: Bucket[] = [];
  if (range === 'W' || range === 'M') {
    for (let d = start, i = 0; d <= end; d = add(d, 1), i++) {
      buckets.push({ start: isoDate(d), end: isoDate(d), label: range === 'W' ? days[i] : String(d.getDate()) });
    }
  } else if (range === 'Q') {
    // Weeks (Monday start) that overlap the quarter, clipped to it.
    let w = add(start, -((start.getDay() + 6) % 7));
    while (w <= end) {
      const s = w < start ? start : w, e = add(w, 6) > end ? end : add(w, 6);
      buckets.push({ start: isoDate(s), end: isoDate(e), label: String(s.getDate()) });
      w = add(w, 7);
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const s = new Date(start.getFullYear(), m, 1), e = new Date(start.getFullYear(), m + 1, 0);
      buckets.push({ start: isoDate(s), end: isoDate(e), label: mon[m] });
    }
  }
  return { start: isoDate(start), end: isoDate(end), buckets, range };
}

/** Every day from start to end (inclusive). */
export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = parse(start); isoDate(d) <= end; d = add(d, 1)) out.push(isoDate(d));
  return out;
}

export type Pillar = 'today' | 'body' | 'mind' | 'soul';
export interface Metric {
  id: string;
  name: string;   // English; shown through tr()
  unit: string;   // English; shown through tr()
  pillar: Pillar;
  value: (d: DayLog, P: Profile) => number | null; // null = no data that day
  days?: boolean; // count the days it happened instead of averaging (e.g. learning days)
  better?: 'up' | 'down';   // which way is good (none = just show the direction)
  target?: (P: Profile) => number | undefined;
  decimals?: number;
}

const num = (v: number | undefined | null) => (v == null || Number.isNaN(v) ? null : v);
const ate = (d: DayLog) => d.meals.length > 0;

export const METRICS: Metric[] = [
  { id: 'wellbeing', name: 'Well-being', unit: 'of 300', pillar: 'today', better: 'up', value: (d, P) => { const w = wellBeing(d, P); return w.logged ? w.total : null; } },
  { id: 'bodyScore', name: 'Body', unit: 'of 100', pillar: 'today', better: 'up', value: (d, P) => num(bodyScore(d, P)?.total) },
  { id: 'mindScore', name: 'Mind', unit: 'of 100', pillar: 'today', better: 'up', value: (d, P) => num(mindScore(d, P)?.total) },
  { id: 'soulScore', name: 'Soul', unit: 'of 100', pillar: 'today', better: 'up', value: (d, P) => num(soulScore(d, P)?.total) },

  { id: 'body', name: 'Body score', unit: 'of 100', pillar: 'body', better: 'up', value: (d, P) => num(bodyScore(d, P)?.total) },
  { id: 'kcal', name: 'Calories', unit: 'kcal', pillar: 'body', target: P => P.kcal, value: d => (ate(d) ? mealTotals(d.meals).kcal : d.fasting ? 0 : null) },
  { id: 'protein', name: 'Protein', unit: 'g', pillar: 'body', better: 'up', target: P => P.protein, value: d => (ate(d) ? mealTotals(d.meals).p : null) },
  { id: 'fibre', name: 'Fibre', unit: 'g', pillar: 'body', better: 'up', value: d => (ate(d) ? mealTotals(d.meals).fib : null) },
  { id: 'steps', name: 'Steps', unit: 'steps', pillar: 'body', better: 'up', target: P => P.steps, value: d => num(d.activity.steps) },
  { id: 'active', name: 'Active minutes', unit: 'min', pillar: 'body', better: 'up', target: P => P.active, value: d => num(d.activity.activeMin) },
  { id: 'sleep', name: 'Sleep', unit: 'hours', pillar: 'body', decimals: 1, target: () => 7.5, value: d => num(d.sleep.hours) },
  { id: 'weight', name: 'Weight', unit: 'kg', pillar: 'body', decimals: 1, value: d => num(d.health?.weightKg) },
  { id: 'restingHr', name: 'Resting heart rate', unit: 'bpm', pillar: 'body', better: 'down', value: d => num(d.health?.restingHr) },

  { id: 'mind', name: 'Mind score', unit: 'of 100', pillar: 'mind', better: 'up', value: (d, P) => num(mindScore(d, P)?.total) },
  { id: 'focus', name: 'Focus to-dos done', unit: 'per day', decimals: 1, pillar: 'mind', better: 'up', value: d => num(d.mind.focusDone) },
  { id: 'social', name: 'Social media', unit: 'min', pillar: 'mind', better: 'down', target: P => P.mediaLimit, value: d => (d.noMedia ? 0 : d.media.length ? d.media.reduce((s, x) => s + (x.minutes || 0), 0) : null) },
  { id: 'learning', name: 'Days with learning', unit: 'days', pillar: 'mind', better: 'up', days: true, value: d => ((d.mind.learned?.text ?? '').trim().length >= 3 ? 1 : null) },

  { id: 'soul', name: 'Soul score', unit: 'of 100', pillar: 'soul', better: 'up', value: (d, P) => num(soulScore(d, P)?.total) },
  { id: 'meditation', name: 'Meditation', unit: 'min', pillar: 'soul', better: 'up', target: P => P.meditation, value: d => num(d.mind.meditationMin) },
  { id: 'gratitude', name: 'Gratitudes', unit: 'per day', pillar: 'soul', better: 'up', target: () => 4, value: d => { const n = (d.soul?.gratitude ?? []).filter(g => g.trim()).length; return n || null; } },
  { id: 'wisdom', name: 'Days with Daily Wisdom', unit: 'days', pillar: 'soul', better: 'up', days: true, value: d => (d.soul?.verseStudied ? 1 : null) },
];

export interface Trend {
  bars: (number | null)[];  // one per bucket
  value: number | null;     // the period's average (or number of days, for "days" metrics)
  previous: number | null;  // the same for the period before
  change: number | null;    // value - previous
  daysWithData: number;
}

function summarise(m: Metric, days: Record<string, DayLog>, P: Profile, start: string, end: string, today: string) {
  const vals: number[] = [];
  for (const iso of daysBetween(start, end > today ? today : end)) {
    const d = days[iso]; if (!d) continue;
    const v = m.value(d, P); if (v != null) vals.push(v);
  }
  if (!vals.length) return { value: null as number | null, n: 0 };
  return { value: m.days ? vals.length : vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
}

export function trendOf(m: Metric, days: Record<string, DayLog>, P: Profile, range: Exclude<Range, 'D'>, anchor: string, offset: number, today: string): Trend {
  const p = periodOf(range, anchor, offset), prev = periodOf(range, anchor, offset + 1);
  const bars = p.buckets.map(b => {
    if (b.start > today) return null;
    return summarise(m, days, P, b.start, b.end, today).value;
  });
  const cur = summarise(m, days, P, p.start, p.end, today), before = summarise(m, days, P, prev.start, prev.end, today);
  return { bars, value: cur.value, previous: before.value, change: cur.value != null && before.value != null ? cur.value - before.value : null, daysWithData: cur.n };
}

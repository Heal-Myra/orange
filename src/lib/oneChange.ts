// The 30-day one-change test (founder, 10 Nov 2026): one change for 30 days, one tap a day, and on day 30 Myra shows what
// moved, comparing the 14 days before the start with the last 14 days of the test. Only the person's own data.

import { bodyScore, wellBeing } from './scoring';
import type { DayLog, Profile } from './types';

export const IDEAS = ['No sugar after 7 pm', 'Dinner by 8 pm', '15-minute walk after dinner', 'No phone in bed', '10 minutes of meditation a day', 'No packaged snacks'];
export const LENGTH = 30;

const shift = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(y, m - 1, d + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const between = (a: string, b: string) => { const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000); };

/** Day 1 is the start day. */
export const dayOf = (start: string, today: string) => between(start, today) + 1;

/** The 30 days with their answers: 'yes', 'no' or null (not answered / still to come). */
export function grid(days: Record<string, DayLog>, start: string) {
  return Array.from({ length: LENGTH }, (_, i) => days[shift(start, i)]?.oneChange ?? null);
}

const MOOD: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, unwell: 1 };
const avg = (xs: (number | null | undefined)[]) => { const v = xs.filter((x): x is number => typeof x === 'number'); return v.length >= 3 ? v.reduce((s, x) => s + x, 0) / v.length : null; };

/** Before (14 days before the start) and after (days 17–30): sleep hours, Body score, My day, mood (1–5). */
export function result(days: Record<string, DayLog>, start: string, P: Profile) {
  const span = (from: number, n: number) => Array.from({ length: n }, (_, i) => days[shift(start, from + i)]).filter(Boolean) as DayLog[];
  const before = span(-14, 14), after = span(LENGTH - 14, 14);
  const m = (list: DayLog[]) => ({
    sleep: avg(list.map(d => d.sleep?.hours)),
    body: avg(list.map(d => bodyScore(d, P)?.total)),
    day: avg(list.map(d => { const w = wellBeing(d, P); return w.logged ? w.total : null; })),
    mood: avg(list.map(d => (d.feeling ? MOOD[d.feeling.mood] : null))),
  });
  const g = grid(days, start);
  return { before: m(before), after: m(after), kept: g.filter(x => x === 'yes').length, answered: g.filter(Boolean).length };
}

// Personal-best ladder (founder, 16 Nov 2026; idea 1 of 16 Nov): every master keeps a ladder for each best. The best is
// the rung you stand on; the next rung is one small step up (never a leap; docs/agents.md "One step up at a time").

import type { Run } from './health';
import type { Rec } from './records';

export interface Rung { value: number; at?: string } // at: when it was reached
export interface RunLadder { k: number; best: number; bestAt: string; reached: Rung[]; next: number; later: number[]; pace: number }

/** The next time to beat: a round, easy-to-remember mark (founder, 18 Nov 2026), the half-minute just below the best
 *  (27:23 → 27:00, 27:00 → 26:30). */
export function nextTime(t: number): number {
  return Math.ceil(t / 30) * 30 - 30;
}

/** The fastest-k-km ladder from every run at least k km long: the bests in the order they were reached. */
export function runLadder(runs: Run[], k: number): RunLadder | null {
  const qual = [...runs].filter(r => r.km >= k * 0.99).sort((a, b) => a.at.localeCompare(b.at)).map(r => ({ at: r.at, t: (r.secs / r.km) * k }));
  if (!qual.length) return null;
  const reached: Rung[] = [];
  for (const q of qual) if (!reached.length || q.t < reached[reached.length - 1].value) reached.push({ value: q.t, at: q.at });
  const top = reached[reached.length - 1];
  const next = nextTime(top.value), later = [nextTime(next), nextTime(nextTime(next))];
  return { k, best: top.value, bestAt: top.at!, reached: reached.slice(-3).reverse(), next, later, pace: next / k };
}

/** Round numbers people remember (founder, 18 Nov 2026: "1 lakh kadam week", not 96,000). */
const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 8, 9, 10];

/** The first round number above a best: 90,553 steps → 1,00,000; 15,230 → 20,000; a streak of 8 days → 10. */
export function nextValue(r: Pick<Rec, 'kind' | 'value'>): number {
  const v = r.value;
  if (v <= 0) return 1;
  if (v < 10) return Math.floor(v) + 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const n of NICE) { const x = Math.round(n * mag); if (x > v) return x; }
  return 10 * mag;
}

/** "1 lakh", "1.5 lakh" for big round numbers, as people in India say them; else the usual format. */
export function lakhs(v: number, fmt: (n: number) => string, word = 'lakh'): string {
  return v >= 100000 && v % 50000 === 0 ? `${v / 100000} ${word}` : fmt(v);
}

/** The next rung for a record as text: a faster time for a running best, else a little more. */
export function nextFor(r: Rec, lakhWord = 'lakh'): string {
  if (r.key === 'run5' || r.key === 'run10') return r.def.fmt(nextTime(r.value));
  if (r.key === 'runLong') return r.def.fmt(Math.floor(r.value) + 1);
  return r.kind === 'streak' ? String(nextValue(r)) : lakhs(nextValue(r), r.def.fmt, lakhWord);
}

/** The most recent records worth climbing, one per measure, newest first (at most n). */
export function ladderPicks(recs: Rec[], n = 4): Rec[] {
  const seen = new Set<string>(), out: Rec[] = [];
  for (const r of [...recs].sort((a, b) => b.end.localeCompare(a.end))) {
    if (r.key.startsWith('run') || seen.has(r.def.id)) continue;
    if (r.kind !== 'day' && r.kind !== 'streak') continue;
    seen.add(r.def.id); out.push(r);
    if (out.length >= n) break;
  }
  return out;
}

/** "5:24" per km. */
export const paceText = (secsPerKm: number) => `${Math.floor(secsPerKm / 60)}:${String(Math.round(secsPerKm % 60)).padStart(2, '0')}`;

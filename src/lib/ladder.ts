// Personal-best ladder (founder, 16 Nov 2026; idea 1 of 16 Nov): every master keeps a ladder for each best. The best is
// the rung you stand on; the next rung is one small step up (never a leap; docs/agents.md "One step up at a time").

import type { Run } from './health';
import type { Rec } from './records';

export interface Rung { value: number; at?: string } // at: when it was reached
export interface RunLadder { k: number; best: number; bestAt: string; reached: Rung[]; next: number; later: number[]; pace: number }

/** A small step down in time: about 1.5%, at least 10 seconds, on a 10-second mark. */
export function nextTime(t: number): number {
  const step = Math.max(10, t * 0.015);
  return Math.floor((t - step) / 10) * 10;
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

/** A round number a little above a best (about 5%), or for a streak a few more days. */
export function nextValue(r: Pick<Rec, 'kind' | 'value'>): number {
  const v = r.value;
  if (r.kind === 'streak') return v + Math.max(1, Math.round(v * 0.2));
  if (v <= 0) return 1;
  if (v < 20) return Math.floor(v) + 1;
  const step = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  return Math.ceil((v * 1.05) / step) * step;
}

/** The next rung for a record as text: a faster time for a running best, else a little more. */
export function nextFor(r: Rec): string {
  if (r.key === 'run5' || r.key === 'run10') return r.def.fmt(nextTime(r.value));
  if (r.key === 'runLong') return r.def.fmt(Math.floor(r.value) + 1);
  return r.kind === 'streak' ? String(nextValue(r)) : r.def.fmt(nextValue(r));
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

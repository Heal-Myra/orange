// Running bests in Top of My Game (founder, 11 Nov 2026: the Apple Watch showed "fastest 5 km" but Happy Orange did
// not). From every run in Apple Health: fastest 5 km and 10 km (at the run's average pace, for runs at least that
// long) and the longest run. A best counts once there is an earlier run to beat; NEW for 7 days.

import { shiftISO } from './dates';
import type { Run } from './health';
import type { Rec, RecDef } from './records';

export const clock = (secs: number) => {
  const s = Math.round(secs), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
};
const def = (id: string, icon: string, fmt: (n: number) => string): RecDef =>
  ({ id, icon, color: '#9CC08E', agg: 'sum', titles: {}, value: () => null, fmt });

export function runRecords(runs: Run[], today: string): Rec[] {
  const out: Rec[] = [];
  const sorted = [...runs].sort((a, b) => a.at.localeCompare(b.at));
  const fresh = (at: string) => at >= shiftISO(today, -6);
  for (const k of [5, 10]) {
    const qual = sorted.filter(r => r.km >= k * 0.99).map(r => ({ at: r.at, t: (r.secs / r.km) * k }));
    if (qual.length < 2) continue;
    const best = qual.reduce((a, b) => (b.t < a.t ? b : a));
    const earlier = qual.filter(q => q.at < best.at || (q.at === best.at && q !== best));
    const beat = earlier.length ? Math.min(...earlier.map(q => q.t)) : null;
    out.push({ key: `run${k}`, def: def(`run${k}`, 'stopwatch-outline', clock), kind: 'day', title: `Fastest ${k} km run`, value: best.t,
      text: clock(best.t), start: best.at, end: best.at, beat, isNew: beat != null && fresh(best.at) });
  }
  if (sorted.length >= 3) {
    const best = sorted.reduce((a, b) => (b.km > a.km ? b : a));
    const earlier = sorted.filter(r => r !== best && r.at <= best.at);
    const beat = earlier.length ? Math.max(...earlier.map(r => r.km)) : null;
    const km = (n: number) => `${Math.round(n * 100) / 100} km`;
    out.push({ key: 'runLong', def: def('runLong', 'trail-sign-outline', km), kind: 'day', title: 'Longest run', value: best.km,
      text: km(best.km), start: best.at, end: best.at, beat, isNew: beat != null && fresh(best.at) });
  }
  return out;
}

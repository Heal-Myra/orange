// Running cadence coach (founder, 16 Nov 2026; idea 4): steps a minute in each run, from the Watch's own step count
// during the run. Most easy, comfortable running sits around 165-180; a little quicker, shorter step is the one tip.
// No medical claims: the reason given is comfort and a softer landing.

import type { Run } from './health';
import { shiftISO } from './dates';

export const EASY_LOW = 165, EASY_HIGH = 180;

export const cadenceOf = (r: Run) => (r.steps && r.secs > 0 ? Math.round(r.steps / (r.secs / 60)) : null);

/** After a run in the last 3 days: its cadence, the last few, and one line from the coach. */
export function cadenceCoach(runs: Run[], today: string): null | { at: string; km: number; secs: number; cadence: number; last: number[]; aim: number | null; line: [string, Record<string, number>?] } {
  const withC = [...runs].map(r => ({ r, c: cadenceOf(r) })).filter((x): x is { r: Run; c: number } => x.c != null && x.c > 100 && x.c < 230)
    .sort((a, b) => a.r.at.localeCompare(b.r.at));
  const latest = withC[withC.length - 1];
  if (!latest || latest.r.at < shiftISO(today, -2)) return null;
  const c = latest.c;
  const last = withC.slice(-4).map(x => x.c);
  const aim = c < EASY_LOW ? Math.min(c + 5, EASY_LOW + 5) : null;
  const line: [string, Record<string, number>?] = aim != null ? ['Shorter, quicker steps: aim for {n} next run.', { n: aim }]
    : c > EASY_HIGH ? ['Quick feet. Keep the steps relaxed.'] : ['Cadence in the easy range. Keep it light.'];
  return { at: latest.r.at, km: latest.r.km, secs: latest.r.secs, cadence: c, last, aim, line };
}

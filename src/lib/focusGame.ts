// Focus check (founder, 16 Nov 2026; idea 6): a 2-minute game once a week. Lights appear one at a time; tap only the
// orange ones, let the grey ones pass. The monk tracks the score month by month. Kept in me.focus.

export const FOCUS_SECS = 120;
export const SHOW_MS = 900; // how long a light stays
export interface FocusResult { date: string; score: number }

/** The round: about 75 lights, a third orange, at random places (seeded so a test can repeat it). */
export function makeRound(seed = Date.now()) {
  let x = seed % 2147483647 || 1;
  const rnd = () => (x = (x * 48271) % 2147483647) / 2147483647;
  const out: { at: number; orange: boolean; left: number; top: number }[] = [];
  let t = 1200;
  while (t < FOCUS_SECS * 1000 - 1000) {
    out.push({ at: t, orange: rnd() < 0.33, left: 0.1 + rnd() * 0.7, top: 0.1 + rnd() * 0.7 });
    t += 1200 + rnd() * 700;
  }
  return out;
}

/** 0-100: catching orange lights counts most, holding back on grey ones a little less, quick taps a little extra. */
export function focusScore(oranges: number, hits: number, greys: number, falseTaps: number, avgMs: number | null): number {
  if (!oranges || !greys) return 0;
  const catchRate = hits / oranges, holdRate = Math.max(0, greys - falseTaps) / greys;
  const speed = avgMs == null ? 0 : Math.max(0, Math.min(1, (SHOW_MS - avgMs) / (SHOW_MS - 300)));
  return Math.round(100 * (0.55 * catchRate + 0.35 * holdRate + 0.1 * speed));
}

/** Due once a week: nothing in the last 7 days. */
export const focusDue = (all: FocusResult[] | undefined, today: string) => !(all ?? []).some(r => daysBetween(r.date, today) < 7);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** The monk's line, through Myra. */
export function focusLine(all: FocusResult[]): [string, Record<string, number>?] {
  const s = [...all].sort((a, b) => a.date.localeCompare(b.date));
  const now = s[s.length - 1], before = s.slice(0, -1);
  if (!now) return ['Two minutes, once a week. See your focus grow.'];
  if (!before.length) return ['First focus check done. Same time next week.'];
  const best = Math.max(...before.map(r => r.score)), last = before[before.length - 1].score;
  if (now.score > best) return ['New best focus. The sitting shows.'];
  if (now.score > last) return ['Focus up {n}. Keep sitting.', { n: now.score - last }];
  return ['A dip this week. Sleep and sitting bring it back.'];
}

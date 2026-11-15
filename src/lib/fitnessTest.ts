// Monthly fitness test (founder, 16 Nov 2026; idea 5): four simple home tests on the 1st, beside Measure day. Beat your
// own best, never anyone else's. Kept with About you (me.fitness) so it syncs.

export type TestId = 'pushups' | 'plank' | 'sitStand' | 'reach';
export interface FitnessResult { date: string; pushups?: number; plank?: number; sitStand?: number; reach?: number } // plank in seconds, reach in cm (+ beyond the toes)

export const TESTS: { id: TestId; name: string; how: string; unit: 'count' | 'secs' | 'cm'; timer?: 'stopwatch' | 30 }[] = [
  { id: 'pushups', name: 'Push-ups', how: 'As many as you can with good form. Knees down is fine; keep to the same way each month.', unit: 'count' },
  { id: 'plank', name: 'Plank', how: 'On forearms, body in a straight line. Stop when the hips drop.', unit: 'secs', timer: 'stopwatch' },
  { id: 'sitStand', name: 'Sit-to-stand in 30 s', how: 'From a chair, arms crossed: stand up fully and sit, as many times as you can in 30 seconds.', unit: 'count', timer: 30 },
  { id: 'reach', name: 'Sit and reach', how: 'Sit with legs straight, reach for your toes. Centimetres past the toes (minus if short of them).', unit: 'cm' },
];

/** The 1st to 3rd of the month, not taken yet this month. */
export function testDue(all: FitnessResult[] | undefined, today: string) {
  if (Number(today.slice(8, 10)) > 3) return false;
  return !(all ?? []).some(r => r.date.slice(0, 7) === today.slice(0, 7));
}

/** The best so far for one test, before a date (higher is better for every test). */
export function bestBefore(all: FitnessResult[] | undefined, id: TestId, date: string): number | undefined {
  const v = (all ?? []).filter(r => r.date < date).map(r => r[id]).filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : undefined;
}

/** The latest result, the one before it, and which tests are new bests. */
export function lastTwo(all: FitnessResult[] | undefined) {
  const s = [...(all ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const now = s[s.length - 1], was = s[s.length - 2];
  const bests = now ? TESTS.filter(t => now[t.id] != null && (bestBefore(s, t.id, now.date) ?? -Infinity) < now[t.id]! && bestBefore(s, t.id, now.date) != null).map(t => t.id) : [];
  return { now, was, bests };
}

export function fitnessLine(bests: number, first: boolean): [string, Record<string, number>?] {
  if (first) return ['First test saved. Beat it next month.'];
  if (bests >= 2) return ['{n} new bests this month. Strong work.', { n: bests }];
  if (bests === 1) return ['One new best this month. Keep climbing.'];
  return ['Held steady. Small steps, then a new best.'];
}

export const fmtResult = (id: TestId, v: number | undefined) => v == null ? '–'
  : id === 'plank' ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}` : id === 'reach' ? `${v > 0 ? '+' : ''}${v} cm` : String(v);

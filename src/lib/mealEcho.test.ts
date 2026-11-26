import { describe, expect, it } from 'vitest';
import { shiftISO } from './dates';
import { afterMeal, levelOf, mealsOf, patterns } from './mealEcho';
import { emptyDay, type DayLog, type Meal } from './types';

const T = '2026-12-30'; // after SLEEP_V2_FROM, so every night in the four weeks has a sleep score
const at = (iso: string, h: number, m = 0) => { const [y, mo, d] = iso.split('-').map(Number); return new Date(y, mo - 1, d, h, m).toISOString(); };
const meal = (iso: string, h: number, kcal = 500, name = 'Dal rice'): Meal => ({ name, kcal, p: 10, c: 60, f: 10, source: 'photo', at: at(iso, h) });
const flat = (v: number) => Array(96).fill(v) as (number | null)[];
function days(n: number, f: (iso: string, k: number) => Partial<DayLog>) {
  const out: Record<string, DayLog> = {};
  for (let k = 0; k <= n; k++) { const iso = shiftISO(T, -k); out[iso] = { ...emptyDay(iso), ...f(iso, k) } as DayLog; }
  return out;
}

describe('Food and your body (26 Nov 2026)', () => {
  it('groups items logged together into one meal', () => {
    const d = { ...emptyDay(T), meals: [meal(T, 13, 300, 'Dal'), meal(T, 13, 200, 'Rice'), meal(T, 21, 900, 'Biryani')] } as DayLog;
    const m = mealsOf(d);
    expect(m.map(x => x.name)).toEqual(['Dal, Rice', 'Biryani']);
    expect(m[0].kcal).toBe(500); expect(m[1].slot).toBe(84);
  });
  it('compares the three hours after a meal with the usual, and that night with usual deep sleep', () => {
    const ds = days(15, (iso, k) => ({ health: { hr15: flat(k === 0 ? 70 : 64), steps15: Array(96).fill(0), sleepStages: { deep: 1.2 } } }));
    const next = shiftISO(T, 1);
    ds[next] = { ...emptyDay(next), health: { sleepStages: { deep: 0.9 }, hr15: flat(70), steps15: Array(96).fill(0) } } as DayLog;
    ds[T].meals = [meal(T, 21)];
    const r = afterMeal(ds, T, mealsOf(ds[T])[0]);
    expect(r.hrDelta).toBe(6); expect(r.dinner).toBe(true);
    expect(r.deepMin).toBe(54); expect(r.deepUsualMin).toBe(72);
  });
  it('says nothing without enough usual days', () => {
    const ds = days(2, () => ({ health: { hr15: flat(64), steps15: Array(96).fill(0) } }));
    ds[T].meals = [meal(T, 13)];
    expect(afterMeal(ds, T, mealsOf(ds[T])[0]).hrDelta).toBeNull();
  });
  it('tells the dinner-time pattern only with enough days on each side', () => {
    const det = (score: boolean) => ({ sleepStages: { deep: score ? 1.5 : 0.6, rem: 1.5, awake: 0.2 }, sleepDetail: { wakeUps: 1, latencyMin: 12 } });
    const ds = days(30, (iso, k) => {
      const early = k % 2 === 0;
      return { meals: [meal(iso, early ? 19 : 22)], sleep: { hours: 7.5, source: 'Apple Health' } as DayLog['sleep'], health: det(k % 2 === 1) };
    });
    const p = patterns(ds, T);
    expect(p.find(x => x.id === 'dinnerTime')?.better).toBe('early');
    expect(patterns(days(3, () => ({})), T)).toEqual([]);
  });
  it('reads heart rate against the resting rate', () => {
    expect([60, 72, 90, 110].map(h => levelOf(h, 58))).toEqual([0, 1, 2, 3]);
  });
});

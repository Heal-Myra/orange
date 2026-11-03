import { describe, expect, it } from 'vitest';
import { detectFast, fastHabit, fastHoursOf, fmtHours } from './fasting';
import { bodyScore } from './scoring';
import { DEFAULT_PROFILE, emptyDay } from './types';
import type { AboutMe } from './targets';

const me = (extra: Partial<AboutMe>): AboutMe => ({ weightKg: 70, heightCm: 170, sex: 'male', age: 40, goal: 'keep', setAt: '2026-10-01', ...extra });
const P = (m?: AboutMe) => ({ ...DEFAULT_PROFILE, me: m });

describe('fasting by choice (1 Nov 2026)', () => {
  it('reads the habit from the person\'s own words', () => {
    expect(detectFast('I do intermittent fasting for 18 hours, eat at night and skip breakfast')).toEqual({ hours: 18, lastMeal: '21:00' });
    expect(detectFast('16:8 most days')?.hours).toBe(16);
    expect(detectFast('I skip breakfast')?.hours).toBe(16);
    expect(detectFast('Office at 9, gym at 7')).toBeNull();
    expect(fastHabit(me({ fast: { hours: 18, lastMeal: '21:00', off: true }, dayText: 'intermittent fasting' }))).toBeNull();
  });

  it('counts the hours from last night\'s meal until now while nothing is eaten', () => {
    const d = emptyDay('2026-11-02');
    const f = fastHoursOf(d, { hours: 18, lastMeal: '21:00' }, new Date(2026, 10, 2, 9, 30));
    expect(f.hours).toBeCloseTo(12.5);
    expect(f.ongoing).toBe(true);
  });

  it('scores the fast: 16 points at the target, meals worth 24', () => {
    const p = P(me({ fast: { hours: 18, lastMeal: '21:00' } }));
    const morning = emptyDay('2026-11-02');
    expect(bodyScore(morning, p, new Date(2026, 10, 2, 9, 30))!.nutrition).toBeCloseTo(16 * 12.5 / 18);
    const day = emptyDay('2026-11-02');
    day.meals = [{ name: 'Lunch', kcal: 0, p: 0, c: 0, f: 0, source: 'manual', at: new Date(2026, 10, 2, 15, 0).toISOString() }];
    expect(bodyScore(day, p, new Date(2026, 10, 2, 22, 0))!.nutrition).toBeGreaterThanOrEqual(16); // 18 h kept
  });

  it('leaves people who do not fast, and days before 1 Nov, as they were', () => {
    expect(bodyScore(emptyDay('2026-11-02'), P(me({})), new Date(2026, 10, 2, 9, 0))).toBeNull();
    expect(bodyScore(emptyDay('2026-10-30'), P(me({ fast: { hours: 18, lastMeal: '21:00' } })))).toBeNull();
  });

  it('writes half hours nicely', () => {
    expect(fmtHours(12.4)).toBe('12½');
    expect(fmtHours(18)).toBe('18');
  });
});

describe('Food from 3 Nov 2026: fasting 8 + dinner time 8 + meals 24 − up to 4', () => {
  const aims = { carb: 0.5, fat: 0.25 };
  it('fasting counts for everyone (14 h unless they fast longer) and dinner 3 h before sleep earns full', async () => {
    const { foodV3 } = await import('./fasting');
    const d = emptyDay('2026-11-04');
    d.fastFrom = new Date(2026, 10, 3, 19, 0).toISOString();       // dinner at 7 pm
    d.sleep = { bedAt: new Date(2026, 10, 3, 22, 30).toISOString() }; // asleep 10:30 pm: 3½ h later
    const r = foodV3(d, undefined, null, null, aims, new Date(2026, 10, 4, 9, 0)); // 14 h fasted by 9 am
    expect(r.fasting).toBeCloseTo(8);
    expect(r.dinner).toBeCloseTo(8);
    expect(r.total).toBeCloseTo(16);
  });
  it('a late dinner earns less: 2 h before sleep is half, 1 h is nothing', async () => {
    const { foodV3 } = await import('./fasting');
    const d = emptyDay('2026-11-04');
    d.fastFrom = new Date(2026, 10, 3, 21, 0).toISOString();
    d.sleep = { bedAt: new Date(2026, 10, 3, 23, 0).toISOString() };
    expect(foodV3(d, undefined, null, null, aims, new Date(2026, 10, 4, 8, 0)).dinner).toBeCloseTo(4);
  });
  it('meals are worth 24 and too many carb or fat calories cost up to 4, graded', async () => {
    const { foodV3 } = await import('./fasting');
    const d = emptyDay('2026-11-04');
    const small = foodV3(d, undefined, 40, { carb: 0.53, fat: 0.25 }, aims);  // 3 points over on carbs
    const big = foodV3(d, undefined, 40, { carb: 0.70, fat: 0.40 }, aims);    // far over on both
    expect(small.meals).toBeCloseTo(24);
    expect(small.penalty).toBeCloseTo(0.8);
    expect(big.penalty).toBe(4);
  });
});

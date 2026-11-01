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

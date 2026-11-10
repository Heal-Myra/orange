import { describe, expect, it } from 'vitest';
import { missedNow } from './missedMeal';
import { eatsNonVeg, picks, showTopUp } from './proteinTopUp';
import { dayOf, grid } from './oneChange';
import type { DayLog, Meal } from './types';

const at = (h: number) => { const d = new Date(2026, 10, 10, h, 0); return d.toISOString(); };
const meal = (h: number, p = 10): Meal => ({ name: 'x', kcal: 300, p, c: 30, f: 10, source: 'manual', at: at(h) });
const day = (meals: Meal[], extra: Partial<DayLog> = {}) => ({ date: '2026-11-10', meals, ...extra } as DayLog);

describe('missed-meal nudge', () => {
  it('asks about lunch from 2 pm and dinner from 9:30 pm', () => {
    expect(missedNow(day([meal(9)]), new Date(2026, 10, 10, 13, 0))).toBeNull();
    expect(missedNow(day([meal(9)]), new Date(2026, 10, 10, 14, 5))).toBe('lunch');
    expect(missedNow(day([meal(13)]), new Date(2026, 10, 10, 21, 45))).toBe('dinner');
  });
  it('stays quiet when skipped, logged or fasting', () => {
    expect(missedNow(day([], { skipped: ['lunch'] }), new Date(2026, 10, 10, 15, 0))).toBeNull();
    expect(missedNow(day([meal(13)]), new Date(2026, 10, 10, 15, 0))).toBeNull();
    expect(missedNow(day([], { fasting: true }), new Date(2026, 10, 10, 22, 0))).toBeNull();
  });
});

describe('protein top-up', () => {
  it('shows after 6 pm when protein is below 80 % of the aim', () => {
    expect(showTopUp([meal(13, 30)], 60, false, new Date(2026, 10, 10, 18, 30))).toBe(true);
    expect(showTopUp([meal(13, 30)], 60, false, new Date(2026, 10, 10, 17, 30))).toBe(false);
    expect(showTopUp([meal(13, 50)], 60, false, new Date(2026, 10, 10, 19, 0))).toBe(false);
  });
  it('gives vegetarian picks unless About you says otherwise', () => {
    expect(picks(14, [], '').some(p => !p.veg)).toBe(false);
    expect(eatsNonVeg('I eat eggs and chicken')).toBe(true);
    expect(picks(13, [], 'eggs ok')).toHaveLength(3);
  });
});

describe('30-day test', () => {
  it('counts days from the start and keeps each answer', () => {
    expect(dayOf('2026-11-01', '2026-11-10')).toBe(10);
    const g = grid({ '2026-11-02': day([], { date: '2026-11-02', oneChange: 'yes' }) } as Record<string, DayLog>, '2026-11-01');
    expect(g[1]).toBe('yes'); expect(g).toHaveLength(30);
  });
});

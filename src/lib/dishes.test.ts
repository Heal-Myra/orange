import { describe, expect, it } from 'vitest';
import { myDishes, withMyDishes } from './dishes';
import type { DayLog, Meal } from './types';

const day = (date: string, meals: Meal[]) => ({ date, meals } as unknown as DayLog);
const upma = (kcal: number, extra: Partial<Meal> = {}): Meal => ({ name: 'Oats upma', grams: 200, kcal, p: 8, c: 40, f: 6, fib: 5, source: 'photo+ifct', ...extra });

describe('My dishes (decision 0053)', () => {
  it('learns confirmed dishes per 100 g, newest recipe first, and counts how often', () => {
    const days = { '2026-11-01': day('2026-11-01', [upma(300)]), '2026-11-08': day('2026-11-08', [upma(260)]) };
    const d = myDishes(days, '2026-11-09');
    expect(d).toHaveLength(1);
    expect(d[0].per100.kcal).toBe(130);
    expect(d[0].times).toBe(2);
  });
  it('ignores rough estimates and meals still being checked, but keeps numbers the person corrected', () => {
    const days = { '2026-11-08': day('2026-11-08', [
      upma(300, { source: 'photo' }),
      upma(280, { name: 'Poha', check: { id: 'x', until: '' } }),
      upma(240, { name: 'Moong dal', source: 'photo', edited: true }),
    ]) };
    expect(myDishes(days, '2026-11-09').map(x => x.name)).toEqual(['Moong dal']);
  });
  it('gives a matched item the dish numbers for today\'s grams', () => {
    const dishes = myDishes({ '2026-11-08': day('2026-11-08', [upma(260)]) }, '2026-11-09');
    const [it] = withMyDishes([{ name: 'Upma', grams: 300, kcal: 999, protein_g: 0, carbs_g: 0, fat_g: 0, basis: 'estimate', usual: 'Oats upma' }], dishes);
    expect(it).toMatchObject({ name: 'Oats upma', kcal: 390, protein_g: 12, basis: 'mine' });
  });
});

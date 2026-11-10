// Protein top-up at 6 pm (founder, 10 Nov 2026), the Food specialist: when today's protein is still short, one line with
// a simple Indian food that closes the gap. The person's own dishes come first; vegetarian people get vegetarian picks.

import type { Dish } from './dishes';
import type { Meal } from './types';

export interface Pick { name: string; grams: number; kcal: number; p: number; c: number; f: number; fib: number; veg: boolean; mine?: boolean }

// Everyday portions, rounded (IFCT 2017 values, cooked or as eaten).
const BASIC: Pick[] = [
  { name: 'Sprouts chaat, 1 bowl', grams: 150, kcal: 150, p: 11, c: 22, f: 2, fib: 6, veg: true },
  { name: 'Paneer, 100 g', grams: 100, kcal: 265, p: 18, c: 1, f: 21, fib: 0, veg: true },
  { name: 'Curd, 1 bowl', grams: 200, kcal: 120, p: 7, c: 9, f: 6, fib: 0, veg: true },
  { name: 'Roasted chana, a handful', grams: 50, kcal: 180, p: 10, c: 29, f: 3, fib: 8, veg: true },
  { name: 'Moong dal chilla, 2', grams: 160, kcal: 250, p: 13, c: 32, f: 7, fib: 5, veg: true },
  { name: 'Boiled eggs, 2', grams: 100, kcal: 155, p: 13, c: 1, f: 11, fib: 0, veg: false },
];

/** Vegetarian unless About you says otherwise (eggs, chicken, fish, meat or non-veg). */
export const eatsNonVeg = (prefs?: string) => /non[\s-]?veg|egg|chicken|fish|meat|mutton|prawn/i.test(prefs ?? '');

export function proteinGap(meals: Meal[], target: number) {
  const p = meals.reduce((s, m) => s + (m.p || 0), 0);
  return { have: p, target, gap: Math.max(0, target - p) };
}

/** Show it from 6 pm, when something is logged, not fasting, and protein is below 80 % of the aim. */
export const showTopUp = (meals: Meal[], target: number, fasting: boolean | undefined, now = new Date()) =>
  now.getHours() >= 18 && !fasting && meals.length > 0 && proteinGap(meals, target).have < 0.8 * target;

/** Three picks: up to two of the person's own protein-rich dishes, then everyday foods. Best fit for the gap first. */
export function picks(gap: number, dishes: Dish[], prefs?: string): Pick[] {
  const nonVeg = eatsNonVeg(prefs);
  const mine: Pick[] = dishes
    .filter(d => d.grams > 0)
    .map(d => { const k = d.grams / 100; return { name: d.name, grams: Math.round(d.grams), kcal: Math.round(d.per100.kcal * k), p: Math.round(d.per100.p * k), c: Math.round(d.per100.c * k), f: Math.round(d.per100.f * k), fib: Math.round(d.per100.fib * k), veg: true, mine: true }; })
    .filter(x => x.p >= 8).sort((a, b) => b.p - a.p).slice(0, 2);
  const basic = BASIC.filter(b => (nonVeg || b.veg) && !mine.some(m => m.name.toLowerCase().includes(b.name.split(',')[0].toLowerCase())));
  const fit = (x: Pick) => Math.abs(Math.min(x.p, gap + 5) - gap) + (x.p > gap + 10 ? 5 : 0);
  return [...mine, ...basic].sort((a, b) => fit(a) - fit(b) || (b.mine ? 1 : 0) - (a.mine ? 1 : 0)).slice(0, 3);
}

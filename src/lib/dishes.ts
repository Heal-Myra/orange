// "My dishes" (founder, 9 Nov 2026; decision 0053): the Food specialist's memory of the person's own meals. Built from
// their past days, nothing extra stored: every meal whose numbers were confirmed (IFCT-checked, their usual dish, or a
// number they corrected themselves) teaches Myra that dish, per 100 g. The newest copy of a dish wins.

import type { MealItem } from './ai';
import type { DayLog, Meal } from './types';

export interface Dish { name: string; grams: number; per100: { kcal: number; p: number; c: number; f: number; fib: number }; times: number }

const confirmed = (m: Meal) => (m.grams ?? 0) > 0 && !m.check && (m.edited || m.checked || m.source.endsWith('+ifct') || m.source.endsWith('+mine'));
export const dishKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

/** The person's dishes from the last 120 days, most eaten first. */
export function myDishes(days: Record<string, DayLog>, today: string): Dish[] {
  const from = new Date(Date.parse(today) - 120 * 86_400_000).toISOString().slice(0, 10);
  const map = new Map<string, Dish>();
  for (const date of Object.keys(days).sort().reverse()) {
    if (date < from) break;
    for (const m of [...(days[date]?.meals ?? [])].reverse()) {
      if (!confirmed(m)) continue;
      const k = dishKey(m.name), g = m.grams! / 100, had = map.get(k);
      if (had) { had.times++; continue; } // newest first: the first one seen is the latest recipe
      map.set(k, { name: m.name.trim(), grams: m.grams!, times: 1, per100: { kcal: m.kcal / g, p: m.p / g, c: m.c / g, f: m.f / g, fib: (m.fib ?? 0) / g } });
    }
  }
  return [...map.values()].sort((a, b) => b.times - a.times);
}

/** A quick reading's item that Myra matched to a usual dish gets that dish's own numbers, for today's grams. */
export function withMyDishes(items: MealItem[], dishes: Dish[]): MealItem[] {
  const by = new Map(dishes.map(d => [dishKey(d.name), d]));
  return items.map(it => {
    const d = it.usual ? by.get(dishKey(it.usual)) : undefined;
    if (!d || !(it.grams > 0)) return it;
    const k = it.grams / 100, r1 = (v: number) => Math.round(v * 10) / 10;
    return { ...it, name: d.name, kcal: Math.round(d.per100.kcal * k), protein_g: r1(d.per100.p * k), carbs_g: r1(d.per100.c * k),
      fat_g: r1(d.per100.f * k), fibre_g: r1(d.per100.fib * k), basis: 'mine' };
  });
}

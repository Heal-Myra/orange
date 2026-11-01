// Adding meals with the time they were logged (founder, 1 Nov 2026): today's meals get a time, and the last one also
// starts tomorrow's fast (fasting by choice, decision 0044). Meals logged for a past day get no time.

import { shiftISO, todayISO } from './dates';
import { useHeal } from './store';
import type { Meal } from './types';

export function useLogMeals() {
  const { update, updateOn, date } = useHeal();
  return (meals: Meal[]) => {
    const at = date === todayISO() ? new Date().toISOString() : undefined;
    update(d => { for (const m of meals) d.meals.push(at ? { ...m, at } : m); });
    if (at) updateOn(shiftISO(date, 1), n => { if (!n.fastFrom || n.fastFrom < at) n.fastFrom = at; });
  };
}

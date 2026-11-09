// Finishes the careful check of meal photos that were added while it was still running (decision 0053). Works from
// anywhere in the app and after a restart: the meals carry the check's id. When the result comes, the careful numbers
// replace the quick ones, unless the person changed a number (theirs stays). After 10 minutes the quick numbers stay.

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getMealCheck, type MealItem } from './ai';
import { shiftISO, todayISO } from './dates';
import { myDishes, withMyDishes } from './dishes';
import { useHeal } from './store';
import type { Meal } from './types';

/** The careful items as meals, keeping the time the quick ones were logged. */
export function checkedMeals(items: MealItem[], at?: string): Meal[] {
  const now = new Date().toISOString();
  return items.map(it => ({
    name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g, fib: it.fibre_g ?? 0,
    source: it.basis === 'IFCT' ? 'photo+ifct' : it.basis === 'mine' ? 'photo+mine' : 'photo', ...(at ? { at } : {}),
    ...(it.basis === 'mine' ? { checked: 'usual' as const } : it.basis === 'IFCT' ? { checked: 'ifct' as const, checkedAt: now } : {}),
  }));
}

export function MealChecks() {
  const { days, updateOn } = useHeal();
  const busy = useRef(false);
  const today = todayISO();
  const dates = [shiftISO(today, -1), today];
  const pending = dates.flatMap(d => (days[d]?.meals ?? []).filter(m => m.check).map(m => ({ date: d, id: m.check!.id, until: m.check!.until })));
  const ids = [...new Set(pending.map(p => p.id))].join(',');

  useEffect(() => {
    if (!ids) return;
    const tick = async () => {
      if (busy.current || AppState.currentState !== 'active') return;
      busy.current = true;
      try {
        for (const { date, id, until } of pending.filter((p, i, a) => a.findIndex(q => q.id === p.id) === i)) {
          const stop = (d: { meals: Meal[] }) => { d.meals = d.meals.map(m => (m.check?.id === id ? { ...m, check: undefined } : m)); };
          let r: Awaited<ReturnType<typeof getMealCheck>> | null = null;
          try { r = await getMealCheck(id); } catch { /* offline: ask again later */ }
          if (r?.status === 'done' && r.result?.items?.length) {
            updateOn(date, d => {
              const mine = d.meals.filter(m => m.check?.id === id);
              if (!mine.length) return;
              if (mine.some(m => m.edited)) { stop(d); return; } // the person's own numbers stay
              const first = d.meals.findIndex(m => m.check?.id === id);
              const rest = d.meals.filter(m => m.check?.id !== id);
              rest.splice(first, 0, ...checkedMeals(withMyDishes(r!.result!.items, myDishes(days, today)), mine[0].at));
              d.meals = rest;
            });
          } else if (r?.status === 'failed' || r?.status === 'missing' || r?.status === 'done' || Date.now() > Date.parse(until)) {
            updateOn(date, stop); // keep the quick numbers
          }
        }
      } finally { busy.current = false; }
    };
    tick();
    const t = setInterval(tick, 5000);
    const a = AppState.addEventListener('change', s => { if (s === 'active') tick(); });
    return () => { clearInterval(t); a.remove(); };
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

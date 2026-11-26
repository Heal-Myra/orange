// "Food and your body" (founder, 26 Nov 2026): meals pinned on the day's heart-rate line, what the body did after a
// meal, and patterns across weeks. Linked, never "caused" (Orange Book: no medical claims). Pure, so it is tested.
import { shiftISO } from './dates';
import { sleepParts, sleepPoints } from './scoring';
import type { DayLog, Meal } from './types';

export const SLOTS = 96; // 15-minute slots from midnight
export const AFTER_SLOTS = 12; // three hours after a meal
export const BASELINE_DAYS = 14;
export const MIN_BASELINE = 5; // days with data before "your usual" means anything
export const MIN_EACH = 5; // days on each side before a pattern is told
const WALKING = 250; // steps in 15 minutes: moving, so heart rate says little about the meal

export interface MealMark { at: string; slot: number; name: string; kcal: number; items: Meal[] }

/** A day's meals grouped by the time they were logged (one photo = one meal). Meals without a time are left out. */
export function mealsOf(d: DayLog | undefined): MealMark[] {
  if (!d) return [];
  const by = new Map<string, Meal[]>();
  for (const m of d.meals) if (m.at) by.set(m.at.slice(0, 16), [...(by.get(m.at.slice(0, 16)) ?? []), m]);
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, items]) => {
    const t = new Date(items[0].at as string);
    const names = items.map(i => i.name);
    return { at: items[0].at as string, slot: Math.floor((t.getHours() * 60 + t.getMinutes()) / 15), items,
      name: names.length > 2 ? `${names[0]} +${names.length - 1}` : names.join(', '), kcal: Math.round(items.reduce((s, i) => s + i.kcal, 0)) };
  });
}

const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Heart rate in slots [from, from+n) starting on `date`, running into the next day; only slots with little walking. */
function window(days: Record<string, DayLog | undefined>, date: string, from: number, n: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const i = from + k, day = days[i < SLOTS ? date : shiftISO(date, 1)]?.health, j = i % SLOTS;
    const hr = day?.hr15?.[j], st = day?.steps15?.[j] ?? 0;
    if (hr != null && st < WALKING) out.push(hr);
  }
  return out;
}

export interface AfterMeal { hrDelta: number | null; deepMin: number | null; deepUsualMin: number | null; dinner: boolean }

/** What the body did in the three hours after a meal, against the same hours on the person's usual days; and for an
 *  evening meal, that night's deep sleep against the usual. Null parts when there is too little to compare. */
export function afterMeal(days: Record<string, DayLog | undefined>, date: string, m: MealMark): AfterMeal {
  const now = window(days, date, m.slot + 1, AFTER_SLOTS);
  const usual: number[] = [];
  for (let k = 1; k <= BASELINE_DAYS; k++) {
    const w = window(days, shiftISO(date, -k), m.slot + 1, AFTER_SLOTS);
    if (w.length >= 4) usual.push(mean(w) as number);
  }
  const hrDelta = now.length >= 4 && usual.length >= MIN_BASELINE ? Math.round((mean(now) as number) - (median(usual) as number)) : null;
  const dinner = m.slot >= 17 * 4;
  const deepOf = (iso: string) => { const h = days[iso]?.health?.sleepStages?.deep; return h != null ? Math.round(h * 60) : null; };
  const night = dinner ? deepOf(shiftISO(date, 1)) : null;
  const past = Array.from({ length: BASELINE_DAYS }, (_, k) => deepOf(shiftISO(date, -k))).filter((x): x is number => x != null);
  return { hrDelta, dinner, deepMin: night, deepUsualMin: dinner && past.length >= MIN_BASELINE ? Math.round(median(past) as number) : null };
}

/** The sleep score (out of 100) of the night that ended on `date`, from the ring or Watch. */
export function sleepScoreOn(d: DayLog | undefined): number | null {
  const p = d ? sleepParts(d) : null;
  return p?.length ? Math.round((sleepPoints(p) / 30) * 100) : null;
}

export interface Pattern { id: 'dinnerTime' | 'heavyDinner'; better: 'early' | 'late' | 'light' | 'heavy'; diff: number; n: [number, number] }

/** Patterns over the last four weeks, told only when each side has enough days and the gap is worth telling. */
export function patterns(days: Record<string, DayLog | undefined>, today: string): Pattern[] {
  const early: number[] = [], late: number[] = [], light: number[] = [], heavy: number[] = [];
  for (let k = 1; k <= 28; k++) {
    const date = shiftISO(today, -k);
    const dinner = mealsOf(days[date]).filter(m => m.slot >= 17 * 4).pop();
    if (!dinner) continue;
    const s = sleepScoreOn(days[shiftISO(date, 1)]);
    const deep = days[shiftISO(date, 1)]?.health?.sleepStages?.deep;
    const evening = mealsOf(days[date]).filter(m => m.slot >= 17 * 4).reduce((t, m) => t + m.kcal, 0);
    if (s != null) (dinner.slot < 20 * 4 ? early : late).push(s);
    if (deep != null) (evening >= 700 ? heavy : light).push(deep * 60);
  }
  const out: Pattern[] = [];
  if (early.length >= MIN_EACH && late.length >= MIN_EACH) {
    const d = Math.round((mean(early) as number) - (mean(late) as number));
    if (Math.abs(d) >= 3) out.push({ id: 'dinnerTime', better: d > 0 ? 'early' : 'late', diff: Math.abs(d), n: [early.length, late.length] });
  }
  if (light.length >= MIN_EACH && heavy.length >= MIN_EACH) {
    const d = Math.round((mean(light) as number) - (mean(heavy) as number));
    if (Math.abs(d) >= 10) out.push({ id: 'heavyDinner', better: d > 0 ? 'light' : 'heavy', diff: Math.abs(d), n: [light.length, heavy.length] });
  }
  return out;
}

/** The level of a heart rate against the person's resting rate: 0 calm, 1 steady, 2 busy, 3 working hard. */
export const levelOf = (hr: number, resting: number) => (hr < resting + 10 ? 0 : hr < resting + 25 ? 1 : hr < resting + 45 ? 2 : 3);

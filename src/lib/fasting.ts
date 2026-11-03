// Fasting by choice (founder, 1 Nov 2026; decision 0044). For someone who fasts on purpose (e.g. 18 hours: dinner at
// night, no breakfast, lunch next day), the hours without food earn Food points, so a morning without breakfast is a
// good morning, not a zero. Food = Fasting 16 + Meals 24 for them; everyone else keeps Meals 40.
// The habit is read from About you (their usual day or goal in their own words), asked once, or set by hand.

import type { AboutMe } from './targets';
import type { DayLog } from './types';

export interface FastHabit { hours: number; lastMeal: string } // lastMeal: usual "HH:MM" of the last meal of the day
export const FAST_FROM = '2026-11-01'; // days before keep the old Food score
export const FAST_POINTS = 16;
export const MEAL_SHARE = 24 / 40;

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (date: string, hhmm: string, dayShift = 0) => {
  const [y, m, d] = date.split('-').map(Number), [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d + dayShift, h || 0, mi || 0);
};

/** "intermittent fasting 18 hours", "16:8", "skip breakfast" … → the habit; null when nothing says so. */
export function detectFast(text: string, lastMeal?: string): FastHabit | null {
  const t = (text || '').toLowerCase();
  const ratio = t.match(/\b(1[2-9]|2[0-3])\s*[:/]\s*([1-9]|1[0-2])\b/); // 16:8, 18/6
  const hrs = t.match(/\b(1[2-9]|2[0-3])\s*(?:-\s*)?(?:hours?|hrs?|h)\b[^.]{0,40}fast|fast[^.]{0,40}?\b(1[2-9]|2[0-3])\s*(?:-\s*)?(?:hours?|hrs?|h)\b/);
  const said = /intermittent|\bif\b|fasting|skip(?:ping)?\s+breakfast|no\s+breakfast|उपवास|व्रत/.test(t);
  if (!said && !ratio) return null;
  const hours = Number(hrs?.[1] ?? hrs?.[2] ?? ratio?.[1] ?? 16);
  return { hours, lastMeal: lastMeal ?? '21:00' };
}

/** The person's habit: what they set (or turned off), else what their own words say. */
export function fastHabit(me?: AboutMe): FastHabit | null {
  if (!me) return null;
  if (me.fast) return me.fast.off ? null : { hours: me.fast.hours, lastMeal: me.fast.lastMeal || '21:00' };
  const evening = (me.routine ?? []).filter(r => r.kind === 'meal' && r.at >= '17:00').map(r => r.at).sort().pop();
  return detectFast(`${me.dayText ?? ''} . ${me.goalText ?? ''} . ${me.foodPrefs ?? ''}`, evening);
}

/** Hours without food that count for this day: from last night's last meal to today's first meal (or now). */
export function fastHoursOf(d: DayLog, h: FastHabit, now: Date = new Date()): { hours: number; since: Date; ongoing: boolean } {
  const since = d.fastFrom ? new Date(d.fastFrom) : at(d.date, h.lastMeal, -1);
  const times = d.meals.map(m => m.at).filter(Boolean).map(s => new Date(s as string).getTime());
  let end: Date, ongoing = false;
  if (d.meals.length && times.length === d.meals.length) end = new Date(Math.min(...times));
  else if (d.meals.length) end = new Date(since.getTime() + h.hours * 3600_000); // meals without a time: the usual window
  else if (d.date === iso(now)) { end = now; ongoing = true; }
  else end = at(d.date, '23:59');
  return { hours: Math.max(0, (end.getTime() - since.getTime()) / 3600_000), since, ongoing };
}

export const fastPoints = (hours: number, h: FastHabit) => FAST_POINTS * Math.max(0, Math.min(1, hours / h.hours));

/** "12½" for 12.5 hours. */
export const fmtHours = (x: number) => { const r = Math.round(x * 2) / 2; return Number.isInteger(r) ? String(r) : `${Math.floor(r)}½`; };

// ---------- Food from 3 Nov 2026 (founder): Fasting 20 % + Dinner time 20 % + Quality and quantity 60 %, minus up to
// 10 % when carbs or fat give more of the calories than recommended (a graded penalty). Out of 40. ----------
export const FOOD_V3_FROM = '2026-11-03';
export const FOOD_PARTS = { fasting: 8, dinner: 8, meals: 24, penaltyMax: 4 } as const;
export const DEFAULT_FAST_HOURS = 14; // an overnight fast for people with no fasting habit
const c01 = (x: number) => Math.max(0, Math.min(1, x));

export interface FoodV3 { fasting: number; fastHours: number; fastTarget: number; ongoing: boolean; since: Date;
  dinner: number; dinnerGap: number | null; meals: number; penalty: number; carbOver: number; fatOver: number; total: number }

/** Usual times from About you: the last meal, and bedtime (from their usual day), with plain defaults. */
function usual(me: AboutMe | undefined) {
  const r = me?.routine ?? [];
  const lastMeal = me?.fast && !me.fast.off ? me.fast.lastMeal : r.filter(x => x.kind === 'meal' && x.at >= '17:00').map(x => x.at).sort().pop() ?? '21:00';
  const sleep = r.filter(x => x.kind === 'sleep').map(x => x.at).sort().pop() ?? '22:30';
  return { lastMeal, sleep };
}

/**
 * Food for one day. mealScore40 is the usual 40-point meal score (calories, protein, fibre, fat) of the day's meals or
 * null when nothing was eaten; shares are carbs and fat as a share of calories; aims are the recommended shares.
 */
export function foodV3(d: DayLog, me: AboutMe | undefined, mealScore40: number | null, shares: { carb: number; fat: number } | null, aims: { carb: number; fat: number }, now: Date = new Date()): FoodV3 {
  const habit = fastHabit(me);
  const u = usual(me);
  const target = habit?.hours ?? DEFAULT_FAST_HOURS;
  const f = fastHoursOf(d, { hours: target, lastMeal: habit?.lastMeal ?? u.lastMeal }, now);
  const fasting = FOOD_PARTS.fasting * c01(f.hours / target);
  // Dinner at least 3 hours before sleep: full at 3 h or more, nothing at 1 h or less (founder, 3 Nov 2026).
  const dinnerAt = f.since;
  const bed = d.sleep.bedAt ? new Date(d.sleep.bedAt) : at(d.date, u.sleep, u.sleep < '12:00' ? 0 : -1);
  const gap = (bed.getTime() - dinnerAt.getTime()) / 3600_000;
  const dinnerGap = gap > -6 && gap < 18 ? gap : null; // a wrong date would give nonsense
  const dinner = dinnerGap == null ? 0 : FOOD_PARTS.dinner * c01((dinnerGap - 1) / 2);
  const meals = mealScore40 == null ? 0 : (FOOD_PARTS.meals * mealScore40) / 40;
  // Graded penalty: up to 4 points, growing with how far carbs or fat go above the recommended share (0 to 15 points
  // of the day's calories over), so a small slip costs little and a big one costs the most.
  const carbOver = shares ? Math.max(0, shares.carb - aims.carb) : 0, fatOver = shares ? Math.max(0, shares.fat - aims.fat) : 0;
  const penalty = Math.min(FOOD_PARTS.penaltyMax, FOOD_PARTS.penaltyMax * (c01(carbOver / 0.15) + c01(fatOver / 0.15)));
  return { fasting, fastHours: f.hours, fastTarget: target, ongoing: f.ongoing, since: f.since, dinner, dinnerGap, meals, penalty, carbOver, fatOver,
    total: Math.max(0, Math.min(40, fasting + dinner + meals - penalty)) };
}

/** Recommended shares of calories (same as the food table's aim): fat 25 %, protein by target, fibre, carbs the rest. */
export function aimShares(kcal: number, proteinG: number) {
  const p = Math.min(0.35, (proteinG * 4) / kcal), f = 0.25, fib = Math.min(0.06, ((14 * kcal) / 1000) * 2 / kcal);
  return { carb: 1 - p - f - fib, fat: f };
}

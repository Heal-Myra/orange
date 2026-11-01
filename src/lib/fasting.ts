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

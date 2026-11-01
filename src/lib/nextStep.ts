// Myra's one recommendation on Today (founder, 31 Oct 2026; decision 0040): always ONE thing, chosen for the time of day
// and the part of the day with the most points still to win, with how many points it can add. The points come from the
// same scoring as the cards (src/lib/scoring.ts), so the "+N" is worked out, never guessed.

import { FAST_FROM, fastHabit, fastHoursOf } from './fasting';
import { FOCUS_EACH, POINTS, type WellBeing } from './scoring';
import type { DayLog, Profile } from './types';

export type StepId = 'sleep' | 'meditation' | 'nidra' | 'movement' | 'food' | 'tasks' | 'gratitude' | 'kind' | 'wisdom' | 'tao';
export interface Step { id: StepId; pillar: 'body' | 'mind' | 'soul'; card: string; gain: number; minutes?: number }

const c01 = (x: number) => Math.max(0, Math.min(1, x));
/** After 9:30 pm (or before 5 am) only winding down, never a target to chase (founder, 22 Oct 2026). */
export const isBedtime = (hour: number) => hour >= 21.5 || hour < 5;

/** Which steps suit this hour more than others: morning for stillness and sleep, midday for food and doing, evening for the heart. */
function preferred(hour: number): StepId[] {
  if (hour < 11) return ['sleep', 'meditation', 'wisdom', 'tao'];
  if (hour < 17) return ['food', 'movement', 'tasks'];
  return ['gratitude', 'kind', 'movement', 'food'];
}

/** Every step that fits this hour, with the points it would add today. */
export function candidates(d: DayLog, P: Profile, w: WellBeing, hour: number): Step[] {
  const out: Step[] = [];
  const b = w.body, m = w.mind, s = w.soul;
  const add = (st: Step) => { if (st.gain >= 1) out.push({ ...st, gain: Math.round(st.gain) }); };
  const medLeft = Math.max(0, P.meditation - (d.mind?.meditationMin ?? 0));

  if (isBedtime(hour)) {
    if (medLeft > 0) { const n = Math.min(20, medLeft); add({ id: 'nidra', pillar: 'mind', card: 'meditation', minutes: n, gain: POINTS.meditation * n / P.meditation }); }
    if (hour >= 21.5) {
      add({ id: 'gratitude', pillar: 'soul', card: 'gratitude', gain: POINTS.gratitude - (s?.gratitude ?? 0) });
      add({ id: 'kind', pillar: 'soul', card: 'gratitude', gain: POINTS.love - (s?.love ?? 0) });
    }
    return out;
  }

  if (hour < 12 && d.sleep?.hours == null) add({ id: 'sleep', pillar: 'body', card: 'sleep', gain: POINTS.sleep - (b?.sleep ?? 0) });
  if (medLeft > 0) { const n = Math.min(10, medLeft); add({ id: 'meditation', pillar: 'mind', card: 'meditation', minutes: n, gain: POINTS.meditation * n / P.meditation }); }
  if (hour >= 6 && hour < 20) {
    // A 20-minute brisk walk: about 2,000 steps and 20 active minutes.
    const st = d.activity?.steps ?? 0, am = d.activity?.activeMin ?? 0;
    const gain = 15 * (c01((st + 2000) / P.steps) - c01(st / P.steps)) + 15 * (c01((am + 20) / P.active) - c01(am / P.active));
    add({ id: 'movement', pillar: 'body', card: 'movement', minutes: 20, gain });
  }
  // Mid-fast (fasting by choice, decision 0044): no meal nudges until the fast reaches its target.
  const habit = (d.date ?? '') >= FAST_FROM ? fastHabit(P.me) : null;
  const [y, mo, da] = (d.date ?? '2000-01-01').split('-').map(Number);
  const fasting = habit && !d.meals.length && fastHoursOf(d, habit, new Date(y, mo - 1, da, Math.floor(hour), Math.round((hour % 1) * 60))).hours < habit.hours;
  if (hour >= 7 && !d.fasting && !fasting) {
    // The food points still open, shared over the meals left in the day.
    const left = hour < 11 ? 3 : hour < 16 ? 2 : 1;
    add({ id: 'food', pillar: 'body', card: 'food', gain: (POINTS.food - (b?.nutrition ?? 0)) / left });
  }
  if (hour >= 8 && hour < 21) add({ id: 'tasks', pillar: 'mind', card: 'tasks', gain: Math.min(FOCUS_EACH, POINTS.focus - (m?.practices ?? 0)) });
  if (hour >= 16) {
    add({ id: 'gratitude', pillar: 'soul', card: 'gratitude', gain: POINTS.gratitude - (s?.gratitude ?? 0) });
    add({ id: 'kind', pillar: 'soul', card: 'gratitude', gain: POINTS.love - (s?.love ?? 0) });
  }
  add({ id: 'wisdom', pillar: 'soul', card: 'wisdom', gain: POINTS.wisdom - (s?.verse ?? 0) });
  add({ id: 'tao', pillar: 'soul', card: 'tao', gain: POINTS.tao - (s?.tao ?? 0) });
  return out;
}

/** The one step: the most points to win, with steps that suit this hour counting half again. */
export function nextStep(d: DayLog, P: Profile, w: WellBeing, hour: number): Step | null {
  const pref = preferred(hour);
  const all = candidates(d, P, w, hour);
  if (!all.length) return null;
  const weight = (x: Step) => x.gain * (pref.includes(x.id) ? 1.5 : 1);
  return all.reduce((best, x) => (weight(x) > weight(best) ? x : best));
}

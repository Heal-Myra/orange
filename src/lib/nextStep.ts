// Myra's one recommendation on Today (founder, 31 Oct 2026; decision 0040): always ONE thing, chosen for the time of day
// and the part of the day with the most points still to win, with how many points it can add. The points come from the
// same scoring as the cards (src/lib/scoring.ts), so the "+N" is worked out, never guessed.

import { FAST_FROM, fastHabit, fastHoursOf , saidFast } from './fasting';
import { FOCUS_EACH, JOURNAL_FROM, journalParts, LEARN_SHARE, POINTS, SECTIONS_FROM, SECTION_AREAS, lived, taoStudied, wisdomStudied, type WellBeing } from './scoring';
import type { DayLog, Profile } from './types';

export type StepId = 'sleep' | 'meditation' | 'nidra' | 'movement' | 'food' | 'tasks' | 'gratitude' | 'kind' | 'wisdom' | 'wisdomLive' | 'tao' | 'taoLive';
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
  // Gratitude journal: "write your gratitude" covers thanks, laugh and best part; "one kind act" the kind part.
  const jp = journalParts(d), journal = (d.date ?? '') >= JOURNAL_FROM;
  const gratGain = journal ? jp.of.thanks - jp.thanks + jp.of.laugh - jp.laugh + jp.of.best - jp.best : POINTS.gratitude - (s?.gratitude ?? 0);
  const kindGain = journal ? jp.of.kind - jp.kind : POINTS.love - (s?.love ?? 0);
  const medLeft = Math.max(0, P.meditation - (d.mind?.meditationMin ?? 0));

  if (isBedtime(hour)) {
    if (medLeft > 0) { const n = Math.min(20, medLeft); add({ id: 'nidra', pillar: 'mind', card: 'meditation', minutes: n, gain: POINTS.meditation * n / P.meditation }); }
    if (hour >= 21.5) {
      add({ id: 'gratitude', pillar: 'soul', card: 'gratitude', gain: gratGain });
      add({ id: 'kind', pillar: 'soul', card: 'gratitude', gain: kindGain });
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
  const h0 = (d.date ?? '') >= FAST_FROM ? fastHabit(P.me) : null;
  const habit = h0 && saidFast(d, h0) ? h0 : null; // only a fast the person ticked (11 Nov 2026)
  const [y, mo, da] = (d.date ?? '2000-01-01').split('-').map(Number);
  const fasting = habit && !d.meals.length && fastHoursOf(d, habit, new Date(y, mo - 1, da, Math.floor(hour), Math.round((hour % 1) * 60))).hours < habit.hours;
  if (hour >= 7 && !d.fasting && !fasting) {
    // The food points still open, shared over the meals left in the day.
    const left = hour < 11 ? 3 : hour < 16 ? 2 : 1;
    add({ id: 'food', pillar: 'body', card: 'food', gain: (POINTS.food - (b?.nutrition ?? 0)) / left });
  }
  // Finishing one more to-do: from 4 Nov 2026 that is 80 % ÷ 2 of a section (about 5 points) where one is still open.
  const secs = (d.date ?? '') >= SECTIONS_FROM ? d.mind?.sections : undefined;
  const taskGain = secs ? (SECTION_AREAS.some(a => (secs[a]?.[1] ?? 0) < 2) ? (POINTS.focus / 3) * 0.4 : 0) : Math.min(FOCUS_EACH, POINTS.focus - (m?.practices ?? 0));
  if (hour >= 8 && hour < 21) add({ id: 'tasks', pillar: 'mind', card: 'tasks', gain: taskGain });
  if (hour >= 16) {
    add({ id: 'gratitude', pillar: 'soul', card: 'gratitude', gain: gratGain });
    add({ id: 'kind', pillar: 'soul', card: 'gratitude', gain: kindGain });
  }
  // Wisdom and Tao (founder, 4 Nov 2026): reading is a quarter of the points, living it is the rest. Myra suggests
  // reading first; once read, she suggests living it (writing one line on how), which is the bigger win. Living it is a
  // way of life, not a task to tick off in the morning, so that suggestion waits until 3 pm (founder, 4 Nov 2026).
  if (!wisdomStudied(d.soul)) add({ id: 'wisdom', pillar: 'soul', card: 'wisdom', gain: LEARN_SHARE * POINTS.wisdom });
  else if (hour >= 15 && !lived(d.soul?.verseLived)) add({ id: 'wisdomLive', pillar: 'soul', card: 'wisdom', gain: (1 - LEARN_SHARE) * POINTS.wisdom });
  if (!taoStudied(d.tao)) add({ id: 'tao', pillar: 'soul', card: 'tao', gain: LEARN_SHARE * POINTS.tao });
  else if (hour >= 15 && !lived(d.tao?.lived)) add({ id: 'taoLive', pillar: 'soul', card: 'tao', gain: (1 - LEARN_SHARE) * POINTS.tao });
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

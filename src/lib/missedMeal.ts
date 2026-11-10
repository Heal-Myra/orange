// Missed-meal nudge (founder, 10 Nov 2026): people forget the photo, and a day without lunch logged looks like an empty
// plate. At 2 pm (lunch) and 9:30 pm (dinner), when nothing is logged for that meal: a gentle nudge and one row in Food
// with Snap · Skipped · Ate, no photo. "Skipped" is taken at its word: no nudge again and no penalty for it.

import type { DayLog } from './types';

export type Slot = 'lunch' | 'dinner';
export const SLOTS: Record<Slot, { from: number; to: number; nudge: string }> = {
  lunch: { from: 11, to: 16, nudge: '14:00' },
  dinner: { from: 17, to: 24, nudge: '21:30' },
};

const hm = (s: string) => { const [h, m] = s.split(':').map(Number); return h + m / 60; };

/** A meal logged for this slot (by the time it was logged). Old meals without a time count for both. */
export function hasSlot(d: DayLog | undefined, slot: Slot) {
  const { from, to } = SLOTS[slot];
  return (d?.meals ?? []).some(m => { if (!m.at) return true; const t = new Date(m.at); const h = t.getHours() + t.getMinutes() / 60; return h >= from && h < to; });
}

/** Should this slot be nudged on this day? Not on a fasting day, not when logged or skipped. */
export const needsNudge = (d: DayLog | undefined, slot: Slot) => !d?.fasting && !d?.skipped?.includes(slot) && !hasSlot(d, slot);

/** The meal to ask about now, if any: dinner from 9:30 pm, lunch from 2 pm. */
export function missedNow(d: DayLog | undefined, now = new Date()): Slot | null {
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= hm(SLOTS.dinner.nudge) && needsNudge(d, 'dinner')) return 'dinner';
  if (h >= hm(SLOTS.lunch.nudge) && needsNudge(d, 'lunch')) return 'lunch';
  return null;
}

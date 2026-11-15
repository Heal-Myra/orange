// Walk after dinner (founder, 15 Nov 2026 idea 3; built 16 Nov): a 10-minute walk within 45 minutes of dinner, spotted
// from the phone's or Watch's steps with no tap, earns 2 extra Movement points. About 100 steps make a minute of walking.

import type { Meal } from './types';

export const WINDOW_MIN = 45, NUDGE_FROM_MIN = 15, STEPS_PER_MIN = 100;

/** Dinner: the last meal logged from 6 pm. */
export function dinnerAt(meals: Meal[]): Date | null {
  const t = meals.map(m => (m.at ? new Date(m.at) : null)).filter((x): x is Date => !!x && x.getHours() >= 18).sort((a, b) => a.getTime() - b.getTime());
  return t.length ? t[t.length - 1] : null;
}

/** Minutes walked from the steps in the window (only a real walk of at least 3 minutes counts). */
export const walkMinutes = (steps: number | undefined) => (steps && steps >= 3 * STEPS_PER_MIN ? Math.round(steps / STEPS_PER_MIN) : 0);

/** Whether to show the gentle nudge: 15 to 45 minutes after dinner, no walk yet. */
export const nudgeNow = (dinner: Date | null, walked: number, now = new Date()) => {
  if (!dinner || walked >= 10) return false;
  const m = (now.getTime() - dinner.getTime()) / 60000;
  return m >= NUDGE_FROM_MIN && m <= WINDOW_MIN;
};

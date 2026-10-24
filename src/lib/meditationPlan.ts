// A meditation goal that grows gradually (founder, 24 Oct 2026): the person says how many minutes a day they want to reach
// and by when; Happy Orange sets each day's guided length, rising steadily from where they are now, and slowing to
// their pace when recent sessions fall short. Never more than 3 minutes above what they have recently managed.

import { shiftISO } from './dates';
import type { DayLog } from './types';

export interface MeditationGoal { minutes: number; by: string; start: number; setAt: string } // dates yyyy-mm-dd

const daysBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

/** Where the person is now: the average of their last five days that had any practice (in the last two weeks). */
export function recentLevel(days: Record<string, DayLog>, today: string): number | null {
  const mins: number[] = [];
  for (let i = 1; i <= 14 && mins.length < 5; i++) {
    const m = days[shiftISO(today, -i)]?.mind.meditationMin;
    if (m && m > 0) mins.push(m);
  }
  return mins.length ? mins.reduce((a, b) => a + b, 0) / mins.length : null;
}

export interface TodayPlan { minutes: number; planned: number; pace: 'on track' | 'gentler' | 'reached' }

/** Today's guided length. */
export function todaysLength(goal: MeditationGoal, days: Record<string, DayLog>, today: string): TodayPlan {
  const total = Math.max(1, daysBetween(goal.setAt, goal.by));
  const passed = Math.min(total, Math.max(0, daysBetween(goal.setAt, today)));
  const planned = Math.round(goal.start + (goal.minutes - goal.start) * (passed / total));
  if (planned >= goal.minutes && passed >= total) return { minutes: goal.minutes, planned: goal.minutes, pace: 'reached' };
  const recent = recentLevel(days, today);
  // Fell short lately (under 80% of the plan): stay close to what they actually managed.
  if (recent != null && recent < planned * 0.8) {
    const m = Math.max(3, Math.min(planned, Math.round(recent) + 1));
    return { minutes: m, planned, pace: 'gentler' };
  }
  const cap = recent != null ? Math.round(recent) + 3 : planned;
  return { minutes: Math.max(3, Math.min(planned, cap, goal.minutes)), planned, pace: 'on track' };
}

/** A new goal, starting from where the person is now (or 5 minutes). */
export function newGoal(minutes: number, weeks: number, days: Record<string, DayLog>, today: string): MeditationGoal {
  const recent = recentLevel(days, today);
  const start = Math.max(3, Math.min(minutes, Math.round(recent ?? 5)));
  return { minutes, by: shiftISO(today, weeks * 7), start, setAt: today };
}

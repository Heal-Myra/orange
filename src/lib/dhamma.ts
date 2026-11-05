// The 10-day Dhamma path (founder, 31 Oct and 5 Nov 2026; decision 0049). Built like a Dhamma course, in our own words:
// one simple step a day, always in order, one method only. Days 1–3 the breath at the nostrils, Days 4–9 the body part
// by part, Day 10 kindness. Missing a day does not reset anything; the path simply continues. A restless sitting repeats
// the step; an uneasy one repeats it shorter, eyes open. Not called Vipassana and no recordings of any teacher: a real
// course is free at dhamma.org, and the app points there after Day 10.
//
// Everything is kept in the day logs (d.mind.dhamma), so it syncs like the rest of the day.

import type { DayLog } from './types';

export type Feel = 'calm' | 'restless' | 'uneasy';
export interface Sit { step: number; min: number; sec?: number; at: string; feel?: Feel }
export interface DhammaDay { begun?: { gentle: boolean; at: string }; sits?: Sit[]; left?: boolean }

export type Stage = 'breath' | 'body' | 'kind';
export const STEPS = 10;
/** Minutes for each day: 10 → 15 on the breath, 15 → 30 on the body, 15 for kindness. */
const BASE = [10, 12, 15, 15, 18, 21, 24, 27, 30, 15];
export const AFTER_MIN = 15; // each sitting after Day 10 (morning and evening)

export const stageOf = (step: number): Stage => (step <= 3 ? 'breath' : step <= 9 ? 'body' : step === 10 ? 'kind' : 'body');

/** Minutes for a step: gentle path at most 10; after an uneasy sitting, shorter (60 %, at least 5). */
export function minutesFor(step: number, gentle: boolean, soft: boolean): number {
  let m = step > STEPS ? AFTER_MIN : BASE[Math.max(1, step) - 1];
  if (gentle) m = Math.min(m, 10);
  if (soft) m = Math.max(5, Math.round(m * 0.6));
  return m;
}

export interface PathState {
  active: boolean;     // begun and not left; includes after Day 10
  start?: string;
  gentle: boolean;
  next: number;        // the step to sit next (11 = after Day 10)
  soft: boolean;       // the next sitting is shorter, eyes open (after "uneasy")
  done: number[];      // finished steps
  today?: Sit;         // today's last sitting, if any
  finished: boolean;   // all 10 days done
}

/** Where the person is on the path, from the day logs. */
export function pathState(days: Record<string, DayLog>, today: string): PathState {
  const dates = Object.keys(days).filter(k => days[k]?.mind?.dhamma).sort();
  let start: string | undefined, gentle = false, left = false;
  for (const k of dates) {
    const x = days[k].mind.dhamma!;
    if (x.begun) { start = k; gentle = x.begun.gentle; left = false; }
    if (x.left && start) left = true;
  }
  const none: PathState = { active: false, gentle: false, next: 1, soft: false, done: [], finished: false };
  if (!start || left) return { ...none, start, gentle };
  let next = 1, soft = 0, today_: Sit | undefined;
  const done: number[] = [];
  for (const k of dates.filter(d => d >= start!)) {
    for (const s of days[k].mind.dhamma!.sits ?? []) {
      if (k === today) today_ = s;
      if (soft > 0) soft--;
      if (s.feel === 'restless') continue;      // same step tomorrow
      if (s.feel === 'uneasy') { soft = 2; continue; } // same step, shorter, eyes open
      if (s.step >= next) { if (s.step <= STEPS) done.push(s.step); next = s.step + 1; }
    }
  }
  return { active: true, start, gentle, next, soft: soft > 0, done, today: today_, finished: next > STEPS };
}

/** One step a day: today's step is done once there is a sitting today. */
export const satToday = (p: PathState) => !!p.today;

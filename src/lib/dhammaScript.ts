// What Myra says during a Dhamma path sitting, in our own words (decision 0049). Few words and long silences: an
// opening instruction, a gentle reminder every few minutes, and a soft ending. English here; Hindi in hi.ts; other
// languages are translated once by useGuideText.

import { stageOf, STEPS, type Feel } from './dhamma';
import { tr } from './i18n';

/** The one-line instruction on the card for each kind of day. */
export const CARD_LINE = {
  breath: 'Sit still. Feel the breath at the nostrils, just as it is.',
  body: 'Sit still. Feel the body, part by part, from head to feet.',
  kind: 'Feel the body, then wish all beings well.',
} as const;
export const STAGE_NAME = { breath: 'Watching the breath', body: 'Feeling the body', kind: 'Kindness' } as const;

const OPEN = 'Sit comfortably, with your back straight. Gently close your eyes.';
const EYES_OPEN = 'Today, keep your eyes slightly open, resting on the floor in front of you.';
const STEP_INTRO: Record<number, string> = {
  1: 'Bring your attention to the area below the nose, around the nostrils. Feel the breath coming in and going out. Do not change it. Just know it.',
  2: 'Again, feel the breath at the nostrils. Today, notice whether it flows through the left nostril, the right, or both.',
  3: 'Today, make the area smaller: the small patch below the nostrils, above the upper lip. Feel any touch of the breath, or any sensation there.',
  4: 'First, a few minutes on the breath at the nostrils. Then take your attention to the top of the head. Feel whatever is there: warmth, tingling, pressure, or nothing at all. Then move slowly down, part by part, to the feet.',
  5: 'Begin with the breath for a few minutes. Then move through the body from head to feet, part by part, without hurrying.',
  6: 'Begin with the breath. Then move through the body from head to feet. Today, try to sit without moving for the whole time.',
  7: 'Begin with the breath. Then move from head to feet, part by part. Where you feel nothing, rest there a moment, then move on.',
  8: 'Begin with the breath. Move from head to feet, and then from feet back up to the head.',
  9: 'Begin with the breath. Move through the body, head to feet and feet to head, calmly and evenly.',
  10: 'First, a few minutes of feeling the body, part by part. Then let a warm wish arise for yourself: may I be happy, may I be peaceful. Then widen it, to your family, to friends, to people you find difficult, and to all beings everywhere.',
  11: 'Begin with the breath for a few minutes. Then move through the body from head to feet, part by part. At the end, wish all beings well.',
};
const REMIND = {
  breath: ['If the mind has wandered, that is fine. Gently come back to the breath.', 'Just the breath, as it is. In, and out.', 'No hurry. Patiently, keep returning to the breath.'],
  body: ['Pleasant or unpleasant, just notice it. Do not hold on, do not push away.', 'Every feeling comes and goes. Watch it change.', 'If the mind runs away, come back to the part of the body where you were.'],
  kind: ['May all beings be happy. May all beings be peaceful.', 'Let the wish spread gently, in every direction.'],
};
const END = 'Slowly, let the sitting come to an end. Take a moment before you open your eyes.';
const END_KIND = 'May all beings be happy. Slowly, let the sitting come to an end.';

export interface Cue { at: number; line: string } // at: seconds from the start

/** The spoken plan for one sitting. */
export function sittingCues(step: number, minutes: number, eyesOpen: boolean): Cue[] {
  const st = step > STEPS ? 'body' : stageOf(step);
  const total = minutes * 60;
  const out: Cue[] = [{ at: 0, line: OPEN }];
  if (eyesOpen) out.push({ at: 6, line: EYES_OPEN });
  out.push({ at: eyesOpen ? 14 : 8, line: STEP_INTRO[Math.min(step, 11)] });
  // A reminder every 3 minutes (every 2 in short sittings), never in the last minute.
  const gap = minutes <= 10 ? 120 : 180;
  const pool = step === 10 ? [...REMIND.body.slice(0, 1), ...REMIND.kind] : REMIND[st];
  for (let t = gap, k = 0; t < total - 60; t += gap, k++) out.push({ at: t, line: pool[k % pool.length] });
  out.push({ at: Math.max(30, total - 20), line: step >= 10 ? END_KIND : END });
  return out;
}

/** Every line that may be spoken, for translation and Myra's voice files. */
export const ALL_LINES = [OPEN, EYES_OPEN, ...Object.values(STEP_INTRO), ...REMIND.breath, ...REMIND.body, ...REMIND.kind, END, END_KIND];

/** What each answer means for tomorrow. */
export function feelLine(f: Feel, step: number): string {
  if (f === 'restless') return tr('Restless is normal. Tomorrow stays at the same step.');
  if (f === 'uneasy') return tr('Thank you for telling me. The next sittings will be shorter, with eyes open. If it stays, talk to someone you trust.');
  return step >= STEPS ? tr('Lovely. Keep a morning and an evening sitting.') : tr('Lovely. Tomorrow: Day {n}.', { n: step + 1 });
}

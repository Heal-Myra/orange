// How-to explainers for each breathing practice, and the single source of truth for doing it right (founder, 25 Oct 2026:
// "our own explainer videos", "professional", "minimalist", and later the camera will check the person's practice live).
//
// Each practice is a list of steps. A step says what the body does (the pose), what the breath does, for how long, and
// what Myra says. The same data drives three things:
//   1. the animated guide character in the explainer (src/components/GuideFigure.tsx, src/app/explain.tsx);
//   2. the guided session timing (src/lib/pranayama.ts keeps the session rhythm; the explainer teaches the form);
//   3. later, the on-phone camera check: checksFor(step) lists what a correct practice looks like at that moment.
// Our own wording of well-known traditional practices. Everyday self-care, not medical advice.

import type { PracticeId } from './pranayama';

/** Where each hand is. Right hand: thumb closes the right nostril, ring finger the left (Vishnu mudra). */
export type RightHand = 'knee' | 'mudra' | 'thumb' | 'ring' | 'ear' | 'belly';
export type LeftHand = 'knee' | 'ear';
export type Mouth = 'closed' | 'tongue' | 'om';
export interface Pose { right: RightHand; left: LeftHand; mouth: Mouth }

/** What the breath does during the step; `through` says where the air goes. */
export type Breath = 'none' | 'in' | 'out' | 'hold' | 'pump' | 'hum' | 'chant';
export type Through = 'left' | 'right' | 'nose' | 'mouth';

export interface GuideStep { pose: Pose; breath: Breath; through?: Through; seconds: number; say: string }

const SIT: Pose = { right: 'knee', left: 'knee', mouth: 'closed' };
const st = (pose: Partial<Pose>, breath: Breath, seconds: number, say: string, through?: Through): GuideStep =>
  ({ pose: { ...SIT, ...pose }, breath, seconds, say, through });

export const GUIDES: Partial<Record<PracticeId, GuideStep[]>> = {
  anulom: [
    st({}, 'none', 5, 'Sit tall and relaxed. Rest both hands on your knees.'),
    st({ right: 'mudra' }, 'none', 5, 'Raise your right hand. Fold your first two fingers into the palm.'),
    st({ right: 'thumb' }, 'none', 5, 'Your thumb closes the right nostril. Your ring finger closes the left.'),
    st({ right: 'thumb' }, 'in', 4, 'Close the right nostril. Breathe in slowly through the left.', 'left'),
    st({ right: 'ring' }, 'out', 6, 'Close the left. Breathe out through the right.', 'right'),
    st({ right: 'ring' }, 'in', 4, 'Now breathe in through the right.', 'right'),
    st({ right: 'thumb' }, 'out', 6, 'Close the right. Breathe out through the left.', 'left'),
    st({}, 'none', 5, 'That is one round. Keep it slow and easy, never forced.'),
  ],
  bhramari: [
    st({}, 'none', 5, 'Sit tall and close your eyes.'),
    st({ right: 'ear', left: 'ear' }, 'none', 5, 'Gently close your ears with your thumbs. Rest your fingers over your eyes.'),
    st({ right: 'ear', left: 'ear' }, 'in', 4, 'Breathe in slowly through the nose.', 'nose'),
    st({ right: 'ear', left: 'ear' }, 'hum', 8, 'Breathe out with a soft, steady hum, like a bee.', 'nose'),
    st({}, 'none', 5, 'Feel the hum inside your head. Repeat five to seven times.'),
  ],
  bhastrika: [
    st({}, 'none', 5, 'Sit tall, hands on your knees, mouth closed.'),
    st({}, 'in', 2, 'Breathe in fully and strongly through the nose. The chest rises.', 'nose'),
    st({}, 'out', 2, 'Breathe out fully and strongly. The chest falls.', 'nose'),
    st({}, 'in', 1.5, 'In.', 'nose'),
    st({}, 'out', 1.5, 'Out.', 'nose'),
    st({}, 'none', 6, 'Keep an even rhythm. After fifteen breaths, rest and breathe normally.'),
  ],
  kapalbhati: [
    st({}, 'none', 5, 'Sit tall on an empty stomach, mouth closed.'),
    st({ right: 'belly' }, 'none', 4, 'Place your right hand on your belly to feel it move.'),
    st({ right: 'belly' }, 'pump', 4, 'Push the breath out through the nose by pulling the belly in sharply.', 'nose'),
    st({ right: 'belly' }, 'none', 4, 'Let the breath come in by itself. Do not pull it in.'),
    st({}, 'pump', 5, 'Keep going: short, quick pumps out.', 'nose'),
    st({}, 'none', 5, 'After thirty pumps, rest and breathe normally.'),
  ],
  ujjayi: [
    st({}, 'none', 5, 'Sit tall and relaxed, mouth closed.'),
    st({}, 'none', 6, 'Gently narrow the back of your throat, as if whispering, with lips closed.'),
    st({}, 'in', 5, 'Breathe in slowly through the nose, with a soft ocean sound.', 'nose'),
    st({}, 'out', 7, 'Breathe out slowly, with the same soft sound.', 'nose'),
  ],
  sheetali: [
    st({}, 'none', 5, 'Sit tall and relaxed.'),
    st({ mouth: 'tongue' }, 'none', 5, 'Roll your tongue into a tube. Or breathe through closed teeth.'),
    st({ mouth: 'tongue' }, 'in', 4, 'Breathe in through the tongue. Feel the cool air.', 'mouth'),
    st({}, 'hold', 2, 'Close your mouth. Hold for a moment.'),
    st({}, 'out', 6, 'Breathe out slowly through the nose.', 'nose'),
  ],
  box: [
    st({}, 'none', 5, 'Sit comfortably. Breathe through the nose.'),
    st({}, 'in', 4, 'Breathe in for four counts.', 'nose'),
    st({}, 'hold', 4, 'Hold, full, for four.'),
    st({}, 'out', 4, 'Breathe out for four.', 'nose'),
    st({}, 'hold', 4, 'Hold, empty, for four. That is one box.'),
  ],
  udgeeth: [
    st({}, 'none', 5, 'Sit tall and close your eyes.'),
    st({}, 'in', 4, 'Breathe in deeply through the nose.', 'nose'),
    st({ mouth: 'om' }, 'chant', 10, 'Breathe out with a long, soft Om: mostly O, then a gentle M.', 'mouth'),
    st({}, 'none', 5, 'Feel the stillness after the sound.'),
  ],
};

export const hasGuide = (id: PracticeId) => !!GUIDES[id]?.length;

/** How long the explainer takes, in seconds (the voice may stretch a step a little). */
export const guideSeconds = (id: PracticeId) => (GUIDES[id] ?? []).reduce((t, s) => t + s.seconds, 0);

// ---------- What a correct practice looks like at a step (for the camera check, built later) ----------
export type Check =
  | { kind: 'spineUpright'; maxDeg: number }
  | { kind: 'eyesClosed' }
  | { kind: 'handAt'; hand: 'left' | 'right'; part: 'thumb' | 'ringFinger' | 'thumbs' | 'palm'; target: 'rightNostril' | 'leftNostril' | 'knee' | 'ears' | 'belly' }
  | { kind: 'mouth'; state: Mouth }
  | { kind: 'sound'; sound: 'hum' | 'om' }
  | { kind: 'breath'; breath: Breath; seconds: number };

export function checksFor(s: GuideStep): Check[] {
  const c: Check[] = [{ kind: 'spineUpright', maxDeg: 10 }];
  const right: Record<RightHand, Check | null> = {
    knee: { kind: 'handAt', hand: 'right', part: 'palm', target: 'knee' },
    mudra: null,
    thumb: { kind: 'handAt', hand: 'right', part: 'thumb', target: 'rightNostril' },
    ring: { kind: 'handAt', hand: 'right', part: 'ringFinger', target: 'leftNostril' },
    ear: { kind: 'handAt', hand: 'right', part: 'thumbs', target: 'ears' },
    belly: { kind: 'handAt', hand: 'right', part: 'palm', target: 'belly' },
  };
  const r = right[s.pose.right]; if (r) c.push(r);
  c.push(s.pose.left === 'ear' ? { kind: 'handAt', hand: 'left', part: 'thumbs', target: 'ears' } : { kind: 'handAt', hand: 'left', part: 'palm', target: 'knee' });
  c.push({ kind: 'mouth', state: s.pose.mouth });
  if (s.breath === 'hum') c.push({ kind: 'sound', sound: 'hum' });
  if (s.breath === 'chant') c.push({ kind: 'sound', sound: 'om' });
  if (s.breath !== 'none') c.push({ kind: 'breath', breath: s.breath, seconds: s.seconds });
  return c;
}

// ---------- The guide character in the guided session (founder, 25 Oct 2026: "the character doing the exercise with the user") ----------
type SessionPhase = { kind: 'in' | 'hold' | 'out' | 'pump' | 'hum' | 'chant' | 'rest'; seconds: number; side?: 'left' | 'right'; cue: string };

/** What the guide character does during one phase of a guided session, so it breathes along with the person. */
export function sessionStep(id: PracticeId | 'still', ph: SessionPhase): GuideStep {
  const breath: Breath = ph.kind === 'rest' ? 'none' : ph.kind;
  const pose: Pose = { ...SIT };
  let through: Through | undefined = breath === 'none' || breath === 'hold' ? undefined : 'nose';
  if (id === 'anulom') {
    // Breathing on the left: the thumb closes the right nostril; on the right: the ring finger closes the left.
    pose.right = ph.side === 'right' ? 'ring' : ph.side === 'left' ? 'thumb' : 'mudra';
    if (ph.side) through = ph.side;
  } else if (id === 'bhramari') {
    pose.right = 'ear'; pose.left = 'ear';
  } else if (id === 'sheetali' && ph.kind === 'in') {
    pose.mouth = 'tongue'; through = 'mouth';
  } else if (id === 'udgeeth' && ph.kind === 'chant') {
    pose.mouth = 'om'; through = 'mouth';
  } else if (id === 'kapalbhati' && ph.kind === 'rest') {
    pose.right = 'knee';
  }
  return { pose, breath, through, seconds: Math.max(0.5, ph.seconds), say: ph.cue };
}

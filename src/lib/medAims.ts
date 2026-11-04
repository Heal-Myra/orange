// "What do you want help with?" on the Meditation card (founder, 3 and 5 Nov 2026; decision 0049). The person taps one
// aim; Myra recommends one practice for it, with others that also help. Energising breaths are never suggested after
// 6 pm, or for someone on the gentle path (they said yes to the safety questions).

import type { PracticeId } from './pranayama';

export type AimId = 'focus' | 'calm' | 'sleep' | 'energy' | 'anger' | 'steady';
export const AIMS: { id: AimId; icon: string; name: string }[] = [
  { id: 'focus', icon: '🎯', name: 'Focus' },
  { id: 'calm', icon: '🌊', name: 'Calm' },
  { id: 'sleep', icon: '🌙', name: 'Sleep' },
  { id: 'energy', icon: '⚡', name: 'Energy' },
  { id: 'anger', icon: '🔥', name: 'Let go of anger' },
  { id: 'steady', icon: '⚖️', name: 'Steady mind' },
];

const FOR: Record<AimId, PracticeId[]> = {
  focus: ['anulom', 'box', 'bhramari'],
  calm: ['bhramari', 'ujjayi', 'mix'],
  sleep: ['nidra', 'bhramari'],
  energy: ['bhastrika', 'kapalbhati', 'ujjayi'],
  anger: ['sheetali', 'bhramari'],
  steady: ['box', 'udgeeth'],
};
const ENERGISING: PracticeId[] = ['bhastrika', 'kapalbhati'];

/** The practices for an aim, best first, without energising breaths when they do not suit. */
export function practicesFor(aim: AimId, hour: number, gentle = false): { list: PracticeId[]; noEnergy: boolean } {
  const noEnergy = hour >= 18 || hour < 5 || gentle;
  const list = FOR[aim].filter(p => !(noEnergy && ENERGISING.includes(p)));
  return { list: list.length ? list : ['ujjayi'], noEnergy: noEnergy && FOR[aim].some(p => ENERGISING.includes(p)) };
}

/** Why each practice helps, in one line. */
export const WHY: Partial<Record<PracticeId, string>> = {
  anulom: 'Alternate-nostril breathing. Settles a busy mind before work.',
  box: 'Equal counts in, hold, out, hold. Steadies a wandering mind.',
  bhramari: 'A soft hum on the out-breath. Quiets the mind quickly.',
  ujjayi: 'Slow ocean breath in the throat. Calms the body.',
  mix: 'A balanced sequence chosen for your time of day.',
  nidra: 'Deep rest lying down. Best at bedtime.',
  bhastrika: 'Strong bellows breaths. Wakes up body and mind.',
  kapalbhati: 'Short pumps from the belly. Clears and energises.',
  sheetali: 'Cooling breath through a rolled tongue. Lets heat and anger settle.',
  udgeeth: 'A long Om on the out-breath. Settles the mind into stillness.',
};

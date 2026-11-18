// Myra's mix, rebuilt (founder, 18 Nov 2026: "not at all up to mark"; script approved the same day, decision 0061).
// Written from the Hatha Yoga Pradipika, chapter 2 (tr. Pancham Sinh, 1914, public domain) and the Ministry of Ayush
// Common Yoga Protocol. One exact timeline: Myra speaks only at the start and end of each round, a soft tick keeps the
// pace of the quick breaths, a gentle chime marks each nostril switch, the breath circle follows every breath, and a
// tanpura plays underneath. Daytime only; at night, when unwell, or with a care plan the calmer plan in pranayama.ts runs.

export type MixPart = 'arrive' | 'bhastrika' | 'kapalbhati' | 'anulom' | 'bhramari' | 'om' | 'still' | 'close';
export interface MixEvent {
  at: number;                       // seconds from the start
  part: MixPart;
  say?: string;                     // Myra's words (English; translated in the app)
  show?: string;                    // the big words on screen
  tick?: boolean;                   // a soft tick (quick breaths)
  chime?: boolean;                  // a gentle bell
  circle?: { to: number; secs: number }; // the breath circle: 0.5 empty … 1 full
  side?: 'left' | 'right';          // the nostril in use (Anulom Vilom)
}

/** Sources for each part, shown in "About this session". */
export const MIX_SOURCES: Record<MixPart, string> = {
  arrive: 'Hatha Yoga Pradipika 2.1: a steady posture first',
  bhastrika: 'Hatha Yoga Pradipika 2.59–65 (without breath-holding, for safety)',
  kapalbhati: 'Ayush Common Yoga Protocol; Hatha Yoga Pradipika 2.35',
  anulom: 'Hatha Yoga Pradipika 2.7–10; Ayush Common Yoga Protocol',
  bhramari: 'Hatha Yoga Pradipika 2.68; Ayush Common Yoga Protocol',
  om: 'Mandukya Upanishad: A-U-M',
  still: 'Ayush Common Yoga Protocol: Dhyana',
  close: '',
};

/** Rounds by session length (15 minutes is the approved script; 10 and 5 are shorter versions of it). */
function sizes(minutes: number) {
  if (minutes >= 15) return { arrive: 3, bhastrika: 3, kapal: 3, anulom: 11, bhramari: 10, oms: 3, still: 60 };
  if (minutes >= 10) return { arrive: 3, bhastrika: 2, kapal: 2, anulom: 7, bhramari: 6, oms: 3, still: 45 };
  return { arrive: 2, bhastrika: 1, kapal: 1, anulom: 4, bhramari: 4, oms: 1, still: 25 };
}

export function mixScript(minutes: number): { events: MixEvent[]; total: number } {
  const n = sizes(minutes);
  const ev: MixEvent[] = [];
  let t = 0;
  const add = (e: Omit<MixEvent, 'at'>, after = 0) => { ev.push({ at: t, ...e }); t += after; };

  // Arrive (HYP 2.1).
  add({ part: 'arrive', say: 'Sit tall, cross-legged or on a chair. Spine and head straight. Let the index finger and thumb touch. Close your eyes.', show: 'Sit tall. Close your eyes.' }, 12);
  add({ part: 'arrive', say: 'Three slow breaths.', show: 'Three slow breaths' }, 2);
  for (let i = 0; i < n.arrive; i++) { add({ part: 'arrive', show: 'In', circle: { to: 1, secs: 4 } }, 4); add({ part: 'arrive', show: 'Out', circle: { to: 0.55, secs: 6 } }, 6); }

  // Bhastrika: full, even breaths, one second in and one out, rounds of 15; deep breath and rest after each round.
  add({ part: 'bhastrika', say: 'Bhastrika, the bellows. Breathe in and out fully through the nose, evenly, with the tick.', show: 'Bhastrika · the bellows' }, 8);
  for (let r = 0; r < n.bhastrika; r++) {
    add({ part: 'bhastrika', say: r === 0 ? 'Round one. Begin.' : r === 1 ? 'Round two. Begin.' : 'Round three. Begin.', show: ['Round 1', 'Round 2', 'Round 3'][r] }, 3);
    for (let b = 0; b < 15; b++) { add({ part: 'bhastrika', tick: true, show: 'In', circle: { to: 0.95, secs: 1 } }, 1); add({ part: 'bhastrika', tick: true, show: 'Out', circle: { to: 0.6, secs: 1 } }, 1); }
    add({ part: 'bhastrika', chime: true, say: 'Stop. Breathe in deeply. And slowly out. Rest.', show: 'Deep breath in', circle: { to: 1, secs: 4 } }, 4);
    add({ part: 'bhastrika', show: 'Slowly out', circle: { to: 0.55, secs: 6 } }, 6);
    add({ part: 'bhastrika', show: 'Rest', circle: { to: 0.7, secs: 2 } }, 10);
  }

  // Kapalbhati: quick pushes out from the belly, about one a second, rounds of 30 (Ayush CYP).
  add({ part: 'kapalbhati', say: 'Kapalbhati. Push the breath out from the belly, about one a second. The breath in comes by itself.', show: 'Kapalbhati' }, 9);
  for (let r = 0; r < n.kapal; r++) {
    add({ part: 'kapalbhati', say: r === 0 ? 'Round one. Begin.' : r === 1 ? 'Round two. Begin.' : 'Round three. Begin.', show: ['Round 1', 'Round 2', 'Round 3'][r] }, 3);
    for (let b = 0; b < 30; b++) add({ part: 'kapalbhati', tick: true, show: 'Out', circle: { to: 0.6, secs: 1 } }, 1);
    add({ part: 'kapalbhati', chime: true, say: 'Stop. One deep breath in. Slowly out. Rest.', show: 'Deep breath in', circle: { to: 1, secs: 4 } }, 4);
    add({ part: 'kapalbhati', show: 'Slowly out', circle: { to: 0.55, secs: 6 } }, 6);
    add({ part: 'kapalbhati', show: 'Rest', circle: { to: 0.7, secs: 2 } }, 8);
  }

  // Anulom Vilom: nasagra mudra; in left 4, out right 6, in right 4, out left 6. Words for two rounds, then the chime.
  add({ part: 'anulom', say: 'Anulom Vilom. Right hand: thumb by the right nostril, ring finger by the left. Breathe slowly, never forced. Close the right nostril.', show: 'Anulom Vilom' }, 12);
  for (let r = 0; r < n.anulom; r++) {
    const talk = r < 2;
    add({ part: 'anulom', side: 'left', chime: !talk && r > 0, say: talk ? 'In through the left.' : undefined, show: 'In · left', circle: { to: 1, secs: 4 } }, 4);
    add({ part: 'anulom', side: 'right', chime: !talk, say: talk ? 'Out through the right.' : undefined, show: 'Out · right', circle: { to: 0.55, secs: 6 } }, 6);
    add({ part: 'anulom', side: 'right', say: talk ? 'In through the right.' : undefined, show: 'In · right', circle: { to: 1, secs: 4 } }, 4);
    add({ part: 'anulom', side: 'left', chime: !talk, say: talk ? 'Out through the left.' : undefined, show: 'Out · left', circle: { to: 0.55, secs: 6 } }, 6);
  }

  // Bhramari: in 4, a long even hum 9. Words for two rounds, then silence with the circle.
  add({ part: 'bhramari', chime: true, say: 'Rest the hand. Bhramari. Breathe in through the nose, then hum like a bee, long and even. You may close your ears with the thumbs.', show: 'Bhramari · the bee' }, 12);
  for (let r = 0; r < n.bhramari; r++) {
    add({ part: 'bhramari', say: r < 2 ? 'In.' : undefined, show: 'In', circle: { to: 1, secs: 4 } }, 4);
    add({ part: 'bhramari', say: r < 2 ? 'Hum.' : undefined, show: 'Hmmm', circle: { to: 0.55, secs: 9 } }, 9);
  }

  // Om: long A-U-M.
  add({ part: 'om', say: n.oms > 1 ? 'Now three long Oms. Aaa, ooo, mmm.' : 'Now one long Om. Aaa, ooo, mmm.', show: 'Om' }, 6);
  for (let r = 0; r < n.oms; r++) {
    add({ part: 'om', show: 'In', circle: { to: 1, secs: 4 } }, 4);
    add({ part: 'om', show: 'Aaa · ooo · mmm', circle: { to: 0.55, secs: 12 } }, 12);
  }

  // Stillness (CYP Dhyana), then close.
  add({ part: 'still', chime: true, say: 'Sit still. A gentle focus between the eyebrows. Watch the breath. Let the thoughts settle.', show: 'Stillness', circle: { to: 0.72, secs: 4 } }, n.still);
  add({ part: 'close', chime: true, say: 'Rub your palms together. Place them over your eyes. And slowly, open your eyes.', show: 'Palms over the eyes' }, 14);
  return { events: ev, total: t };
}

/** Every line Myra speaks or shows, for the voice to be made ready before the session starts. */
export const mixLines = (minutes: number) => Array.from(new Set(mixScript(minutes).events.flatMap(e => [e.say, e.show]).filter((x): x is string => !!x)));
export const MIX_PARTS: MixPart[] = ['arrive', 'bhastrika', 'kapalbhati', 'anulom', 'bhramari', 'om', 'still', 'close'];
export const MIX_NAMES: Record<MixPart, string> = { arrive: 'Arrive', bhastrika: 'Bhastrika', kapalbhati: 'Kapalbhati', anulom: 'Anulom Vilom', bhramari: 'Bhramari', om: 'Om', still: 'Stillness', close: 'Close' };

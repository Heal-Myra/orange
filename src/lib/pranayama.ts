// Guided pranayama (founder, 24 Oct 2026): Happy Orange's own guided breathing sessions. Each practice is a rhythm of
// breaths (in, hold, out, pump, hum…), shown by a breathing circle and spoken by Myra. Myra's mix follows the classic
// order (energising first, then balancing, then calming, then stillness); at night only calming practices.
// Teaching texts are our own wording of well-known, traditional practices. Not medical advice.

export type PhaseKind = 'in' | 'hold' | 'out' | 'pump' | 'hum' | 'chant' | 'rest';
export type Side = 'left' | 'right';
export interface Phase { kind: PhaseKind; seconds: number; side?: Side; cue: string } // cue: short words, English (tr in the app)

export type PracticeId = 'mix' | 'anulom' | 'bhastrika' | 'kapalbhati' | 'bhramari' | 'ujjayi' | 'sheetali' | 'box' | 'udgeeth' | 'nidra';

export interface Practice {
  id: PracticeId;
  name: string;          // English name as commonly known in India
  hindi: string;
  line: string;          // what it is, one line
  how: string;           // how to sit and do it, spoken at the start
  energising?: boolean;  // not at night
  caution?: string;      // who should go gently or skip it
  cycle?: Phase[];       // one round; repeats until the time is up
  rounds?: { breaths: number; rest: number }; // for pumping practices: N quick breaths, then natural rest
}

const p = (kind: PhaseKind, seconds: number, cue: string, side?: Side): Phase => ({ kind, seconds, cue, side });

export const PRACTICES: Practice[] = [
  { id: 'mix', name: "Myra's mix", hindi: 'मायरा का मिश्रण', line: 'A balanced sequence chosen for your time of day.', how: '' },
  { id: 'anulom', name: 'Anulom Vilom', hindi: 'अनुलोम विलोम', line: 'Alternate-nostril breathing. Balancing and calming.',
    how: 'Sit tall. Rest your left hand on your knee. With your right thumb close the right nostril, and use your ring finger for the left. Breathe slowly, without strain.',
    cycle: [p('in', 4, 'Breathe in slowly, through the left', 'left'), p('out', 6, 'And out, through the right', 'right'), p('in', 4, 'In, through the right', 'right'), p('out', 6, 'And out, through the left', 'left')] },
  { id: 'bhastrika', name: 'Bhastrika', hindi: 'भस्त्रिका', line: 'Bellows breath. Full, strong breaths in and out through the nose. Energising.', energising: true,
    caution: 'Skip if pregnant, or with high blood pressure, heart disease, hernia or recent surgery. Not on a full stomach. Stop if dizzy.',
    how: 'Sit tall. Breathe in and out fully and strongly through the nose, filling and emptying the chest. Keep it steady, not jerky.',
    cycle: [p('in', 1.5, 'In'), p('out', 1.5, 'Out')], rounds: { breaths: 15, rest: 20 } },
  { id: 'kapalbhati', name: 'Kapalbhati', hindi: 'कपालभाति', line: 'Skull-shining breath. Short pumps out from the belly; the breath in happens by itself.', energising: true,
    caution: 'Skip if pregnant, during periods, or with high blood pressure, heart disease, hernia or recent abdominal surgery. Empty stomach only. Stop if dizzy.',
    how: 'Sit tall, hands on knees. Push the breath out through the nose by pulling the belly in sharply. Let the breath in come by itself.',
    cycle: [p('pump', 1, 'Out')], rounds: { breaths: 30, rest: 20 } },
  { id: 'bhramari', name: 'Bhramari', hindi: 'भ्रामरी', line: 'Humming-bee breath. A soft hum on the out-breath. Deeply calming.',
    how: 'Close your eyes. Gently close your ears with your thumbs and rest your fingers over your eyes. Breathe in, then hum softly like a bee as you breathe out.',
    cycle: [p('in', 4, 'Breathe in gently'), p('hum', 8, 'Hum softly, like a bee')] },
  { id: 'ujjayi', name: 'Ujjayi', hindi: 'उज्जायी', line: 'Ocean breath. A soft sound in the throat, slow and even. Calming.',
    how: 'Narrow the back of your throat a little, so the breath makes a soft ocean sound. Breathe slowly through the nose.',
    cycle: [p('in', 5, 'Breathe in, with a soft ocean sound'), p('out', 7, 'And out, slowly')] },
  { id: 'sheetali', name: 'Sheetali', hindi: 'शीतली', line: 'Cooling breath through a rolled tongue. Good on hot days and when angry.',
    caution: 'Skip with a cold, cough or asthma, or on a cold day.',
    how: 'Roll your tongue into a tube, or breathe through closed teeth if you cannot roll it. Breathe in through the mouth, close it, and breathe out through the nose.',
    cycle: [p('in', 4, 'In, through the tongue'), p('hold', 2, 'Hold'), p('out', 6, 'Out, through the nose')] },
  { id: 'box', name: 'Sama Vritti (box)', hindi: 'सम वृत्ति', line: 'Equal breathing: in, hold, out, hold, four counts each. Steadies the mind.',
    how: 'Sit comfortably. Breathe through the nose, in four equal parts: in, hold, out, hold.',
    cycle: [p('in', 4, 'In'), p('hold', 4, 'Hold'), p('out', 4, 'Out'), p('hold', 4, 'Hold')] },
  { id: 'udgeeth', name: 'Udgeeth (Om)', hindi: 'उद्गीथ', line: 'Chanting Om on a long out-breath. Settles the mind before stillness.',
    how: 'Breathe in deeply. As you breathe out, chant a long, soft Om: mostly O, then a gentle M.',
    cycle: [p('in', 4, 'Breathe in deeply'), p('chant', 10, 'Chant a long, soft Om')] },
  { id: 'nidra', name: 'Yoga Nidra (lying down)', hindi: 'योग निद्रा', line: 'Deep rest lying down, about 15 minutes. Best at bedtime.', how: '' },
];

export const practice = (id: PracticeId) => PRACTICES.find(x => x.id === id)!;

export interface Segment { id: Exclude<PracticeId, 'mix' | 'nidra'> | 'still'; seconds: number }

/** The session plan: one practice for the whole time, or Myra's mix in the classic order. At night (after 8 pm or
 *  before 5 am) the mix leaves out the energising breaths. Always ends with a short stillness. */
export function sessionPlan(choice: PracticeId, minutes: number, hour = new Date().getHours(), gentle = false, care?: Segment['id'][]): Segment[] {
  const total = minutes * 60;
  const still = Math.min(120, Math.max(45, Math.round(total * 0.12)));
  if (choice !== 'mix') return [{ id: choice as Segment['id'], seconds: total - still }, { id: 'still', seconds: still }];
  // A care plan (e.g. for a cold) sets the mix: its practices share the time equally (founder, 25 Oct 2026).
  if (care?.length) {
    const body = total - still, each = Math.round(body / care.length / 5) * 5;
    const segs = care.map(id => ({ id, seconds: each }));
    segs[segs.length - 1].seconds += body - segs.reduce((t, s) => t + s.seconds, 0);
    return [...segs, { id: 'still', seconds: still }];
  }
  const night = hour >= 20 || hour < 5 || gentle; // unwell or tired: calming breaths only (24 Oct 2026)
  const parts: [Segment['id'], number][] = night
    ? (minutes <= 5 ? [['anulom', 0.55], ['bhramari', 0.45]] : minutes <= 10 ? [['ujjayi', 0.2], ['anulom', 0.45], ['bhramari', 0.35]]
      : [['ujjayi', 0.15], ['anulom', 0.4], ['bhramari', 0.3], ['udgeeth', 0.15]])
    : (minutes <= 5 ? [['bhastrika', 0.25], ['anulom', 0.45], ['bhramari', 0.3]]
      : minutes <= 10 ? [['bhastrika', 0.2], ['kapalbhati', 0.2], ['anulom', 0.4], ['bhramari', 0.2]]
      : [['bhastrika', 0.15], ['kapalbhati', 0.15], ['anulom', 0.35], ['bhramari', 0.2], ['udgeeth', 0.15]]);
  const body = total - still;
  const segs = parts.map(([id, share]) => ({ id, seconds: Math.round((body * share) / 5) * 5 }));
  segs[segs.length - 1].seconds += body - segs.reduce((t, s) => t + s.seconds, 0); // exact total
  return [...segs, { id: 'still', seconds: still }];
}

/** The breaths of one segment, in order, filling its time (the last breath is never cut in half). */
export function phasesFor(seg: Segment): Phase[] {
  if (seg.id === 'still') return [{ kind: 'rest', seconds: seg.seconds, cue: 'Sit still. Let the breath be natural.' }];
  const pr = practice(seg.id);
  const out: Phase[] = [];
  let t = 0;
  const push = (ph: Phase) => { out.push(ph); t += ph.seconds; };
  while (t < seg.seconds) {
    if (pr.rounds) {
      for (let i = 0; i < pr.rounds.breaths && t < seg.seconds; i++) pr.cycle!.forEach(push);
      if (t < seg.seconds) push({ kind: 'rest', seconds: Math.min(pr.rounds.rest, Math.max(1, seg.seconds - t)), cue: 'Rest. Breathe naturally.' });
    } else {
      const len = pr.cycle!.reduce((a, b) => a + b.seconds, 0);
      if (t + len > seg.seconds + len / 2) break;
      pr.cycle!.forEach(push);
    }
  }
  return out;
}

export const segmentName = (id: Segment['id']) => (id === 'still' ? 'Stillness' : practice(id).name);

// Care plan (founder, 25 Oct 2026): "the moment a problem is known, every element that can help gets activated: food,
// exercise, meditation and other activities." When the person says how they feel (e.g. a cold), Happy Orange switches on
// a plan across the app: food and drink, a breathing session made for it, how much to move, rest, what to avoid and when to
// see a doctor. Everyday, traditional, evidence-aware self-care; never a diagnosis or a medicine.

import type { Symptom } from './feeling';
import type { Segment } from './pranayama';

export interface Care {
  name: string;        // e.g. "your cold"
  food: string[];      // what to eat and drink
  move: string;        // movement today
  rest: string;
  avoid: string[];
  breath: Segment['id'][]; // breathing practices, in order (stillness is added at the end)
  doctor?: string;
}

const CARE: Partial<Record<Symptom, Care>> = {
  cold: { name: 'your cold', food: ['Warm water through the day', 'Ginger-tulsi tea with honey', 'Haldi milk at night', 'Hot soup or rasam; light, warm meals'],
    move: 'A gentle 20-minute walk, well covered; no hard workout.', rest: 'Sleep early; steam your nose for 5 minutes before bed.',
    avoid: ['Cold drinks, ice cream and curd at night', 'Fried, heavy food'], breath: ['anulom', 'ujjayi', 'bhramari'],
    doctor: 'See a doctor if it lasts over a week, with a high fever, or with breathlessness.' },
  cough: { name: 'your cough', food: ['Warm water with honey', 'Ginger-tulsi tea', 'Haldi milk at night', 'Warm, soft food'],
    move: 'An easy walk only; rest your voice.', rest: 'Steam twice a day; sleep with your head a little raised.',
    avoid: ['Cold and fried food', 'Strong breathing (Kapalbhati, Bhastrika)'], breath: ['anulom', 'bhramari'],
    doctor: 'See a doctor if it lasts over two weeks, brings up blood, or with breathlessness.' },
  fever: { name: 'your fever', food: ['Plenty of fluids: water, ORS, coconut water', 'Light food: khichdi, dal water, soup', 'Fruit such as banana or papaya'],
    move: 'No exercise today; rest.', rest: 'Rest as much as you can; a short Yoga Nidra lying down.',
    avoid: ['Exercise and strong breathing', 'Heavy, oily food'], breath: ['nidra' as Segment['id']],
    doctor: 'See a doctor if over 3 days, very high, or with breathlessness, a rash or a stiff neck.' },
  headache: { name: 'your headache', food: ['Two glasses of water now', 'Regular, light meals; do not skip one'],
    move: 'A slow walk in fresh air.', rest: 'Rest your eyes; less screen time today.', avoid: ['Long screen time', 'Too much tea or coffee'],
    breath: ['bhramari', 'anulom'], doctor: 'See a doctor at once if it is sudden and severe.' },
  bodyache: { name: 'your body ache', food: ['Warm fluids', 'Haldi milk', 'Protein at each meal'], move: 'Gentle stretching only.',
    rest: 'Warmth and rest; an early night.', avoid: ['Hard workouts'], breath: ['anulom', 'bhramari'] },
  tired: { name: 'your tiredness', food: ['Water first', 'A protein-rich breakfast', 'Fruit and nuts as a snack'], move: 'An easy walk instead of a hard workout.',
    rest: 'A short rest after lunch; sleep early.', avoid: ['Caffeine after noon'], breath: ['anulom', 'bhramari'] },
  stomach: { name: 'your upset stomach', food: ['ORS or coconut water', 'Khichdi, curd rice, banana', 'Small, plain meals'], move: 'Rest; a short, slow walk if you feel well.',
    rest: 'Rest and fluids.', avoid: ['Spicy, oily and raw food', 'Kapalbhati and Bhastrika'], breath: ['anulom', 'bhramari'],
    doctor: 'See a doctor if there is blood, severe pain, or signs of dehydration.' },
  period: { name: 'your period pain', food: ['Warm water and ginger tea', 'Iron-rich food: spinach, dates, jaggery', 'Light, warm meals'],
    move: 'A gentle walk; no strong core work.', rest: 'Warmth on the belly; rest.', avoid: ['Kapalbhati, Bhastrika and upside-down poses'], breath: ['anulom', 'bhramari'] },
  stressed: { name: 'your stress', food: ['Regular meals', 'Warm milk or herbal tea in the evening'], move: 'A walk outside, ideally in green.',
    rest: 'Fewer to-dos today, one at a time.', avoid: ['Late-night screens', 'Too much caffeine'], breath: ['anulom', 'bhramari', 'box'] },
  sleepless: { name: 'last night\'s poor sleep', food: ['Water and a good breakfast', 'No caffeine after noon'], move: 'An easy walk; no hard workout today.',
    rest: 'A 20-minute rest after lunch; an early, screen-free evening.', avoid: ['Caffeine after noon', 'Late screens'], breath: ['anulom', 'bhramari'] },
};

/** The care plan for today's symptoms (several are merged: the first symptom leads). */
export function carePlan(symptoms: Symptom[]): Care | null {
  const list = symptoms.map(s => CARE[s]).filter((c): c is Care => !!c);
  if (!list.length) return null;
  const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));
  return {
    name: list.map(c => c.name).join(' and '),
    food: uniq(list.flatMap(c => c.food)).slice(0, 5),
    move: list.some(c => /No exercise/.test(c.move)) ? list.find(c => /No exercise/.test(c.move))!.move : list[0].move,
    rest: list[0].rest,
    avoid: uniq(list.flatMap(c => c.avoid)).slice(0, 4),
    breath: list.some(c => c.breath.includes('nidra' as Segment['id'])) ? ['nidra' as Segment['id']] : uniq(list.flatMap(c => c.breath)).slice(0, 3),
    doctor: list.map(c => c.doctor).filter(Boolean).join(' ') || undefined,
  };
}

export type CarePart = 'food' | 'breath' | 'move' | 'rest';

/** Which card an "avoid" line belongs in. */
export function avoidPart(a: string): CarePart {
  if (/Kapalbhati|Bhastrika|breathing/i.test(a)) return 'breath';
  if (/exercise|workout|poses|core/i.test(a)) return 'move';
  if (/screen/i.test(a)) return 'rest';
  return 'food';
}

/** The care lines for one card (founder, 25 Oct 2026: each part goes into the card where it is done). */
export function careFor(c: Care, part: CarePart): { lines: string[]; avoid: string[] } {
  const avoid = c.avoid.filter(a => avoidPart(a) === part);
  const nidra = (c.breath as string[]).includes('nidra');
  const lines = part === 'food' ? c.food : part === 'move' ? [c.move] : part === 'rest' ? [c.rest]
    : [nidra ? 'Yoga Nidra, lying down, to rest deeply.' : 'A 10-minute care session, made for this.'];
  return { lines, avoid };
}

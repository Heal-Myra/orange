// Know your nature, prakriti (founder, 16 Nov 2026; idea 9): 12 short questions from the Ayurveda tradition, asked once.
// The result shapes the Food master's tips (cooling, warming, lighter). A tradition to explore, never a diagnosis.
// Each question has three answers, in the order Vata, Pitta, Kapha. Kept in me.prakriti.

export type Dosha = 'vata' | 'pitta' | 'kapha';
export const DOSHAS: Dosha[] = ['vata', 'pitta', 'kapha'];
export interface Prakriti { answers: number[]; result: string; date: string }

export const QUESTIONS: { q: string; a: [string, string, string] }[] = [
  { q: 'Your build?', a: ['Slim, light, hard to gain', 'Medium, muscular', 'Solid, gains easily'] },
  { q: 'Your skin?', a: ['Dry, cool', 'Warm, easily red', 'Smooth, a little oily'] },
  { q: 'How is your appetite usually?', a: ['Irregular, varies', 'Strong, I get irritable if late', 'Steady, can skip easily'] },
  { q: 'Your digestion?', a: ['Gas or bloating at times', 'Quick, sometimes acidity', 'Slow, heavy after meals'] },
  { q: 'How do you handle weather?', a: ['Dislike cold and wind', 'Dislike heat', 'Dislike damp and cold'] },
  { q: 'Your sleep?', a: ['Light, wake easily', 'Sound but short', 'Deep and long'] },
  { q: 'Your energy through the day?', a: ['Comes in bursts', 'Strong and focused', 'Steady, slow to start'] },
  { q: 'How do you speak?', a: ['Fast, many topics', 'Sharp, to the point', 'Slow, calm'] },
  { q: 'Under stress you become…', a: ['Anxious, worried', 'Irritable, angry', 'Withdrawn, stuck'] },
  { q: 'How do you learn?', a: ['Quickly, forget quickly', 'Sharply, remember well', 'Slowly, never forget'] },
  { q: 'Your walk?', a: ['Quick, light', 'Purposeful', 'Slow, steady'] },
  { q: 'Your mind is mostly…', a: ['Creative, restless', 'Driven, organised', 'Calm, caring'] },
];

const NAME: Record<Dosha, string> = { vata: 'Vata', pitta: 'Pitta', kapha: 'Kapha' };

/** Counts per dosha, and the name: one dosha, or two when the second is close (at least 70% of the first). */
export function prakritiOf(answers: number[]): { counts: Record<Dosha, number>; main: Dosha[]; result: string } {
  const counts: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
  answers.forEach(a => { const d = DOSHAS[a]; if (d) counts[d]++; });
  const order = [...DOSHAS].sort((a, b) => counts[b] - counts[a]);
  const main = counts[order[1]] >= counts[order[0]] * 0.7 && counts[order[1]] > 0 ? order.slice(0, 2) : order.slice(0, 1);
  return { counts, main, result: main.map(d => NAME[d]).join('–') };
}

/** The first dosha's few words and the Food master's everyday tip (no medical claims). */
export const ABOUT: Record<Dosha, { words: string; tip: string; ai: string }> = {
  vata: { words: 'Light, quick, creative.', tip: 'Warm, cooked meals at regular times.', ai: 'warm, cooked, slightly oily food at regular times; ghee, soups, khichdi; fewer cold or raw foods' },
  pitta: { words: 'Warm, sharp, quick to act.', tip: 'Cooling lunch: curd rice or chaas on hot days.', ai: 'cooling foods: curd, chaas, cucumber, coconut water; less very spicy, fried or sour food; never skip meals' },
  kapha: { words: 'Steady, calm, strong.', tip: 'Lighter dinner, a little ginger or pepper.', ai: 'light, warm, lightly spiced food; millets and pulses; lighter dinners; less sweet, heavy or fried food' },
};

/** One line for Myra's context, so the Food master can lean on it. */
export const prakritiLine = (p?: Prakriti) => {
  if (!p) return '';
  const { main } = prakritiOf(p.answers);
  return `Ayurveda nature (prakriti, their own quiz; a tradition, not a diagnosis): ${p.result}. The Food master may lean towards ${ABOUT[main[0]].ai}.`;
};

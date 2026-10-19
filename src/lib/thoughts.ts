// Thought of the day: short original reflections written for Happy Orange, drawing on the Orange Book's principles,
// the Gita's teaching on duty and equanimity, and the Tao's returning and gentleness. One per day, in a fixed rotation.

export const THOUGHTS: string[] = [
  'Food is the first medicine. What I eat today becomes the body I live in tomorrow.',
  'I do not need to be perfect today, only a little more truthful than yesterday.',
  'Do the work in front of you fully, and loosen your grip on how it turns out.',
  'Peace is not ahead of me waiting to be caught. It is where I return when I stop running.',
  'Fairness begins in small things: a fair word, a fair share, a fair hearing.',
  'Every body is different. Listen to mine with the same care I would give a friend.',
  'The mind settles like muddy water: not by stirring harder, but by being left still.',
  'Understanding why matters more than counting how much.',
  'Serve someone today and expect nothing back. Notice how light that feels.',
  'Gentleness is strength that has nothing to prove.',
  'Before I react, one full breath out. Then choose.',
  'What I give my eyes to all day, my mind becomes.',
  'Contentment is not having everything; it is needing less of what I do not need.',
  'Let the day be a little slower than my thoughts want it to be.',
  'Truth spoken kindly heals; truth spoken to win only wounds.',
  'Rest is not laziness. A field left fallow grows the next harvest.',
  'Nature first: sunlight, a walk, real food, sound sleep. The simple things are the strong things.',
  'Equal in praise and blame, I can work without fear.',
  'Every exhale is a small letting go. Practise it a hundred times today.',
  'I am responsible for my effort, not for the whole world.',
  'Gratitude turns what I have into enough.',
  'Progress, not perfection: one small kept promise is worth more than a big broken one.',
  'Speak less, listen more, and learn what the silence was trying to say.',
  'Harm none in word, deed or diet, beginning with myself.',
  'The river does not hurry, yet it reaches the sea.',
  'When the door will not open, perhaps it opens towards me. Step back.',
  'My duty done with love becomes my worship.',
  'What I resist grows heavier; what I accept I can begin to change.',
  'Before asking the world to be kinder, be the kindness in one room.',
  'A calm mind is not an empty one; it is a mind that is not being pulled.',
  'Come back to the breath, come back to the body, come back to the present. Returning is the practice.',
];

export function thoughtOfDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const n = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return THOUGHTS[((n % THOUGHTS.length) + THOUGHTS.length) % THOUGHTS.length];
}

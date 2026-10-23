// Tomorrow's food plan (founder, 23 Oct 2026): Myra plans the next day's meals around the person's targets and goal,
// the person tweaks or finalises it, and sends it on WhatsApp (to the cook, a family member, or themselves) with each
// dish's ingredients and how to make it. A short (about one minute) video is added only for dishes the person asks for.

export type Slot = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export interface PlannedMeal {
  slot: Slot;
  dish: string;
  portion: string;                 // per person, e.g. "2 chillas with 1 katori curd"
  kcal: number; protein: number; fibre: number; // per person
  ingredients: { item: string; qty: string }[]; // for the number of people in the plan
  steps: string[];                 // how to make it, short and clear
  video?: boolean;                 // the person asked for the short video of this dish
}

export interface FoodPlan {
  date: string;                    // the day the plan is for
  people: number;                  // ingredient quantities are for this many people
  meals: PlannedMeal[];
  note?: string;                   // Myra's one line on why this plan
  final?: boolean;                 // the person has finalised it
  messages?: Record<string, string>; // the WhatsApp message already translated, by language code
  madeAt: string;
}

export const planTotals = (p: FoodPlan) => p.meals.reduce(
  (t, m) => ({ kcal: t.kcal + (m.kcal || 0), protein: t.protein + (m.protein || 0), fibre: t.fibre + (m.fibre || 0) }),
  { kcal: 0, protein: 0, fibre: 0 });

/** A search for short videos (YouTube Shorts) of the dish. Only offered when the person asks for it. */
export const videoLink = (dish: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${dish} recipe #shorts`)}`;

/** The WhatsApp message: the day's menu, then each dish with ingredients, steps and (if asked) the video. */
export function planMessage(p: FoodPlan, labels: { title: string; slot: Record<Slot, string>; ingredients: string; how: string; video: string; forPeople: string }): string {
  const lines = [`*${labels.title}*`, labels.forPeople, ''];
  for (const m of p.meals) {
    lines.push(`*${labels.slot[m.slot]}: ${m.dish}*`);
    if (m.portion) lines.push(m.portion);
    if (m.ingredients.length) {
      lines.push(`_${labels.ingredients}_`);
      for (const x of m.ingredients) lines.push(`• ${x.item}${x.qty ? ` – ${x.qty}` : ''}`);
    }
    if (m.steps.length) {
      lines.push(`_${labels.how}_`);
      m.steps.forEach((st, i) => lines.push(`${i + 1}. ${st}`));
    }
    if (m.video) lines.push(`${labels.video}: ${videoLink(m.dish)}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

/** Opens WhatsApp with the message ready; the person picks the contact there. */
export const whatsappLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Clean up what the AI sent, so the screen never breaks on a missing field. */
export function cleanPlan(raw: unknown, date: string, people: number): FoodPlan {
  const r = (raw ?? {}) as { meals?: unknown[]; note?: unknown };
  const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0; };
  const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const meals = (Array.isArray(r.meals) ? r.meals : []).map((m): PlannedMeal | null => {
    const x = (m ?? {}) as Record<string, unknown>;
    const slot = SLOTS.includes(x.slot as Slot) ? (x.slot as Slot) : null;
    const dish = str(x.dish, 80);
    if (!slot || !dish) return null;
    return {
      slot, dish, portion: str(x.portion, 140),
      kcal: num(x.kcal), protein: num(x.protein_g ?? x.protein), fibre: num(x.fibre_g ?? x.fibre),
      ingredients: (Array.isArray(x.ingredients) ? x.ingredients : []).slice(0, 20)
        .map(i => ({ item: str((i as Record<string, unknown>)?.item, 60), qty: str((i as Record<string, unknown>)?.qty, 40) }))
        .filter(i => i.item),
      steps: (Array.isArray(x.steps) ? x.steps : []).slice(0, 10).map(st => str(st, 240)).filter(Boolean),
    };
  }).filter((m): m is PlannedMeal => !!m)
    .sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
  return { date, people, meals, note: str(r.note, 200) || undefined, madeAt: new Date().toISOString() };
}

/** Languages for the WhatsApp message (founder, 23 Oct 2026: "add Hindi and regional languages"). Native name first. */
export const MESSAGE_LANGS: { code: string; name: string; english: string }[] = [
  { code: 'en', name: 'English', english: 'English' }, { code: 'hi', name: 'हिन्दी', english: 'Hindi' },
  { code: 'mr', name: 'मराठी', english: 'Marathi' }, { code: 'bn', name: 'বাংলা', english: 'Bengali' },
  { code: 'gu', name: 'ગુજરાતી', english: 'Gujarati' }, { code: 'pa', name: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'ta', name: 'தமிழ்', english: 'Tamil' }, { code: 'te', name: 'తెలుగు', english: 'Telugu' },
  { code: 'kn', name: 'ಕನ್ನಡ', english: 'Kannada' }, { code: 'ml', name: 'മലയാളം', english: 'Malayalam' },
  { code: 'or', name: 'ଓଡ଼ିଆ', english: 'Odia' }, { code: 'ur', name: 'اردو', english: 'Urdu' },
  { code: 'as', name: 'অসমীয়া', english: 'Assamese' },
];

/** English labels: the message is written in English first, then Myra translates it when another language is chosen. */
export const ENGLISH_LABELS = (day: string, people: number) => ({
  title: `Food for ${day}`, forPeople: people === 1 ? 'Quantities for 1 person' : `Quantities for ${people} people`,
  slot: { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' } as Record<Slot, string>,
  ingredients: 'Ingredients', how: 'How to make', video: 'Video (about 1 minute)',
});

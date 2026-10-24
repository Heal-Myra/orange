// "How do you feel today?" (founder, 24 Oct 2026): a quick check-in on Today. Once the person says how they feel
// (e.g. a cold), every suggestion from Myra — food, movement, breathing, sleep, tomorrow's food — is made in light of it.
// Not a diagnosis: Myra suggests gentle, everyday care and says when to see a doctor.

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'unwell';
export type Symptom = 'cold' | 'cough' | 'fever' | 'headache' | 'bodyache' | 'tired' | 'stomach' | 'period' | 'stressed' | 'sleepless';

export interface Feeling { mood: Mood; symptoms: Symptom[]; note?: string; at: string }

export const MOODS: { id: Mood; label: string; icon: string }[] = [
  { id: 'great', label: 'Great', icon: 'sunny-outline' }, { id: 'good', label: 'Good', icon: 'happy-outline' },
  { id: 'okay', label: 'Okay', icon: 'remove-circle-outline' }, { id: 'low', label: 'Low', icon: 'cloudy-outline' },
  { id: 'unwell', label: 'Unwell', icon: 'medkit-outline' },
];

export const SYMPTOMS: { id: Symptom; label: string }[] = [
  { id: 'cold', label: 'Cold' }, { id: 'cough', label: 'Cough' }, { id: 'fever', label: 'Fever' }, { id: 'headache', label: 'Headache' },
  { id: 'bodyache', label: 'Body ache' }, { id: 'tired', label: 'Tired' }, { id: 'stomach', label: 'Upset stomach' },
  { id: 'period', label: 'Period pain' }, { id: 'stressed', label: 'Stressed' }, { id: 'sleepless', label: 'Slept badly' },
];

/** Care hints for Myra, so her suggestions fit how the person feels. Everyday, gentle, evidence-aware. */
const CARE: Record<Symptom, string> = {
  cold: 'cold: warm fluids (water, soup, haldi milk, ginger-tulsi tea), steam, rest; no cold drinks or ice cream; only gentle walks; no Sheetali; warm, light food',
  cough: 'cough: warm water with honey (not for babies), steam, rest the voice; avoid cold and fried food; gentle breathing only, no Kapalbhati or Bhastrika',
  fever: 'fever: rest and fluids; no exercise and no strong breathing practices; light food (khichdi, soup); see a doctor if over 3 days, very high, or with breathlessness, rash or stiff neck',
  headache: 'headache: water, rest the eyes, less screen time, fresh air, Bhramari; see a doctor if sudden and severe',
  bodyache: 'body ache: rest, warmth, gentle stretching only, fluids; no hard workout',
  tired: 'tired: shorter and easier tasks, an easy walk instead of hard exercise, an early night, Yoga Nidra',
  stomach: 'upset stomach: light food (khichdi, curd rice, banana, ORS or coconut water), small portions, no spicy, oily or raw salads; no Kapalbhati; see a doctor if blood, severe pain or signs of dehydration',
  period: 'period pain: warmth on the belly, gentle walks, rest; no Kapalbhati or Bhastrika or inversions; iron-rich food',
  stressed: 'stressed: fewer to-dos today, one at a time; Anulom Vilom, Bhramari; a walk outside; reach out to someone close',
  sleepless: 'slept badly: no hard exercise today, a short daytime rest, no caffeine after noon, an early, screen-free evening, Yoga Nidra at bedtime',
};

export const feelingLine = (f?: Feeling): string => {
  if (!f) return 'How they feel today: not asked yet.';
  const care = f.symptoms.map(s => CARE[s]).join('; ');
  return `How they feel today: ${f.mood}${f.symptoms.length ? ` with ${f.symptoms.join(', ')}` : ''}${f.note ? ` ("${f.note}")` : ''}. ` +
    (care || f.mood === 'low' || f.mood === 'unwell'
      ? `Make EVERY suggestion fit this (food, movement, breathing, sleep, tasks). Care: ${care || 'go gently: rest, fluids, light food, easier tasks'}. Do not diagnose; say when to see a doctor if relevant.`
      : 'They feel well: normal suggestions.');
};

/** Strong breathing practices are left out of guided sessions today. */
export const gentleToday = (f?: Feeling) => !!f && (f.mood === 'unwell' || f.symptoms.some(s => ['fever', 'cough', 'cold', 'bodyache', 'stomach', 'period', 'tired'].includes(s)));

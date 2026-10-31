// Face & beauty (founder, 31 Oct 2026): a selfie read by Myra for everyday skin-care points, a guess at how the person looks
// right now (they confirm it in "How do you feel today?"), and two or three kind, playful words for the day.
// Not a diagnosis and never about mental health: a face does not reliably show it (decision 0035).
// The photo is read once and not kept; only these results are saved with the day.

import type { Mood, Symptom } from './feeling';

export type SkinKey = 'dryness' | 'darkCircles' | 'puffiness' | 'redness' | 'breakouts' | 'tan' | 'lips';
export type SkinLevel = 'none' | 'mild' | 'noticeable';

export interface FaceReading {
  at: string;
  witty: string; // two or three warm, playful words, e.g. "Sunny and rested"
  looks: Mood | null; // how the person looks right now, a guess they confirm
  looksNote: string; // e.g. "a little tired"
  hints: Symptom[]; // only 'tired' or 'sleepless'
  skin: Partial<Record<SkinKey, SkinLevel>>;
  tips: string[];
}

export const SKIN: { id: SkinKey; label: string }[] = [
  { id: 'dryness', label: 'Dryness' },
  { id: 'darkCircles', label: 'Dark circles' },
  { id: 'puffiness', label: 'Puffy eyes' },
  { id: 'redness', label: 'Redness' },
  { id: 'breakouts', label: 'Pimples' },
  { id: 'tan', label: 'Sun tan' },
  { id: 'lips', label: 'Dry lips' },
];

export const LEVELS: Record<SkinLevel, string> = { none: 'Clear', mild: 'Mild', noticeable: 'Noticeable' };
const RANK: Record<SkinLevel, number> = { none: 0, mild: 1, noticeable: 2 };

const MOOD_OK: Mood[] = ['great', 'good', 'okay', 'low', 'unwell'];
const SKIN_IDS = SKIN.map(s => s.id);

/** Keep only what the app understands from the AI's answer. */
export function cleanReading(r: Partial<FaceReading> & { skin?: Record<string, unknown> }, at = new Date().toISOString()): FaceReading {
  const skin: FaceReading['skin'] = {};
  for (const [k, v] of Object.entries(r.skin ?? {})) {
    if (SKIN_IDS.includes(k as SkinKey) && (v === 'none' || v === 'mild' || v === 'noticeable')) skin[k as SkinKey] = v;
  }
  return {
    at,
    witty: String(r.witty ?? '').trim().split(/\s+/).slice(0, 4).join(' '),
    looks: MOOD_OK.includes(r.looks as Mood) ? (r.looks as Mood) : null,
    looksNote: String(r.looksNote ?? '').trim().slice(0, 80),
    hints: (r.hints ?? []).filter((h): h is Symptom => h === 'tired' || h === 'sleepless'),
    skin,
    tips: (r.tips ?? []).map(t => String(t).trim()).filter(Boolean).slice(0, 3),
  };
}

/** Better, same or worse than an earlier reading, for one skin point. */
export function skinChange(now?: SkinLevel, before?: SkinLevel): 'better' | 'same' | 'worse' | null {
  if (!now || !before) return null;
  return RANK[now] < RANK[before] ? 'better' : RANK[now] > RANK[before] ? 'worse' : 'same';
}

/** The latest reading before `date` within 30 days, to compare against. */
export function earlierReading(days: Record<string, { face?: FaceReading }>, date: string): { date: string; face: FaceReading } | null {
  const keys = Object.keys(days).filter(d => d < date && days[d]?.face).sort();
  const last = keys[keys.length - 1];
  if (!last) return null;
  const gap = (Date.parse(date) - Date.parse(last)) / 86400000;
  return gap <= 30 ? { date: last, face: days[last].face! } : null;
}

// ---------- Skin score (founder, 31 Oct 2026: "a score displayed as a visual" instead of words) ----------
const POINT: Record<SkinLevel, number> = { none: 100, mild: 60, noticeable: 20 };
/** One skin point out of 100 (clear 100, mild 60, noticeable 20). */
export const pointScore = (l?: SkinLevel) => (l ? POINT[l] : null);
/** The skin score out of 100: the average of the points read. Not part of the Body score. */
export function skinScore(f?: FaceReading): number | null {
  const v = Object.values(f?.skin ?? {}).map(l => POINT[l as SkinLevel]);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

/** Natural remedies Myra can weave into food and movement suggestions (founder: remedies belong in Myra recommends). */
const REMEDY: Record<SkinKey, string> = {
  dryness: 'dryness: more water, a spoon of ghee or soaked almonds, seeds (flax, sesame), cucumber, coconut water',
  darkCircles: 'dark circles: sleep 7–8 hours, iron-rich food (spinach, dates, jaggery, beetroot), less late-night screen, Yoga Nidra',
  puffiness: 'puffy eyes: less salt and pickle, more water, a brisk 10-minute walk in the morning, cold spoon on the eyes',
  redness: 'redness: cooling food (cucumber, curd, coconut water), less very spicy or fried food, sunscreen',
  breakouts: 'pimples: less sugar, fried food and dairy sweets; more fruit, vegetables and water; exercise to sweat, then wash the face',
  tan: 'sun tan: sunscreen and shade at midday, tomatoes, carrots and citrus fruit, walk early morning or evening',
  lips: 'dry lips: water through the day, a little ghee on the lips at night',
};

/** The latest reading on or before `date`, within 7 days (a selfie is not needed every day). */
export function latestReading(days: Record<string, { face?: FaceReading }>, date: string): { date: string; face: FaceReading } | null {
  if (days[date]?.face) return { date, face: days[date].face! };
  const r = earlierReading(days, date);
  return r && (Date.parse(date) - Date.parse(r.date)) / 86400000 <= 7 ? r : null;
}

/** One line for Myra. */
export function faceLine(f?: FaceReading, when?: string): string {
  if (!f) return '';
  const pts = (Object.entries(f.skin) as [SkinKey, SkinLevel][]).filter(([, v]) => v !== 'none');
  const remedies = pts.map(([k]) => REMEDY[k]).join('; ');
  return `Face & skin from a selfie${when ? ` (${when})` : ''}, skin care only, not a diagnosis: skin score ${skinScore(f) ?? '-'}/100; ${pts.map(([k, v]) => `${k} ${v}`).join(', ') || 'skin looks clear'}${f.looksNote ? `; looks ${f.looksNote}` : ''}.` +
    (remedies ? ` Remedies to weave into food and movement suggestions: ${remedies}.` : '');
}

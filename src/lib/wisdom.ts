// Daily Wisdom: one passage a day from the person's chosen tradition (asked once after sign-up, changeable in Profile).
// Hindu uses the Bhagavad Gita (src/lib/gita.ts). The others come from assets/data/wisdom.json, built from
// free-to-use sources by scripts/build-wisdom.js (sources and licences: docs/decisions/0009-daily-wisdom.md).

import data from '../../assets/data/wisdom.json';

export type Tradition = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'christian' | 'islam' | 'universal';

export const TRADITIONS: { id: Tradition; name: string; text: string; ready: boolean }[] = [
  { id: 'hindu', name: 'Hindu', text: 'Bhagavad Gita', ready: true },
  { id: 'sikh', name: 'Sikh', text: 'Japji Sahib, Guru Granth Sahib', ready: true },
  { id: 'buddhist', name: 'Buddhist', text: 'Dhammapada', ready: true },
  { id: 'jain', name: 'Jain', text: 'Coming soon (Universal wisdom until then)', ready: false },
  { id: 'christian', name: 'Christian', text: 'The Bible', ready: true },
  { id: 'islam', name: 'Muslim', text: "The Qur'an", ready: true },
  { id: 'universal', name: 'Universal wisdom', text: 'Sayings across traditions', ready: true },
];

export const traditionName = (t?: Tradition | null) => TRADITIONS.find(x => x.id === t)?.name ?? 'Hindu';

export interface Passage { id: string; ref: string; original?: string; translit?: string; english?: string; lang?: string }
type Collection = { name: string; source: string; items: Passage[] };
const sets = data as unknown as Record<Exclude<Tradition, 'hindu' | 'jain'>, Collection>;

/** Which collection a tradition reads from (Jain falls back to Universal until its texts are added). */
const setOf = (t: Tradition) => (t === 'jain' ? sets.universal : t === 'hindu' ? null : sets[t]);

export const sourceOf = (t: Tradition) => setOf(t)?.source ?? 'Bhagavad Gita (Sanskrit, public domain)';

/** The passage for a date (same passage for everyone on the same day and tradition). */
export function passageOfDay(t: Tradition, isoDate: string): Passage | null {
  const set = setOf(t);
  if (!set) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const n = set.items.length;
  return set.items[(((dayNumber * 7) % n) + n) % n];
}

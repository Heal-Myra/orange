// Bhagavad Gita: all 701 verses in Sanskrit with transliteration, plus chapter names and summaries.
// Source: the open-source gita/gita project (Unlicense). The Sanskrit text is public domain.
// Modern translations are under copyright and are deliberately not bundled.

import raw from '../../assets/data/gita.json';

export interface Chapter { n: number; name: string; translit: string; meaning: string; count: number; summary: string; summary_hi: string }
export interface Verse { id: number; chapter: number; verse: number; sanskrit: string; transliteration: string }

const data = raw as unknown as { chapters: Chapter[]; verses: [number, number, number, string, string][] };

export const chapters: Chapter[] = data.chapters;
export const verses: Verse[] = data.verses.map(([id, chapter, verse, sanskrit, transliteration]) => ({ id, chapter, verse, sanskrit, transliteration }));

export const versesOf = (chapter: number) => verses.filter(v => v.chapter === chapter);

/** The same verse for everyone on a given day, cycling through the whole Gita. */
export function verseOfDay(isoDate: string): Verse {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const n = verses.length;
  return verses[(((dayNumber * 37) % n) + n) % n];
}

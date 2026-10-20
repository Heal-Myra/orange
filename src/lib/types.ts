// Shared data shapes for Project Heal.
// One DayLog holds everything a person logs for one calendar day.

export type MealSource = 'manual' | 'ifct' | 'photo' | 'photo+ifct' | 'words' | 'words+ifct';

export interface Meal {
  name: string;
  grams?: number;
  kcal: number;
  p: number; // protein, g
  c: number; // carbohydrate, g
  f: number; // fat, g
  source: MealSource;
}

export type ContentCategoryId =
  | 'learning'
  | 'spiritual'
  | 'inspiring'
  | 'connect'
  | 'news'
  | 'fun'
  | 'scrolling'
  | 'negative';

export interface MediaSession {
  platform: string;
  minutes: number;
  category: ContentCategoryId;
  source?: 'screen' | 'manual'; // 'screen' = read from a Screen Time screenshot
}

export type PracticeId =
  | 'satya'
  | 'nyaya'
  | 'kartavya'
  | 'seva'
  | 'ahimsa'
  | 'daana'
  | 'santosha'
  | 'kritajnata';

export interface ReflectedAction {
  text: string;
  principle: string;
  alignment: number; // -2 (against dharma) … +2 (in line)
  reflection?: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD, local
  activity: { steps?: number; activeMin?: number; source?: string };
  sleep: { hours?: number; quality?: 1 | 2 | 3 | 4 | 5 };
  meals: Meal[];
  media: MediaSession[];
  noMedia: boolean;
  mind: { meditationMin?: number; attention?: boolean; learning?: boolean };
  dharma: Partial<Record<PracticeId, boolean>>;
  actions: ReflectedAction[];
  tao?: { done?: boolean; note?: string }; // the day's Tao Te Ching practice (src/lib/tao.ts)
  soul?: {
    checked?: boolean;      // answered the eight-practices check today
    verseStudied?: boolean; // studied the Gita verse of the day
    verseNote?: string;     // what the verse means to me
    gratitude?: string[];   // up to three things I am grateful for
    thought?: string;       // my thought for the day
  };
  // Myra recommends. part = part of the day it was made for; sig = fingerprint of the day's data it was made from.
  guidance?: { headline: string; body: string[]; mind: string[]; soul: string[]; focus?: string[]; at: string; part?: string; sig?: string; lang?: string };
}

export interface Profile {
  kcal: number;
  protein: number;
  steps: number;
  active: number;
  meditation: number;
  mediaLimit: number;
}

export const DEFAULT_PROFILE: Profile = {
  kcal: 2000,
  protein: 70,
  steps: 8000,
  active: 30,
  meditation: 20,
  mediaLimit: 60,
};

export const emptyDay = (date: string): DayLog => ({
  date,
  activity: {},
  sleep: {},
  meals: [],
  media: [],
  noMedia: false,
  mind: {},
  dharma: {},
  actions: [],
});

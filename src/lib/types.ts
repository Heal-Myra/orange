// Shared data shapes for Project Heal.
import type { AboutMe } from './targets';
// One DayLog holds everything a person logs for one calendar day.

export type MealSource = 'manual' | 'ifct' | 'photo' | 'photo+ifct' | 'words' | 'words+ifct';

export interface Meal {
  name: string;
  grams?: number;
  kcal: number;
  p: number; // protein, g
  c: number; // carbohydrate, g
  f: number; // fat, g
  fib?: number; // fibre, g (from 21 Oct 2026)
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
  /** social = social, video, messaging, news (counts toward the limit); learning = AI assistants, reading, courses
   *  (raises quality, never counts toward the limit); tool = payments, maps, rides… (shown, not scored). Founder, 26 Oct 2026. */
  group?: 'social' | 'learning' | 'tool';
  app?: string;     // name as shown on the screenshot
  notMe?: boolean;  // "Not me (TV / family)": kept for the record, not scored
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
  savedAt?: string; // when this day was last changed (ISO); the newer copy wins between phone and account
  activity: { steps?: number; activeMin?: number; source?: string; stepsTyped?: boolean; activeTyped?: boolean }; // *Typed: the person's own number wins over Apple Health
  sleep: { hours?: number; quality?: 1 | 2 | 3 | 4 | 5; source?: string }; // source 'Typed in' = the person's own number wins over Apple Health
  meals: Meal[];
  fasting?: boolean;
  // Love (founder, 24 Oct 2026): whom I love today and how, what makes me happy today, the friend I meet this week.
  love?: { whom?: string; self?: string; done?: boolean; act?: string; happy?: string; friend?: string }; // self: how I love myself (happy: older days)
  feeling?: import('./feeling').Feeling; // "How do you feel today?" (24 Oct 2026)
  habitsDone?: string[]; // habits ticked off this day (23 Oct 2026)
  plan?: import('./foodPlan').FoodPlan; // the food planned for this day (made the day before; founder, 23 Oct 2026) // "I'm fasting today" (founder, 22 Oct 2026): water, black tea and black coffee are fine
  media: MediaSession[];
  noMedia: boolean;
  mind: { meditationMin?: number; attention?: boolean; learning?: boolean; focusDone?: number; learned?: { text?: string; link?: string; by?: 'myra' } }; // focusDone: Myra's focus tasks ticked off today (attention/learning: older days only)
  dharma: Partial<Record<PracticeId, boolean>>;
  actions: ReflectedAction[];
  tao?: { done?: boolean; note?: string };
  // Read from Apple Health (20 Oct 2026). Body measures are the latest reading; the rest are for this day.
  health?: {
    weightKg?: number; weightAt?: number; weightTyped?: boolean; weightTypedAt?: number; bodyFatPct?: number; restingHr?: number; hrv?: number; vo2max?: number;
    activeKcal?: number; mindfulMin?: number;
    workouts?: { type: string; min: number; kcal?: number }[];
    sleepStages?: { deep?: number; core?: number; rem?: number; awake?: number }; // hours
  }; // the day's Tao Te Ching practice (src/lib/tao.ts)
  soul?: {
    checked?: boolean;      // answered the eight-practices check today
    verseStudied?: boolean; // studied the Gita verse of the day
    verseNote?: string;     // what the verse means to me
    gratitude?: string[];   // up to four things I am grateful for (10 points each)
    thought?: string;       // my thought for the day
  };
  // Myra recommends. part = part of the day it was made for; sig = fingerprint of the day's data it was made from.
  guidance?: { headline: string; body: string[]; mind: string[]; soul: string[]; focus?: string[]; cards?: { body?: string; mind?: string; soul?: string }; pick?: 'body' | 'mind' | 'soul'; at: string; part?: string; sig?: string; lang?: string; fasting?: boolean; feel?: string };
}

export interface Profile {
  kcal: number;
  protein: number;
  steps: number;
  active: number;
  meditation: number;
  mediaLimit: number;
  me?: AboutMe; // About you: weight, height, sex, age, goal (src/lib/targets.ts)
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

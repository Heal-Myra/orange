// Project Heal scoring engine.
// Well-being = Body (100) + Mind (100) + Soul (100) = 300.
// A working model to help people understand themselves, not a medical measure
// (The Orange Book, Chapter 2). Weights are documented in docs/scoring.md.

import type { ContentCategoryId, DayLog, Meal, PracticeId, Profile } from './types';

export const CONTENT_CATEGORIES: { id: ContentCategoryId; name: string; weight: number }[] = [
  { id: 'learning', name: 'Learning or skill-building', weight: 1.0 },
  { id: 'spiritual', name: 'Spiritual or devotional', weight: 1.0 },
  { id: 'inspiring', name: 'Inspiring or uplifting', weight: 0.9 },
  { id: 'connect', name: 'Connecting with friends/family', weight: 0.8 },
  { id: 'news', name: 'News, informative', weight: 0.6 },
  { id: 'fun', name: 'Entertainment or humour', weight: 0.5 },
  { id: 'scrolling', name: 'Mindless scrolling', weight: 0.2 },
  { id: 'negative', name: 'Outrage, gossip or negativity', weight: 0.0 },
];

export const PRACTICES: { id: PracticeId; name: string; meaning: string; points: number; orangeBook?: boolean }[] = [
  { id: 'satya', name: 'Satya', meaning: 'Truthfulness: told the truth, even when inconvenient', points: 20, orangeBook: true },
  { id: 'nyaya', name: 'Nyaya', meaning: 'Fairness: took no advantage of anyone', points: 15, orangeBook: true },
  { id: 'kartavya', name: 'Kartavya', meaning: 'Fulfilled duties to family and work', points: 15 },
  { id: 'seva', name: 'Seva', meaning: 'Served someone expecting nothing back', points: 15 },
  { id: 'ahimsa', name: 'Ahimsa', meaning: 'Caused no harm in word, deed or diet', points: 10 },
  { id: 'daana', name: 'Daana', meaning: 'Gave money, food, time or knowledge', points: 10 },
  { id: 'santosha', name: 'Santosha', meaning: 'Stayed content; avoided greed and excess', points: 10 },
  { id: 'kritajnata', name: 'Kritajnata', meaning: 'Practised gratitude', points: 5 },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const c01 = (v: number) => clamp(v, 0, 1);

export interface MealTotals { kcal: number; p: number; c: number; f: number }

export function mealTotals(meals: Meal[]): MealTotals {
  return meals.reduce(
    (t, m) => ({ kcal: t.kcal + (m.kcal || 0), p: t.p + (m.p || 0), c: t.c + (m.c || 0), f: t.f + (m.f || 0) }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

export interface BodyScore {
  total: number;
  movement: number; // /40
  sleep: number; // /30
  nutrition: number; // /30
  totals: MealTotals;
}

/** Body: movement 40, sleep 30, food 30. Returns null when nothing is logged. */
export function bodyScore(d: DayLog, P: Profile): BodyScore | null {
  const a = d.activity, s = d.sleep;
  const hasAct = a.steps != null || a.activeMin != null;
  const hasSleep = s.hours != null;
  const hasFood = d.meals.length > 0;
  if (!hasAct && !hasSleep && !hasFood) return null;

  const movement = hasAct ? 20 * c01((a.steps ?? 0) / P.steps) + 20 * c01((a.activeMin ?? 0) / P.active) : 0;

  let sleep = 0;
  if (hasSleep) {
    const h = s.hours as number;
    const hoursPts = h >= 7 && h <= 9 ? 20 : h < 7 ? 20 * c01((h - 3) / 4) : 20 * c01(1 - (h - 9) / 3);
    const qualityPts = s.quality ? (10 * s.quality) / 5 : hoursPts / 2;
    sleep = hoursPts + qualityPts;
  }

  const totals = mealTotals(d.meals);
  let nutrition = 0;
  if (hasFood) {
    const kcalPts = 12 * c01(1 - Math.abs(totals.kcal - P.kcal) / (P.kcal * 0.5));
    const proteinPts = 12 * c01(totals.p / P.protein);
    const energy = totals.p * 4 + totals.c * 4 + totals.f * 9 || 1;
    const fatShare = (totals.f * 9) / energy, carbShare = (totals.c * 4) / energy;
    nutrition = kcalPts + proteinPts + (fatShare >= 0.2 && fatShare <= 0.35 ? 3 : 0) + (carbShare >= 0.4 && carbShare <= 0.62 ? 3 : 0);
  }
  return { total: movement + sleep + nutrition, movement, sleep, nutrition, totals };
}

export interface MindScore {
  total: number;
  practices: number; // /40
  content: number | null; // /60, null when social media not logged
  minutes: number;
  quality: number | null; // 0–1 share of nourishing content
}

/** Mind: meditation, attention, learning (40) + social-media content diet (60). */
export function mindScore(d: DayLog, P: Profile): MindScore | null {
  const m = d.mind;
  const hasPractice = m.meditationMin != null || !!m.attention || !!m.learning;
  const practices = 20 * c01((m.meditationMin ?? 0) / P.meditation) + (m.attention ? 10 : 0) + (m.learning ? 10 : 0);

  let content: number | null = null, minutes = 0, quality: number | null = null;
  if (d.noMedia) {
    content = 60; quality = 1;
  } else {
    minutes = d.media.reduce((s, x) => s + (x.minutes || 0), 0);
    if (minutes > 0) {
      quality = d.media.reduce((s, x) => s + (x.minutes || 0) * weightOf(x.category), 0) / minutes;
      const L = P.mediaLimit;
      const quantity = minutes <= L ? 25 : 25 * c01(1 - (minutes - L) / (2 * L));
      content = 35 * quality + quantity;
    }
  }
  if (!hasPractice && content == null) return null;
  return { total: practices + (content ?? 0), practices, content, minutes, quality };
}

const weightOf = (id: ContentCategoryId) => CONTENT_CATEGORIES.find(c => c.id === id)?.weight ?? 0.5;

export interface SoulScore { total: number; base: number; bonus: number; count: number }

/** Soul / inner life: eight practices worth 100, plus or minus up to 10 from reflected actions. */
export function soulScore(d: DayLog): SoulScore | null {
  const kept = PRACTICES.filter(p => d.dharma[p.id]);
  if (!kept.length && !d.actions.length) return null;
  const base = kept.reduce((s, p) => s + p.points, 0);
  const bonus = clamp(d.actions.reduce((s, a) => s + (a.alignment || 0), 0) * 2.5, -10, 10);
  return { total: clamp(base + bonus, 0, 100), base, bonus, count: kept.length };
}

export interface WellBeing { body: BodyScore | null; mind: MindScore | null; soul: SoulScore | null; total: number; logged: number }

export function wellBeing(d: DayLog, P: Profile): WellBeing {
  const body = bodyScore(d, P), mind = mindScore(d, P), soul = soulScore(d);
  return {
    body, mind, soul,
    total: (body?.total ?? 0) + (mind?.total ?? 0) + (soul?.total ?? 0),
    logged: [body, mind, soul].filter(Boolean).length,
  };
}

export function band(total: number): 'Flourishing' | 'Balanced' | 'Finding your footing' | 'Needs care' {
  if (total >= 240) return 'Flourishing';
  if (total >= 180) return 'Balanced';
  if (total >= 120) return 'Finding your footing';
  return 'Needs care';
}

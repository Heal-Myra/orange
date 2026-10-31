// Project Heal scoring engine.
// Well-being = Body (100) + Mind (100) + Soul (100) = 300.
// A working model to help people understand themselves, not a medical measure
// (The Orange Book, Chapter 2). Weights are documented in docs/scoring.md.

import { DEFAULT_PROFILE, type ContentCategoryId, type DayLog, type Meal, type MediaSession, type PracticeId, type Profile } from './types';

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

export interface MealTotals { kcal: number; p: number; c: number; f: number; fib: number }

export function mealTotals(meals: Meal[]): MealTotals {
  return meals.reduce(
    (t, m) => ({ kcal: t.kcal + (m.kcal || 0), p: t.p + (m.p || 0), c: t.c + (m.c || 0), f: t.f + (m.f || 0), fib: t.fib + (m.fib || 0) }),
    { kcal: 0, p: 0, c: 0, f: 0, fib: 0 },
  );
}

export interface BodyScore {
  total: number;
  movement: number; // /40
  sleep: number; // /30
  nutrition: number; // /30
  totals: MealTotals;
}

/**
 * Food (30), founder's rule (22 Oct 2026): eating at or under the calorie target is good (fasting included); going
 * over costs points. A mix leaning to protein and fibre scores higher than one heavy in carbs and fat.
 *  - Calories 12: full at or under the target, falling to 0 at 140 % of it.
 *  - Protein 9: by its share of the day's calories, 0 at 10 % or less, full at 25 % or more.
 *  - Fibre 6: by grams per 1,000 kcal, full at 14 g or more (ICMR-NIN / dietary guidelines).
 *  - Fat 3: full when fat is 30 % of calories or less, 0 at 45 % or more.
 */
export function foodScore(t: MealTotals, targetKcal: number) {
  const kcal = 16 * c01(1 - Math.max(0, t.kcal - targetKcal) / (targetKcal * 0.4));
  const energy = t.p * 4 + t.c * 4 + t.f * 9;
  const proteinShare = energy ? (t.p * 4) / energy : 0, fatShare = energy ? (t.f * 9) / energy : 0;
  const protein = 12 * c01((proteinShare - 0.1) / 0.15);
  const fibrePer1000 = t.kcal > 0 ? ((t.fib ?? 0) * 1000) / t.kcal : 0;
  const fibre = 8 * c01(fibrePer1000 / 14);
  const fat = energy ? 4 * c01((0.45 - fatShare) / 0.15) : 4; // food = 40 (founder, 24 Oct 2026)
  return { total: kcal + protein + fibre + fat, kcal, protein, fibre, fat };
}

export const FAST_KCAL = 60; // black tea and coffee through a day stay under this

/** Body: food 40, sleep 30, movement 30 (founder, 24 Oct 2026). Returns null when nothing is logged. */
export function bodyScore(d: DayLog, P: Profile): BodyScore | null {
  const a = d.activity, s = d.sleep;
  const hasAct = a.steps != null || a.activeMin != null;
  const hasSleep = s.hours != null;
  const hasFood = d.meals.length > 0 || !!d.fasting;
  if (!hasAct && !hasSleep && !hasFood) return null;

  // Body = Food 40 + Sleep 30 + Movement 30 (founder, 24 Oct 2026).
  const movement = hasAct ? 15 * c01((a.steps ?? 0) / P.steps) + 15 * c01((a.activeMin ?? 0) / P.active) : 0;

  let sleep = 0;
  if (hasSleep) {
    const h = s.hours as number;
    const hoursPts = h >= 7 && h <= 9 ? 20 : h < 7 ? 20 * c01((h - 3) / 4) : 20 * c01(1 - (h - 9) / 3);
    const qualityPts = s.quality ? (10 * s.quality) / 5 : hoursPts / 2;
    sleep = hoursPts + qualityPts;
  }

  const totals = mealTotals(d.meals);
  let nutrition = 0;
  // A declared fast scores full, as long as only water, black tea or black coffee (a few calories) went in.
  if (d.fasting && totals.kcal <= FAST_KCAL) nutrition = 40;
  else if (hasFood) nutrition = foodScore(totals, P.kcal).total;
  return { total: movement + sleep + nutrition, movement, sleep, nutrition, totals };
}

/**
 * Points per part (founder, 24 Oct 2026): no bonuses.
 * Body = Food 40 + Sleep 30 + Movement 30.
 * Mind = Focus to-dos 40 + Breathing & meditation 30 + Phone activity 30 (Learning removed).
 * Soul = Gratitude 30 + Love 30 + Daily Wisdom 20 + Tao practice 20 = 100 (founder, 25 Oct 2026, ending the 130 overrun).
 */
export const POINTS = { food: 40, sleep: 30, movement: 30, focus: 40, meditation: 30, phone: 30, gratitude: 30, wisdom: 20, tao: 20, love: 30 } as const;
export const FOCUS_EACH = POINTS.focus / 2;          // each of up to two focus to-dos
export const GRATITUDE_EACH = POINTS.gratitude / 4;  // each of up to four gratitudes
/** Daily Wisdom and Tao: reading earns this share, living it (a line on how it was used today) the rest. */
export const LEARN_SHARE = 0.25;
/** The Gratitude journal replaces the Gratitude and Love cards from this day. */
export const JOURNAL_FROM = '2026-10-27';
export const filledText = (t?: string) => !!t && t.trim().length >= 2;
/** A line on how the learning was lived: at least three words. */
export const lived = (text?: string) => (text ?? '').trim().split(/\s+/).filter(Boolean).length >= 3;

export interface MindScore {
  total: number;
  practices: number;      // /40 focus to-dos done
  meditation: number;     // /30 breathing and meditation minutes ÷ daily target
  content: number | null; // /30 phone activity (quality 18 + within the limit 12); null when not logged
  minutes: number;
  quality: number | null; // 0–1 share of nourishing content
}

/** From this day on, a day's phone points come from the day before (the screenshot is added the next morning). */
export const PHONE_LAG_FROM = '2026-10-27';

/** Phone activity points for a set of sessions: quality 18 + within the limit 12 (null when nothing logged). */
export function phoneContent(media: MediaSession[], noMedia: boolean | undefined, P: Profile): { content: number | null; minutes: number; quality: number | null } {
  if (noMedia) return { content: POINTS.phone, minutes: 0, quality: 1 };
  // Scored: social and learning sessions that were the person's own; tools and "Not me" are left out (26 Oct 2026).
  const scored = media.filter(x => !x.notMe && x.group !== 'tool');
  const social = scored.filter(x => x.group !== 'learning').reduce((s, x) => s + (x.minutes || 0), 0);
  const minutes = scored.reduce((s, x) => s + (x.minutes || 0), 0);
  if (minutes <= 0) return { content: null, minutes: 0, quality: null };
  const quality = scored.reduce((s, x) => s + (x.minutes || 0) * weightOf(x.category), 0) / minutes;
  const L = P.mediaLimit;
  // Only social and video time counts toward the limit; learning and AI tools never use it up.
  const quantity = social <= L ? 1 : c01(1 - (social - L) / (2 * L));
  return { content: 18 * quality + 12 * quantity, minutes, quality };
}

export function mindScore(d: DayLog, P: Profile): MindScore | null {
  const m = d.mind;
  // Older days with the Attention/Learning ticks count them as done focus tasks.
  const done = Math.min(2, (m.focusDone ?? 0) + (m.attention ? 1 : 0) + (m.learning ? 1 : 0));
  const practices = done * FOCUS_EACH;
  const meditation = POINTS.meditation * c01((m.meditationMin ?? 0) / P.meditation);

  // Since 27 Oct 2026 the phone points are yesterday's (copied in as phoneFrom); older days keep their own.
  const lag = (d.date ?? '') >= PHONE_LAG_FROM;
  const src = lag ? d.phoneFrom : { media: d.media, noMedia: d.noMedia };
  const { content, minutes, quality } = src ? phoneContent(src.media ?? [], src.noMedia, P) : { content: null, minutes: 0, quality: null };
  if (!practices && m.meditationMin == null && content == null) return null;
  return { total: Math.min(100, practices + meditation + (content ?? 0)), practices, meditation, content, minutes, quality };
}

const weightOf = (id: ContentCategoryId) => CONTENT_CATEGORIES.find(c => c.id === id)?.weight ?? 0.5;

/** Gratitudes written today; empty boxes in between are saved as null and are skipped. */
export const countGratitude = (list?: (string | null | undefined)[]) =>
  (Array.isArray(list) ? list : []).filter(g => typeof g === 'string' && g.trim()).length;

export interface SoulScore {
  total: number;
  gratitude: number; // /30, 7.5 each up to four things
  verse: number;     // /30 Daily Wisdom studied
  tao: number;       // /20 the day's Tao practice done
  love: number;      // /30: whom I love today 12, how I love myself 12, one of them done 6
}

/** Love points (founder, 24 Oct 2026). */
export function lovePoints(d: DayLog): number {
  const filled = (t?: string) => (t ?? '').trim().length >= 2;
  const whom = filled(d.love?.whom), self = filled(d.love?.self ?? d.love?.happy);
  return (whom ? 12 : 0) + (self ? 12 : 0) + (d.love?.done && (whom || self) ? 6 : 0);
}

export function soulScore(d: DayLog, _P: Profile = DEFAULT_PROFILE): SoulScore | null {
  const so = d.soul ?? {};
  // Boxes can be left empty in between (saved as null), so check each one is text (crash, 23 Oct 2026).
  // Gratitude journal from 27 Oct 2026 (founder): three thank-yous 5 each + made me laugh 7.5 + best part of my day 7.5
  // = 30; I was kind to someone = Love 30. Older days keep four gratitudes and the old Love card.
  const journal = (d.date ?? '') >= JOURNAL_FROM;
  const gratitude = journal
    ? Math.min(3, countGratitude(so.gratitude)) * 5 + (filledText(so.laugh) ? 7.5 : 0) + (filledText(so.best) ? 7.5 : 0)
    : Math.min(4, countGratitude(so.gratitude)) * GRATITUDE_EACH;
  // Learning earns 25 %, living it during the day earns 75 % (founder, 26 Oct 2026).
  const verse = (so.verseStudied ? LEARN_SHARE * POINTS.wisdom : 0) + (lived(so.verseLived) ? (1 - LEARN_SHARE) * POINTS.wisdom : 0);
  const tao = (d.tao?.done ? LEARN_SHARE * POINTS.tao : 0) + (lived(d.tao?.lived) ? (1 - LEARN_SHARE) * POINTS.tao : 0);
  const love = journal ? (filledText(d.love?.kindTo) ? POINTS.love : 0) : lovePoints(d);
  if (!gratitude && !verse && !tao && !love) return null;
  return { total: Math.min(100, gratitude + verse + tao + love), gratitude, verse, tao, love };
}

export interface WellBeing { body: BodyScore | null; mind: MindScore | null; soul: SoulScore | null; total: number; logged: number }

export function wellBeing(d: DayLog, P: Profile): WellBeing {
  const body = bodyScore(d, P), mind = mindScore(d, P), soul = soulScore(d, P);
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

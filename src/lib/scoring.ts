// Project Heal scoring engine.
// Well-being (out of 100, founder 1 Nov 2026) = the average of Body (100), Mind (100) and Soul (100). Before: their sum, out of 300.
// A working model to help people understand themselves, not a medical measure
// (The Orange Book, Chapter 2). Weights are documented in docs/scoring.md.

import { FAST_FROM, FOOD_V3_FROM, fastCurve, MEAL_SHARE, aimShares, fastHabit, fastHoursOf, fastPoints, foodV3, saidFast } from './fasting';
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

export const FAST_CURVE_FROM = '2026-11-05'; // the founder's Wednesday–Friday fast counts from Thursday
export const FAST_KCAL = 60; // black tea and coffee through a day stay under this

/** Body: food 40, sleep 30, movement 30 (founder, 24 Oct 2026). Returns null when nothing is logged. */
/** Sleep quality from the tracker (founder, 15 Nov 2026): when a ring or watch records the stages, quality comes from
 *  them and is not asked. 1–5 from restorative sleep (deep + REM, aim 40 % of sleep) and how little of the night was
 *  spent awake (aim 95 % asleep). */
export const DEVICE_QUALITY_FROM = '2026-11-15';
/** From 16 Nov 2026 (founder): a walk of 10 minutes or more within 45 minutes of dinner adds 2 to Movement (still at
 *  most 30), and the weekly forgiveness practice adds 5 to Soul (still at most 100). */
export const EXTRAS_FROM = '2026-11-16';
export const DINNER_WALK_MIN = 10, DINNER_WALK_PTS = 2, FORGIVE_PTS = 5;
export function deviceQuality(st: { deep?: number; rem?: number; awake?: number } | undefined, hours?: number): number | null {
  if (!st || st.deep == null || st.rem == null || !hours) return null;
  const restorative = Math.min(1, (st.deep + st.rem) / hours / 0.4);
  const asleep = hours / (hours + (st.awake ?? 0));
  const settled = Math.max(0, Math.min(1, (asleep - 0.75) / 0.2));
  return Math.round(Math.max(1, 5 * (0.6 * restorative + 0.4 * settled)) * 10) / 10;
}

/** Sleep from a ring or watch, from 19 Nov 2026 (founder: "all individual elements Oura uses"; decision 0064).
 *  Seven parts out of 30: total sleep 10, efficiency 4, deep sleep 4, REM sleep 3, restfulness 3, falling asleep 3,
 *  timing 3. A part the device did not give is left out and the rest share its points. Typed nights keep hours 20 +
 *  quality 10. The night's vitals (lowest heart rate, HRV, breathing, oxygen) are kept but not scored here. */
export const SLEEP_V2_FROM = '2026-11-19';
export interface SleepPart { id: string; label: string; value: number; text: string; weight: number }

const hhmm = (h: number) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; };

export function sleepParts(d: DayLog): SleepPart[] | null {
  const s = d.sleep, st = d.health?.sleepStages, x = d.health?.sleepDetail;
  if (s.hours == null || (d.date ?? '') < SLEEP_V2_FROM || !st || s.source === 'Typed in') return null;
  const h = s.hours;
  const parts: SleepPart[] = [];
  parts.push({ id: 'total', label: 'Total sleep', weight: 10, text: hhmm(h), value: h >= 7 && h <= 9 ? 1 : h < 7 ? c01((h - 4) / 3) : c01(1 - (h - 9) / 3) });
  const inBed = x?.inBed ?? (st.awake != null ? h + st.awake : undefined);
  if (inBed) { const eff = Math.min(1, h / inBed); parts.push({ id: 'efficiency', label: 'Efficiency', weight: 4, text: `${Math.round(eff * 100)}%`, value: c01((eff - 0.7) / 0.2) }); }
  if (st.deep != null) parts.push({ id: 'deep', label: 'Deep sleep', weight: 4, text: `${hhmm(st.deep)}, ${Math.round((st.deep / h) * 100)}%`, value: c01(st.deep / 1.5) });
  if (st.rem != null) parts.push({ id: 'rem', label: 'REM sleep', weight: 3, text: `${hhmm(st.rem)}, ${Math.round((st.rem / h) * 100)}%`, value: c01(st.rem / Math.max(1.2, 0.2 * h)) });
  const awakeMin = x?.awakeMin ?? (st.awake != null ? Math.round(st.awake * 60) : undefined);
  if (x?.wakeUps != null || awakeMin != null) {
    const w = x?.wakeUps, a = awakeMin ?? 0;
    const v = (w == null ? 1 : c01(1 - Math.max(0, w - 2) / 6)) * c01(1 - Math.max(0, a - 20) / 60);
    parts.push({ id: 'restful', label: 'Restfulness', weight: 3, text: w != null ? `${w}× · ${a} min` : `${a} min`, value: v });
  }
  if (x?.latencyMin != null) { const l = x.latencyMin; parts.push({ id: 'latency', label: 'Falling asleep', weight: 3, text: `${l} min`, value: l < 5 ? 0.7 : l <= 20 ? 1 : c01(1 - (l - 20) / 40) }); }
  if (s.bedAt && x?.wakeAt) {
    const a = new Date(s.bedAt).getTime(), b = new Date(x.wakeAt).getTime();
    const mid = new Date((a + b) / 2); let mh = mid.getHours() + mid.getMinutes() / 60; if (mh > 12) mh -= 24; // hours after midnight
    const off = mh < 0 ? -mh : mh > 3.5 ? mh - 3.5 : 0;
    parts.push({ id: 'timing', label: 'Timing', weight: 3, text: `${new Date(a).toTimeString().slice(0, 5)}–${new Date(b).toTimeString().slice(0, 5)}`, value: c01(1 - off / 3) });
  }
  return parts;
}

export function sleepPoints(parts: SleepPart[]): number {
  const w = parts.reduce((t, p) => t + p.weight, 0);
  return w ? (30 * parts.reduce((t, p) => t + p.weight * p.value, 0)) / w : 0;
}

export function bodyScore(d: DayLog, P: Profile, now: Date = new Date()): BodyScore | null {
  const a = d.activity, s = d.sleep;
  const hasAct = a.steps != null || a.activeMin != null;
  const hasSleep = s.hours != null;
  // Fasting by choice (decision 0044): the hours without food count from 1 Nov 2026.
  const habit = (d.date ?? '') >= FAST_FROM ? fastHabit(P.me) : null;
  // From 3 Nov 2026 Food = fasting 8 + dinner time 8 + meals 24 − up to 4 (decision 0047). It counts once there is
  // something to go on: a meal today, last night's meal logged, a fasting habit, or a declared fast.
  const v3 = (d.date ?? '') >= FOOD_V3_FROM;
  const hasFood = d.meals.length > 0 || !!d.fasting || !!habit || (v3 && !!d.fastFrom);
  if (!hasAct && !hasSleep && !hasFood) return null;

  // Body = Food 40 + Sleep 30 + Movement 30 (founder, 24 Oct 2026).
  const walked = (d.date ?? '') >= EXTRAS_FROM && (a.dinnerWalk ?? 0) >= DINNER_WALK_MIN ? DINNER_WALK_PTS : 0;
  const movement = hasAct ? Math.min(30, 15 * c01((a.steps ?? 0) / P.steps) + 15 * c01((a.activeMin ?? 0) / P.active) + walked) : 0;

  let sleep = 0;
  if (hasSleep) {
    const h = s.hours as number;
    const hoursPts = h >= 7 && h <= 9 ? 20 : h < 7 ? 20 * c01((h - 3) / 4) : 20 * c01(1 - (h - 9) / 3);
    const dq = (d.date ?? '') >= DEVICE_QUALITY_FROM ? deviceQuality(d.health?.sleepStages, h) : null;
    const qualityPts = dq != null ? (10 * dq) / 5 : s.quality ? (10 * s.quality) / 5 : hoursPts / 2;
    sleep = hoursPts + qualityPts;
    const v2 = sleepParts(d);
    if (v2) sleep = sleepPoints(v2);
  }

  const totals = mealTotals(d.meals);
  let nutrition = 0;
  // A declared fast scores full, as long as only water, black tea or black coffee (a few calories) went in.
  if (d.fasting && totals.kcal <= FAST_KCAL) nutrition = 40;
  else if (v3) {
    const energy = totals.p * 4 + totals.c * 4 + totals.f * 9;
    const v = foodV3(d, P.me, d.meals.length ? foodScore(totals, P.kcal).total : null,
      energy ? { carb: (totals.c * 4) / energy, fat: (totals.f * 9) / energy } : null, aimShares(P.kcal, P.protein), now);
    // From 6 Nov 2026: the higher of the usual Food and the points for the hours fasted (longer fasts rise faster).
    // Only for people who fast on purpose (a fasting habit, or "I'm fasting today"), so a day with meals not yet
    // logged never looks like a long fast.
    const fasts = saidFast(d, habit || fastHabit(P.me));
    nutrition = fasts && (d.date ?? '') >= FAST_CURVE_FROM ? Math.max(v.total, fastCurve(v.fastHours)) : v.total;
  }
  else if (habit) {
    const f = fastHoursOf(d, habit, now);
    nutrition = fastPoints(f.hours, habit) + (d.meals.length ? MEAL_SHARE * foodScore(totals, P.kcal).total : 0);
  }
  else if (hasFood) nutrition = foodScore(totals, P.kcal).total;
  return { total: movement + sleep + nutrition, movement, sleep, nutrition, totals };
}

/**
 * Points per part (founder, 24 Oct 2026): no bonuses.
 * Body = Food 40 + Sleep 30 + Movement 30.
 * Mind = Focus to-dos 40 + Breathing & meditation 30 + Phone activity 30 (Learning removed; phone = 30 × quality − 1 per 10 min over the limit).
 * Soul = Gratitude 30 + Love 30 + Daily Wisdom 20 + Tao practice 20 = 100 (founder, 25 Oct 2026, ending the 130 overrun).
 */
export const POINTS = { food: 40, sleep: 30, movement: 30, focus: 40, meditation: 30, phone: 30, gratitude: 30, wisdom: 20, tao: 20, love: 30 } as const;
export const FOCUS_EACH = POINTS.focus / 2;          // each of up to two focus to-dos (until 3 Nov 2026)
export const SECTIONS_FROM = '2026-11-04';
export const SECTION_AREAS = ['family', 'work', 'self'] as const;
/** One section's points: [written, done] today, two of each count. */
export const sectionPoint = ([w, dn]: [number, number]) => (POINTS.focus / 3) * (0.2 * Math.min(2, Math.max(w, dn)) / 2 + 0.8 * Math.min(2, dn) / 2);
export const sectionPoints = (s: Partial<Record<'family' | 'work' | 'self', [number, number]>>) => SECTION_AREAS.reduce((a, k) => a + sectionPoint(s[k] ?? [0, 0]), 0);
export const GRATITUDE_EACH = POINTS.gratitude / 4;  // each of up to four gratitudes
/** Daily Wisdom and Tao: reading earns this share, living it (a line on how it was used today) the rest. */
export const LEARN_SHARE = 0.25;
/** The Gratitude journal replaces the Gratitude and Love cards from this day. */
export const JOURNAL_FROM = '2026-10-27';
export const filledText = (t?: string) => !!t && t.trim().length >= 2;
/** Gratitude journal weights from 5 Nov 2026 (founder), out of the card's 60: thankful for three things 20 %, best part
 *  of my day 20 %, I was kind to 30 %, made me laugh 30 %. Kept as Gratitude (thanks + laugh) and Love (kind + best). */
export const JOURNAL_V2_FROM = '2026-11-05';
export const JOURNAL_PARTS = { thanks: 12, best: 12, kind: 18, laugh: 18 } as const;
/** Soul from 16 Nov 2026 (founder: the journal filled the score too easily): Gratitude journal 20, Daily Wisdom
 *  (Bhagavad Gita or the chosen tradition) 40 and Tao 40, each 10 for learning and 30 for living it. */
export const SOUL_V3_FROM = '2026-11-16';
export const JOURNAL_PARTS_V3 = { thanks: 4, best: 4, kind: 6, laugh: 6 } as const;
export const soulWeights = (date?: string) => ((date ?? '') >= SOUL_V3_FROM ? { journal: 20, wisdom: 40, tao: 40 } : { journal: 60, wisdom: POINTS.wisdom, tao: POINTS.tao });
/** Points of each journal part for the day (days 27 Oct – 4 Nov keep the first journal's weights). */
export function journalParts(d: DayLog) {
  const so = d.soul ?? {};
  const n = Math.min(3, countGratitude(so.gratitude)), laugh = filledText(so.laugh), best = filledText(so.best), kind = filledText(d.love?.kindTo);
  if ((d.date ?? '') >= JOURNAL_V2_FROM) {
    const W = (d.date ?? '') >= SOUL_V3_FROM ? JOURNAL_PARTS_V3 : JOURNAL_PARTS;
    return { thanks: (W.thanks * n) / 3, laugh: laugh ? W.laugh : 0, kind: kind ? W.kind : 0, best: best ? W.best : 0, of: W };
  }
  return { thanks: n * 5, laugh: laugh ? 7.5 : 0, kind: kind ? 30 : 0, best: best ? 7.5 : 0, of: { thanks: 15, laugh: 7.5, kind: 30, best: 7.5 } };
}
/** How much of the "living it" points a line earns. Before 16 Nov 2026: any line of three words or more. From then
 *  (founder: "a subjective assessment of the achievement"), Myra reads it: level 1 a third, 2 two thirds, 3 all;
 *  while her reading is on its way (or offline), half. */
export function livedShare(text: string | undefined, rate: import('./types').LivedRate | undefined, date?: string): number {
  if (!lived(text)) return 0;
  if ((date ?? '') < SOUL_V3_FROM) return 1;
  if (rate && rate.of === (text ?? '').trim()) return rate.level / 3;
  return 0.5;
}
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

/** Social and video minutes over the limit cost 1 point for every 10 minutes (founder, 1 Nov 2026). */
export const OVER_LIMIT_MIN_PER_POINT = 10;

/**
 * Phone activity points (founder, 1 Nov 2026: quality matters most): 30 × quality (minutes weighted by the kind of
 * content), then minus 1 point per 10 social and video minutes over the daily limit. Never below 0. Null when nothing logged.
 */
export function phoneContent(media: MediaSession[], noMedia: boolean | undefined, P: Profile): { content: number | null; minutes: number; quality: number | null; social: number; over: number; penalty: number } {
  if (noMedia) return { content: POINTS.phone, minutes: 0, quality: 1, social: 0, over: 0, penalty: 0 };
  // Scored: social and learning sessions that were the person's own; tools and "Not me" are left out (26 Oct 2026).
  const scored = media.filter(x => !x.notMe && x.group !== 'tool');
  const social = scored.filter(x => x.group !== 'learning').reduce((s, x) => s + (x.minutes || 0), 0);
  const minutes = scored.reduce((s, x) => s + (x.minutes || 0), 0);
  if (minutes <= 0) return { content: null, minutes: 0, quality: null, social: 0, over: 0, penalty: 0 };
  const quality = scored.reduce((s, x) => s + (x.minutes || 0) * weightOf(x.category), 0) / minutes;
  // Only social and video time counts toward the limit; learning and AI tools never use it up.
  const over = Math.max(0, social - P.mediaLimit);
  const penalty = over / OVER_LIMIT_MIN_PER_POINT;
  return { content: Math.max(0, POINTS.phone * quality - penalty), minutes, quality, social, over, penalty };
}

export function mindScore(d: DayLog, P: Profile): MindScore | null {
  const m = d.mind;
  // Older days with the Attention/Learning ticks count them as done focus tasks.
  const done = Math.min(2, (m.focusDone ?? 0) + (m.attention ? 1 : 0) + (m.learning ? 1 : 0));
  // From 4 Nov 2026 (founder): a third for each of Family, Work and Better me; writing down two to-dos earns 20 % of it,
  // finishing them the other 80 % (decision 0048).
  const practices = (d.date ?? '') >= SECTIONS_FROM && m.sections ? sectionPoints(m.sections) : done * FOCUS_EACH;
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
  of?: { journal: number; wisdom: number; tao: number }; // the day's maximums (Soul v3 from 16 Nov 2026)
}

/** Love points (founder, 24 Oct 2026). */
export function lovePoints(d: DayLog): number {
  const filled = (t?: string) => (t ?? '').trim().length >= 2;
  const whom = filled(d.love?.whom), self = filled(d.love?.self ?? d.love?.happy);
  return (whom ? 12 : 0) + (self ? 12 : 0) + (d.love?.done && (whom || self) ? 6 : 0);
}

/** Studied today's wisdom / Tao: a line or two written about it counts (founder, 31 Oct 2026: the tick box was removed);
 *  older days kept the tick. */
export const wisdomStudied = (so?: { verseStudied?: boolean; verseNote?: string }) => !!so?.verseStudied || filledText(so?.verseNote);
export const taoStudied = (t?: { done?: boolean; note?: string }) => !!t?.done || filledText(t?.note);

export function soulScore(d: DayLog, _P: Profile = DEFAULT_PROFILE): SoulScore | null {
  const so = d.soul ?? {};
  // Boxes can be left empty in between (saved as null), so check each one is text (crash, 23 Oct 2026).
  // Gratitude journal from 27 Oct 2026 (founder): three thank-yous 5 each + made me laugh 7.5 + best part of my day 7.5
  // = 30; I was kind to someone = Love 30. Older days keep four gratitudes and the old Love card.
  const journal = (d.date ?? '') >= JOURNAL_FROM;
  // From 5 Nov 2026 the weights are thanks 12 + laugh 18 (Gratitude 30) and kind 18 + best part 12 (Love 30).
  const jp = journalParts(d), v2 = (d.date ?? '') >= JOURNAL_V2_FROM;
  const gratitude = journal ? jp.thanks + jp.laugh + (v2 ? 0 : jp.best) : Math.min(4, countGratitude(so.gratitude)) * GRATITUDE_EACH;
  // Learning earns 25 %, living it during the day earns 75 % (founder, 26 Oct 2026).
  const sw = soulWeights(d.date);
  const verse = (wisdomStudied(so) ? LEARN_SHARE * sw.wisdom : 0) + livedShare(so.verseLived, so.verseLivedRate, d.date) * (1 - LEARN_SHARE) * sw.wisdom;
  const tao = (taoStudied(d.tao) ? LEARN_SHARE * sw.tao : 0) + livedShare(d.tao?.lived, d.tao?.livedRate, d.date) * (1 - LEARN_SHARE) * sw.tao;
  const love = journal ? jp.kind + (v2 ? jp.best : 0) : lovePoints(d);
  const forgave = (d.date ?? '') >= EXTRAS_FROM && so.forgave ? FORGIVE_PTS : 0;
  if (!gratitude && !verse && !tao && !love && !forgave) return null;
  return { total: Math.min(100, gratitude + verse + tao + love + forgave), gratitude, verse, tao, love, of: sw };
}

export interface WellBeing { body: BodyScore | null; mind: MindScore | null; soul: SoulScore | null; total: number; logged: number }

export function wellBeing(d: DayLog, P: Profile): WellBeing {
  const body = bodyScore(d, P), mind = mindScore(d, P), soul = soulScore(d, P);
  return {
    body, mind, soul,
    total: ((body?.total ?? 0) + (mind?.total ?? 0) + (soul?.total ?? 0)) / 3,
    logged: [body, mind, soul].filter(Boolean).length,
  };
}

export function band(total: number): 'Flourishing' | 'Balanced' | 'Finding your footing' | 'Needs care' {
  if (total >= 80) return 'Flourishing';
  if (total >= 60) return 'Balanced';
  if (total >= 40) return 'Finding your footing';
  return 'Needs care';
}

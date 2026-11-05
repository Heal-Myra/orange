// Your records (founder, 1 Nov 2026; decision 0045): personal bests found in the person's own days, best day, week,
// month and longest streak, for what is already scored. A record counts only once there is history to beat (7 earlier
// days, or 2 earlier weeks or months), so the first days do not fill up with easy "records". NEW for 7 days.

import { bodyScore, countGratitude, wellBeing } from './scoring';
import type { DayLog, Profile } from './types';

export type RecKind = 'day' | 'week' | 'month' | 'streak';
export interface RecDef {
  id: string; icon: string; color: string; agg: 'sum' | 'avg';
  titles: Partial<Record<RecKind, string>>; // English; shown through tr()
  value: (d: DayLog, P: Profile) => number | null;
  fmt: (n: number) => string;
  close?: string; // English with {n}: what one more push today would make a best day
}
export interface Rec { key: string; def: RecDef; kind: RecKind; title: string; value: number; text: string; start: string; end: string; beat: number | null; isNew: boolean; ongoing?: boolean }

const n0 = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? null : v);
const int = (n: number) => Math.round(n).toLocaleString('en-IN');

export const REC_DEFS: RecDef[] = [
  { id: 'wellbeing', icon: 'sunny-outline', color: '#E3B873', agg: 'avg', titles: { day: 'Best day ever', week: 'Best week ever', month: 'Best month ever' },
    value: (d, P) => { const w = wellBeing(d, P); return w.logged ? w.total : null; }, fmt: n => `${Math.round(n)} / 100` },
  { id: 'steps', icon: 'footsteps-outline', color: '#9CC08E', agg: 'sum', titles: { day: 'Best day of steps', week: 'Best week of steps' },
    value: d => n0(d.activity.steps), fmt: int, close: '{n} more steps today makes it your best day.' },
  { id: 'active', icon: 'walk-outline', color: '#9CC08E', agg: 'sum', titles: { week: 'Most active week' },
    value: d => n0(d.activity.activeMin), fmt: n => `${int(n)} min` },
  { id: 'food', icon: 'restaurant-outline', color: '#EBA987', agg: 'avg', titles: { week: 'Best week for food', month: 'Best month for food' },
    value: (d, P) => (d.meals.length || d.fasting ? n0(bodyScore(d, P)?.nutrition) : null), fmt: n => `${Math.round(n)} / 40` },
  { id: 'sleep', icon: 'moon-outline', color: '#9C95D0', agg: 'avg', titles: { week: 'Best week of sleep' },
    value: (d, P) => (d.sleep.hours != null ? n0(bodyScore(d, P)?.sleep) : null), fmt: n => `${Math.round(n)} / 30` },
  { id: 'meditation', icon: 'flower-outline', color: '#6FB7BD', agg: 'sum', titles: { week: 'Most breathing in a week', streak: 'Longest breathing streak' },
    value: d => n0(d.mind.meditationMin), fmt: n => `${int(n)} min`, close: '{n} more minutes of breathing today makes it your best day.' },
  { id: 'focus', icon: 'checkmark-done-outline', color: '#6FB7BD', agg: 'sum', titles: { week: 'Most to-dos done in a week' },
    value: d => n0(d.mind.focusDone), fmt: int },
  { id: 'mindScore', icon: 'bulb-outline', color: '#6FB7BD', agg: 'avg', titles: { day: 'Highest Mind score', week: 'Best week for Mind' },
    value: (d, P) => n0(wellBeing(d, P).mind?.total), fmt: n => `${Math.round(n)} / 100` },
  { id: 'bodyScore', icon: 'leaf-outline', color: '#9CC08E', agg: 'avg', titles: { day: 'Highest Body score', week: 'Best week for Body' },
    value: (d, P) => n0(wellBeing(d, P).body?.total), fmt: n => `${Math.round(n)} / 100` },
  { id: 'soulScore', icon: 'flame-outline', color: '#EBA987', agg: 'avg', titles: { day: 'Highest Soul score', week: 'Best week for Soul' },
    value: (d, P) => n0(wellBeing(d, P).soul?.total), fmt: n => `${Math.round(n)} / 100` },
  // A healthy-food day: Food 28 of 40 or more (70 %).
  { id: 'healthyFood', icon: 'nutrition-outline', color: '#EBA987', agg: 'sum', titles: { streak: 'Longest streak of healthy food' },
    value: (d, P) => ((d.meals.length || d.fasting) && (bodyScore(d, P)?.nutrition ?? 0) >= 28 ? 1 : null), fmt: int },
  { id: 'gratitude', icon: 'heart-outline', color: '#D9A7BD', agg: 'sum', titles: { streak: 'Longest gratitude streak' },
    value: d => { const n = countGratitude(d.soul?.gratitude); return n || null; }, fmt: int },
];

const parse = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s: string, n: number) => { const d = parse(s); return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); };
const monday = (s: string) => { const d = parse(s); return addDays(s, -((d.getDay() + 6) % 7)); };
const monthStart = (s: string) => s.slice(0, 8) + '01';
const monthEnd = (s: string) => { const d = parse(s); return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

interface Period { start: string; end: string; value: number }

function periods(def: RecDef, days: Record<string, DayLog>, P: Profile, kind: 'day' | 'week' | 'month', today: string): Period[] {
  const vals = Object.keys(days).filter(k => k <= today).sort().map(k => ({ k, v: def.value(days[k], P) })).filter(x => x.v != null) as { k: string; v: number }[];
  if (kind === 'day') return vals.map(x => ({ start: x.k, end: x.k, value: x.v }));
  const groups = new Map<string, number[]>();
  for (const x of vals) {
    const key = kind === 'week' ? monday(x.k) : monthStart(x.k);
    const end = kind === 'week' ? addDays(key, 6) : monthEnd(key);
    if (end >= today) continue; // only finished weeks and months
    groups.set(key, [...(groups.get(key) ?? []), x.v]);
  }
  const need = kind === 'week' ? 4 : 10; // enough days for a fair week or month
  return [...groups.entries()].filter(([, v]) => v.length >= need).sort(([a], [b]) => a.localeCompare(b)).map(([start, v]) => ({
    start, end: kind === 'week' ? addDays(start, 6) : monthEnd(start), value: def.agg === 'sum' ? v.reduce((a, b) => a + b, 0) : v.reduce((a, b) => a + b, 0) / v.length,
  }));
}

/** The best period, once there are enough earlier ones to beat, and whether it is new (ended within 7 days). */
function bestOf(list: Period[], minPrior: number, today: string) {
  let best: Period | null = null, beat: number | null = null, seen = 0;
  for (const p of list) {
    if (best && p.value > best.value) { if (seen >= minPrior) { beat = best.value; best = p; } else best = p; }
    else if (!best) best = p;
    seen++;
  }
  if (!best || list.length <= minPrior) return null;
  const isNew = beat != null && best.end >= addDays(today, -7);
  return { best, beat, isNew };
}

function streakOf(def: RecDef, days: Record<string, DayLog>, P: Profile, today: string) {
  const keys = Object.keys(days).filter(k => k <= today).sort();
  if (!keys.length) return null;
  // Every run of days in a row; today without it yet does not break a run that reached yesterday.
  const runs: { start: string; end: string; len: number }[] = [];
  for (let d = keys[0]; d <= today; d = addDays(d, 1)) {
    const yes = !!(days[d] && def.value(days[d], P));
    const last = runs[runs.length - 1];
    if (yes) { if (last && last.end === addDays(d, -1)) { last.end = d; last.len++; } else runs.push({ start: d, end: d, len: 1 }); }
  }
  if (!runs.length) return null;
  const longest = runs.reduce((a, b) => (b.len > a.len ? b : a));
  if (longest.len < 3) return null;
  const earlier = runs.filter(r => r.end < longest.start).reduce((m, r) => Math.max(m, r.len), 0);
  return { ...longest, ongoing: longest.end >= addDays(today, -1), beat: earlier || null, isNew: earlier > 0 && longest.end >= addDays(today, -7) };
}

export function findRecords(days: Record<string, DayLog>, P: Profile, today: string): Rec[] {
  const out: Rec[] = [];
  for (const def of REC_DEFS) {
    for (const kind of ['day', 'week', 'month'] as const) {
      const title = def.titles[kind]; if (!title) continue;
      const r = bestOf(periods(def, days, P, kind, today), kind === 'day' ? 7 : 2, today);
      if (r) out.push({ key: `${def.id}.${kind}`, def, kind, title, value: r.best.value, text: def.fmt(r.best.value), start: r.best.start, end: r.best.end, beat: r.beat, isNew: r.isNew });
    }
    if (def.titles.streak) {
      const s = streakOf(def, days, P, today);
      if (s) out.push({ key: `${def.id}.streak`, def, kind: 'streak', title: def.titles.streak, value: s.len, text: String(s.len), start: s.start, end: s.end, beat: s.beat, isNew: s.isNew, ongoing: s.ongoing });
    }
  }
  // New records first, then the most recent.
  return out.sort((a, b) => (a.isNew === b.isNew ? b.end.localeCompare(a.end) : a.isNew ? -1 : 1));
}

/** "1,800 more steps today makes it your best day", when today is within a quarter of the best day. */
export function closeToRecord(days: Record<string, DayLog>, P: Profile, today: string): { def: RecDef; more: number } | null {
  for (const def of REC_DEFS) {
    if (!def.close || !days[today]) continue;
    const now = def.value(days[today], P) ?? 0;
    const before = Object.keys(days).filter(k => k < today).map(k => def.value(days[k], P)).filter((v): v is number => v != null);
    if (before.length < 7) continue;
    const best = Math.max(...before);
    if (now > 0 && best > now && (best - now) / best <= 0.25) return { def, more: Math.ceil(best - now + 1) };
  }
  return null;
}

// ---------- Fresh records only (founder, 4 Nov 2026: "the record shall be such that it would have completed yesterday …
// but the record can't be stale"). Today's card shows only a best that yesterday completed: yesterday's day, the 7 or
// 30 days ending yesterday, or a streak still running through yesterday. ----------

function windowValue(def: RecDef, days: Record<string, DayLog>, P: Profile, end: string, len: number, need: number): number | null {
  const v: number[] = [];
  for (let i = 0; i < len; i++) { const d = days[addDays(end, -i)]; const x = d ? def.value(d, P) : null; if (x != null) v.push(x); }
  if (v.length < need) return null;
  return def.agg === 'sum' ? v.reduce((a, b) => a + b, 0) : v.reduce((a, b) => a + b, 0) / v.length;
}

const KIND_RANK: Record<RecKind, number> = { day: 1, week: 2, month: 3, streak: 4 };
export const recRank = (r: Pick<Rec, 'kind' | 'title'>) => (/^Highest/.test(r.title) ? 0 : KIND_RANK[r.kind]);

export function freshRecords(daysIn: Record<string, DayLog>, P: Profile, today: string): Rec[] {
  // Each day's value is worked out once per kind of record (windows reuse the same days many times).
  const cache = new Map<string, number | null>();
  const defs = REC_DEFS.map(d => ({ ...d, value: (x: DayLog, p: Profile) => { const k = `${d.id}|${x.date}`; if (!cache.has(k)) cache.set(k, d.value(x, p)); return cache.get(k)!; } }));
  const days = daysIn;
  const y = addDays(today, -1);
  const first = Object.keys(days).sort()[0];
  if (!first || first > y) return [];
  const out: Rec[] = [];
  for (const def of defs) {
    // Yesterday against every earlier day (at least 7 of them).
    if (def.titles.day && days[y]) {
      const v = def.value(days[y], P);
      const before = Object.keys(days).filter(k => k < y).map(k => def.value(days[k], P)).filter((x): x is number => x != null);
      if (v != null && before.length >= 7 && v > Math.max(...before)) out.push({ key: `${def.id}.day`, def, kind: 'day', title: def.titles.day, value: v, text: def.fmt(v), start: y, end: y, beat: Math.max(...before), isNew: true });
    }
    // The 7 (or 30) days ending yesterday against every earlier window of the same length (at least 7 of them).
    for (const [kind, len, need] of [['week', 7, 4], ['month', 30, 10]] as const) {
      const title = def.titles[kind]; if (!title) continue;
      const v = windowValue(def, days, P, y, len, need); if (v == null) continue;
      const earlier: number[] = [];
      for (let e = addDays(y, -1); e >= addDays(first, len - 1); e = addDays(e, -1)) { const w = windowValue(def, days, P, e, len, need); if (w != null) earlier.push(w); }
      if (earlier.length >= 7 && v > Math.max(...earlier)) out.push({ key: `${def.id}.${kind}`, def, kind, title, value: v, text: def.fmt(v), start: addDays(y, -(len - 1)), end: y, beat: Math.max(...earlier), isNew: true });
    }
    // A streak running through yesterday that is the longest ever (at least 3 days).
    if (def.titles.streak) {
      let len = 0;
      for (let d = y; days[d] && def.value(days[d], P); d = addDays(d, -1)) len++;
      if (len >= 3) {
        let best = 0, cur = 0;
        for (let d = first; d < addDays(y, -(len - 1)); d = addDays(d, 1)) { cur = days[d] && def.value(days[d], P) ? cur + 1 : 0; best = Math.max(best, cur); }
        if (len > best) out.push({ key: `${def.id}.streak`, def, kind: 'streak', title: def.titles.streak, value: len, text: String(len), start: addDays(y, -(len - 1)), end: y, beat: best || null, isNew: true, ongoing: true });
      }
    }
  }
  // Which one shows first (founder, 6 Nov 2026): "Highest ever" records, then other daily records, then weekly, then
  // monthly; streaks last. So a highest-ever day beats a best week.
  return out.sort((a, b) => recRank(a) - recRank(b));
}

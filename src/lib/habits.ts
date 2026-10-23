// Habits (founder, 23 Oct 2026): a to-do that repeats ("Call Dad daily at 9 AM") is a habit. Habits do not sit in the
// to-do list; they have their own bar on the Mind tab, ticked off each day, and at their time Myra puts the habit
// in front of the person on Today (Clear your mind), with a phone reminder five minutes before.

import type { Area } from './taskPlan';

export type Repeat = 'daily' | 'weekdays' | 'weekly';
export interface Habit {
  id: string;
  title: string;
  area: Area;
  repeat: Repeat;
  weekday?: number;   // 0 Sunday … 6 Saturday, for weekly
  at?: string;        // "HH:MM", 24-hour; none = any time of the day
  createdAt: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Reads a repeat and a time from the words, e.g. "Call Dad daily at 9 AM" → daily, 09:00. */
export function readHabit(text: string): { repeat?: Repeat; at?: string; weekday?: number } {
  const t = text.toLowerCase();
  const out: { repeat?: Repeat; at?: string; weekday?: number } = {};
  if (/\b(every ?day|daily|each day|roz|rozana|har din)\b/.test(t)) out.repeat = 'daily';
  else if (/\b(weekdays?|mon(day)?\s*(to|-)\s*fri(day)?)\b/.test(t)) out.repeat = 'weekdays';
  else {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const m = t.match(/\b(every|each)\s+(sun|mon|tue|wed|thu|fri|sat)[a-z]*/);
    if (m) { out.repeat = 'weekly'; out.weekday = days.indexOf(m[2]); }
    else if (/\b(weekly|every week)\b/.test(t)) out.repeat = 'weekly';
  }
  // Times: "9 am", "9:30 pm", "at 0900", "21:00".
  let h: number | null = null, min = 0;
  const ampm = t.match(/\b(\d{1,2})(?:[:.]?(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/);
  const at24 = t.match(/\b(?:at\s*)?([01]?\d|2[0-3])[:.]?([0-5]\d)\b(?!\s*(am|pm))/);
  if (ampm) { h = Number(ampm[1]) % 12 + (ampm[3].startsWith('p') ? 12 : 0); min = Number(ampm[2] ?? 0); }
  else if (at24 && /\d{3,4}|:/.test(at24[0])) { h = Number(at24[1]); min = Number(at24[2]); }
  if (h != null && h < 24 && min < 60) out.at = `${pad(h)}:${pad(min)}`;
  return out;
}

/** Whether the habit is for this day. */
export const habitOn = (h: Habit, d: Date) =>
  h.repeat === 'daily' || (h.repeat === 'weekdays' ? d.getDay() >= 1 && d.getDay() <= 5 : d.getDay() === (h.weekday ?? new Date(h.createdAt).getDay()));

/** Today's habits in time order (habits without a time last). */
export const habitsToday = (list: Habit[], d = new Date()) =>
  list.filter(h => habitOn(h, d)).sort((a, b) => (a.at ?? '99').localeCompare(b.at ?? '99'));

/** The habit to show now: from five minutes before its time until an hour after, if not yet done today. */
export function habitNow(list: Habit[], done: string[], d = new Date()): Habit | null {
  const now = d.getHours() * 60 + d.getMinutes();
  for (const h of habitsToday(list, d)) {
    if (!h.at || done.includes(h.id)) continue;
    const [hh, mm] = h.at.split(':').map(Number);
    const t = hh * 60 + mm;
    if (now >= t - 5 && now <= t + 60) return h;
  }
  return null;
}

export const repeatName = (r: Repeat) => (r === 'daily' ? 'Daily' : r === 'weekdays' ? 'Weekdays' : 'Weekly');

/** The habit's name without the repeat and time words: "Call Dad daily at 9 AM" → "Call Dad". */
export function habitTitle(text: string): string {
  const t = text
    .replace(/\b(every ?day|daily|each day|weekdays?|weekly|every week|(every|each)\s+(sun|mon|tue|wed|thu|fri|sat)[a-z]*)\b/gi, '')
    .replace(/\b(at\s*)?\d{1,2}([:.]?\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/gi, '')
    .replace(/\bat\s*([01]?\d|2[0-3])[:.]?[0-5]\d\b/gi, '')
    .replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim().replace(/[,.\-–]+$/, '').trim();
  return t || text.trim();
}

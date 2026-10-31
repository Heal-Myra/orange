// A plain-text summary of the person's targets, today and the last 7 days, sent to the AI
// (daily guidance and Myra) so its answers are about this person. Built on the device; only what is needed is sent.

import { aboutLine, fibreTarget } from './targets';
import { momentLine } from './routine';
import { shiftISO, todayISO } from './dates';
import { verseOfDay } from './gita';
import { countGratitude, mealTotals, wellBeing } from './scoring';
import { habitsToday } from './habits';
import { feelingLine } from './feeling';
import { faceLine, latestReading } from './face';
import { todaysLength } from './meditationPlan';
import { TAO_FOR_AI, taoForDate } from './tao';
import { passageOfDay, traditionName, type Tradition } from './wisdom';
import type { DayLog, Profile } from './types';

export function buildContext(day: DayLog, days: Record<string, DayLog>, date: string, profile: Profile, tasks?: string, tradition?: Tradition | null): string {
  const hab = habitsToday(profile.me?.habits ?? [], new Date()).map(h => `${h.at ?? 'any time'} ${h.title} (${(day.habitsDone ?? []).includes(h.id) ? 'done' : 'not yet'})`).join('; ');
  const w = wellBeing(day, profile), t = mealTotals(day.meals), v = verseOfDay(date), tao = taoForDate(date);
  const week = Array.from({ length: 7 }, (_, i) => shiftISO(date, -i - 1)).filter(d => days[d]).map(d => {
    const x = wellBeing(days[d], profile);
    return `${d}: body ${x.body ? Math.round(x.body.total) : '-'}, mind ${x.mind ? Math.round(x.mind.total) : '-'}, soul ${x.soul ? Math.round(x.soul.total) : '-'}`;
  }).join('\n') || 'no earlier days logged';
  const now = new Date();
  const clock = date === todayISO()
    ? `Now: ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()]} ${now.toTimeString().slice(0, 5)} local time (${partOfDay(now)}). Only what is still possible from now on today counts.`
    : `This is a past or future day (${date}), not today.`;
  return [
    clock,
    `Targets: ${profile.kcal} kcal, ${profile.protein} g protein, ${profile.steps} steps, ${profile.active} active min, ${profile.meditation} min meditation, social media ≤ ${profile.mediaLimit} min.`,
    `Today (${date}): steps ${day.activity.steps ?? 'not logged'}, active ${day.activity.activeMin ?? 'not logged'} min${day.activity.source ? ` (from ${day.activity.source})` : ''}, sleep ${day.sleep.hours ?? 'not logged'} h (quality ${day.sleep.quality ?? '-'}/5).`,
    aboutLine(profile.me),
    momentLine(profile.me?.routine),
    healthLine(day),
    feelingLine(day.feeling),
    (() => { const r = latestReading(days, date); return r ? faceLine(r.face, r.date === date ? 'today' : r.date) : ''; })(),
    `Fasting today: ${day.fasting ? 'yes (declared fast: water, black tea, black coffee)' : 'no'}.`,
    `Food: ${day.meals.map(m => m.name).join(', ') || 'nothing logged'}; totals ${Math.round(t.kcal)} kcal, protein ${Math.round(t.p)} g, carbs ${Math.round(t.c)} g, fat ${Math.round(t.f)} g, fibre ${Math.round(t.fib)} g (target ${fibreTarget(profile.kcal)} g).`,
    `Mind: focus tasks done today ${day.mind.focusDone ?? 0} of up to 2; breathing and meditation ${day.mind.meditationMin ?? 'not done yet'} min; phone yesterday (counted today) ${(day.phoneFrom ?? day).noMedia ? 'no social media' : (day.phoneFrom ?? day).media.filter(m => !m.notMe && m.group !== 'tool').map(m => `${m.minutes} min ${m.app || m.platform} (${m.group === 'learning' ? 'learning/AI tool' : m.category})`).join('; ') || 'not logged'}.`,
    `Love: whom they will love today ${day.love?.whom?.trim() ? `"${day.love.whom.trim()}"` : 'not chosen'}; how they will love themselves ${(day.love?.self ?? day.love?.happy)?.trim() ? `"${(day.love?.self ?? day.love?.happy)!.trim()}"` : 'not chosen'}; done: ${day.love?.done ? 'yes' : 'not yet'}.`,
    `Soul: Tao practice read ${day.tao?.done ? 'yes' : 'not yet'}, lived today ${day.tao?.lived?.trim() ? `"${day.tao.lived.trim().slice(0, 120)}"` : 'not written yet'}; Daily Wisdom studied ${day.soul?.verseStudied ? 'yes' : 'not yet'}, lived today ${day.soul?.verseLived?.trim() ? `"${day.soul.verseLived.trim().slice(0, 120)}"` : 'not written yet'}; gratitude journal: thankful for ${countGratitude(day.soul?.gratitude)} of 3, made me laugh ${day.soul?.laugh?.trim() ? 'written' : 'not yet'}, best part of the day ${day.soul?.best?.trim() ? 'written' : 'not yet'}, I was kind to ${day.love?.kindTo?.trim() ? `"${day.love.kindTo.trim().slice(0, 100)}"` : 'not yet'}.`,
    `Scores out of 100: body ${w.body ? Math.round(w.body.total) : 'not logged'}, mind ${w.mind ? Math.round(w.mind.total) : 'not logged'}, soul ${w.soul ? Math.round(w.soul.total) : 'not logged'}; well-being ${Math.round(w.total)} of 300.`,
    dailyWisdomLine(tradition, date, `Bhagavad Gita ${v.chapter}.${v.verse} (${v.transliteration.replace(/\n/g, ' ')})`),
    `Today's Tao practice (${tao.pillar}): ${tao.title}: ${tao.practice[0]} Done: ${day.tao?.done ? 'yes' : 'not yet'}.`,
    TAO_FOR_AI,
    profile.me?.meditationGoal ? `Meditation goal: ${profile.me.meditationGoal.minutes} min a day by ${profile.me.meditationGoal.by}; today's planned guided session ${todaysLength(profile.me.meditationGoal, days, date).minutes} min (suggest this length, not more).` : 'Meditation goal: none.',
    profile.me?.saved?.length ? `Saved to their journey (what inspires them): ${profile.me.saved.slice(0, 5).map(x => `"${x.title}"`).join('; ')}.` : 'Saved to their journey: nothing yet.',
    `Habits today (repeating; shown to them at their time by the app, do not repeat them as tasks): ${hab || 'none'}.`,
    tasks ?? '',
    `Last 7 days:\n${week}`,
  ].filter(Boolean).join('\n');
}

/** The moment of the day Myra plans for (founder, 21 Oct 2026): first thing in the morning (gratitude), office hours
 *  on weekdays (a work task), lunch (snap the plate), evening and night. Myra recommends refreshes when this changes. */
export type Slot = 'early morning' | 'office morning' | 'late morning' | 'lunch' | 'office afternoon' | 'afternoon' | 'evening' | 'dinner' | 'night';
export function partOfDay(d = new Date()): Slot {
  const m = d.getHours() * 60 + d.getMinutes();
  const weekday = d.getDay() >= 1 && d.getDay() <= 5;
  if (m >= 5 * 60 && m < 9 * 60 + 30) return 'early morning';
  if (m < 5 * 60) return 'night';
  if (m < 12 * 60 + 30) return weekday ? 'office morning' : 'late morning';
  if (m < 14 * 60 + 30) return 'lunch';
  if (m < 18 * 60 + 30) return weekday ? 'office afternoon' : 'afternoon';
  if (m < 19 * 60 + 30) return 'evening';
  if (m < 21 * 60 + 30) return 'dinner';
  return 'night';
}

/** A short fingerprint of what the person has logged today, so Myra knows when the picture has changed. */
export function daySignature(day: DayLog): string {
  // Small, constant changes (a few hundred steps, heart readings every few minutes) must not count as a new picture:
  // they made Myra refresh every 20 minutes and used up the day's AI requests (20 Oct 2026). Use coarse steps instead.
  const { guidance: _g, savedAt: _s, health, activity, mind, ...rest } = day;
  const text = JSON.stringify({
    ...rest,
    activity: { steps: Math.floor((activity.steps ?? 0) / 3000), active: Math.floor((activity.activeMin ?? 0) / 20) },
    mind: { ...mind, meditationMin: Math.floor((mind.meditationMin ?? 0) / 10) },
    health: { workouts: health?.workouts?.length ?? 0, slept: !!health?.sleepStages, weight: Math.round(health?.weightKg ?? 0) },
  });
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return String(h);
}

/** Daily Wisdom for the AI: the person's tradition and today's passage reference (never their tradition if not chosen). */
function dailyWisdomLine(t: Tradition | null | undefined, date: string, gita: string): string {
  const p = t && t !== 'hindu' ? passageOfDay(t, date) : null;
  return p ? `Daily Wisdom (${traditionName(t)}): ${p.ref}${p.english ? `: ${p.english.replace(/\n/g, ' ').slice(0, 300)}` : ''}.` : `Daily Wisdom: ${gita}.`;
}

/** Apple Health extras for Myra: body measures, recovery, workouts, sleep stages. */
export function healthLine(day: DayLog): string {
  const h = day.health;
  if (!h) return 'Apple Health extras: none.';
  const bits = [
    h.weightKg != null ? `weight ${h.weightKg} kg` : '',
    h.bodyFatPct != null ? `body fat ${h.bodyFatPct}%` : '',
    h.restingHr != null ? `resting heart rate ${h.restingHr}` : '',
    h.hrv != null ? `HRV ${h.hrv} ms (lower than usual can mean stress or poor recovery)` : '',
    h.vo2max != null ? `VO2 max ${h.vo2max}` : '',
    h.activeKcal != null ? `active energy ${h.activeKcal} kcal` : '',
    h.mindfulMin != null ? `mindful minutes ${h.mindfulMin}` : '',
    h.workouts?.length ? `workouts ${h.workouts.map(w => `${w.type} ${w.min} min`).join(', ')}` : '',
    h.sleepStages ? `sleep stages deep ${h.sleepStages.deep ?? '-'} h, REM ${h.sleepStages.rem ?? '-'} h, core ${h.sleepStages.core ?? '-'} h, awake ${h.sleepStages.awake ?? '-'} h` : '',
  ].filter(Boolean);
  return `Apple Health extras: ${bits.join('; ') || 'none'}.`;
}

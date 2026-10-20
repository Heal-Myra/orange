// A plain-text summary of the person's targets, today and the last 7 days, sent to the AI
// (daily guidance and Myra) so its answers are about this person. Built on the device; only what is needed is sent.

import { shiftISO, todayISO } from './dates';
import { verseOfDay } from './gita';
import { PRACTICES, mealTotals, wellBeing } from './scoring';
import { TAO_FOR_AI, taoForDate } from './tao';
import type { DayLog, Profile } from './types';

export function buildContext(day: DayLog, days: Record<string, DayLog>, date: string, profile: Profile, tasks?: string): string {
  const w = wellBeing(day, profile), t = mealTotals(day.meals), v = verseOfDay(date), tao = taoForDate(date);
  const week = Array.from({ length: 7 }, (_, i) => shiftISO(date, -i - 1)).filter(d => days[d]).map(d => {
    const x = wellBeing(days[d], profile);
    return `${d}: body ${x.body ? Math.round(x.body.total) : '-'}, mind ${x.mind ? Math.round(x.mind.total) : '-'}, soul ${x.soul ? Math.round(x.soul.total) : '-'}`;
  }).join('\n') || 'no earlier days logged';
  const now = new Date();
  const clock = date === todayISO()
    ? `Now: ${now.toTimeString().slice(0, 5)} local time (${partOfDay(now)}). Only what is still possible from now on today counts.`
    : `This is a past or future day (${date}), not today.`;
  return [
    clock,
    `Targets: ${profile.kcal} kcal, ${profile.protein} g protein, ${profile.steps} steps, ${profile.active} active min, ${profile.meditation} min meditation, social media ≤ ${profile.mediaLimit} min.`,
    `Today (${date}): steps ${day.activity.steps ?? 'not logged'}, active ${day.activity.activeMin ?? 'not logged'} min${day.activity.source ? ` (from ${day.activity.source})` : ''}, sleep ${day.sleep.hours ?? 'not logged'} h (quality ${day.sleep.quality ?? '-'}/5).`,
    `Food: ${day.meals.map(m => m.name).join(', ') || 'nothing logged'}; totals ${Math.round(t.kcal)} kcal, P ${Math.round(t.p)} g, C ${Math.round(t.c)} g, F ${Math.round(t.f)} g.`,
    `Mind: attention block ${day.mind.attention ? 'yes' : 'no'}, learning ${day.mind.learning ? 'yes' : 'no'}; social media ${day.noMedia ? 'none' : day.media.map(m => `${m.minutes} min ${m.platform} (${m.category})`).join('; ') || 'not logged'}.`,
    `Soul: breathing and meditation ${day.mind.meditationMin ?? 'not done yet'} min; eight-practices check ${day.soul?.checked ? `answered; slipped on ${PRACTICES.filter(p => !day.dharma[p.id]).map(p => p.name).join(', ') || 'none'}` : 'not answered yet'}; Gita verse studied ${day.soul?.verseStudied ? 'yes' : 'not yet'}; gratitude ${(day.soul?.gratitude ?? []).filter(g => g?.trim()).length} of 3; thought for the day ${day.soul?.thought?.trim() ? 'written' : 'not yet'}.`,
    `Scores out of 100: body ${w.body ? Math.round(w.body.total) : 'not logged'}, mind ${w.mind ? Math.round(w.mind.total) : 'not logged'}, soul ${w.soul ? Math.round(w.soul.total) : 'not logged'}; well-being ${Math.round(w.total)} of 300.`,
    `Verse of the day: Bhagavad Gita ${v.chapter}.${v.verse} (${v.transliteration.replace(/\n/g, ' ')}).`,
    `Today's Tao practice (${tao.pillar}): ${tao.title}: ${tao.practice[0]} Done: ${day.tao?.done ? 'yes' : 'not yet'}.`,
    TAO_FOR_AI,
    tasks ?? '',
    `Last 7 days:\n${week}`,
  ].join('\n');
}

/** morning (5-12), afternoon (12-17), evening (17-21) or night. Myra recommends refreshes when this changes. */
export function partOfDay(d = new Date()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = d.getHours();
  return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night';
}

/** A short fingerprint of what the person has logged today, so Myra knows when the picture has changed. */
export function daySignature(day: DayLog): string {
  const { guidance: _g, ...rest } = day;
  const text = JSON.stringify(rest);
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return String(h);
}

// What you fed your mind (founder, 31 Oct 2026; decision 0039): like a meal's protein and fat, the feelings in what a person
// watched: love, hope, joy, calm and learning (nourishing) against fear and anger (heavy). Apps do not let Happy Orange see
// what was watched, so this is an estimate: each app's minutes by the kind of content it usually is (from the Screen Time
// reading), plus any post or video shared to Happy Orange, which Myra reads for its actual feelings.

import type { ContentCategoryId, MediaSession } from './types';

export type FeelingId = 'love' | 'hope' | 'joy' | 'calm' | 'learning' | 'fear' | 'anger';
export type FeelingMix = Partial<Record<FeelingId, number>>; // shares that add up to 1

export const FEELINGS: { id: FeelingId; label: string; heavy?: boolean }[] = [
  { id: 'love', label: 'Love' }, { id: 'hope', label: 'Hope' }, { id: 'joy', label: 'Joy' }, { id: 'calm', label: 'Calm' },
  { id: 'learning', label: 'Learning' }, { id: 'fear', label: 'Fear', heavy: true }, { id: 'anger', label: 'Anger', heavy: true },
];

/** The usual feelings of each kind of content (an everyday estimate, not a measurement). */
export const CATEGORY_MIX: Record<ContentCategoryId, FeelingMix> = {
  learning: { learning: 0.85, hope: 0.15 },
  spiritual: { calm: 0.6, hope: 0.25, love: 0.15 },
  inspiring: { hope: 0.7, joy: 0.3 },
  connect: { love: 0.75, joy: 0.25 },
  news: { fear: 0.45, learning: 0.3, anger: 0.25 },
  fun: { joy: 0.8, love: 0.2 },
  scrolling: { joy: 0.4, fear: 0.3, anger: 0.3 }, // comparison and outrage creep in
  negative: { anger: 0.55, fear: 0.45 },
};

/** A shared post or video that Myra read, with its own feelings. Counted as 10 minutes of watching. */
export interface Watched { title: string; url?: string; feelings: FeelingMix; at: string }
export const WATCHED_MINUTES = 10;

const add = (into: Record<string, number>, mix: FeelingMix, minutes: number) => {
  const sum = Object.values(mix).reduce((a, b) => a + (b ?? 0), 0) || 1;
  for (const [k, v] of Object.entries(mix)) into[k] = (into[k] ?? 0) + ((v ?? 0) / sum) * minutes;
};

/** The mix for a day's phone sessions and shared items, as shares that add up to 1 (null when nothing to go on). */
export function feelingMix(media: MediaSession[], watched: Watched[] = []): { mix: Record<FeelingId, number>; minutes: number } | null {
  const mins: Record<string, number> = {};
  let minutes = 0;
  for (const m of media) {
    if (m.notMe || m.group === 'tool' || !(m.minutes > 0)) continue;
    add(mins, CATEGORY_MIX[m.category] ?? { joy: 1 }, m.minutes);
    minutes += m.minutes;
  }
  for (const w of watched) { add(mins, w.feelings, WATCHED_MINUTES); minutes += WATCHED_MINUTES; }
  if (!minutes) return null;
  const mix = Object.fromEntries(FEELINGS.map(f => [f.id, (mins[f.id] ?? 0) / minutes])) as Record<FeelingId, number>;
  return { mix, minutes };
}

/** The share of heavy feelings (fear and anger). */
export const heavyShare = (mix: Record<FeelingId, number>) => FEELINGS.filter(f => f.heavy).reduce((a, f) => a + mix[f.id], 0);

/** Keep only known feelings from the AI, as shares that add up to 1. */
export function cleanFeelings(raw: unknown): FeelingMix | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: FeelingMix = {};
  let sum = 0;
  for (const f of FEELINGS) { const v = Number((raw as Record<string, unknown>)[f.id]); if (v > 0) { out[f.id] = v; sum += v; } }
  if (!sum) return null;
  for (const k of Object.keys(out) as FeelingId[]) out[k] = out[k]! / sum;
  return out;
}

/** One line for Myra. */
export function feelingsLine(r: ReturnType<typeof feelingMix>, fasting?: { until: string } | null): string {
  const parts: string[] = [];
  if (r) parts.push(`What they fed their mind yesterday (estimate from app minutes and shared posts): ${FEELINGS.map(f => `${f.id} ${Math.round(r.mix[f.id] * 100)}%`).join(', ')}; heavy (fear + anger) ${Math.round(heavyShare(r.mix) * 100)}%. If heavy is above 30%, gently suggest lighter, nourishing content or an information fast.`);
  if (fasting) parts.push(`They are on an information fast until ${fasting.until}: do not suggest phone, videos or social media.`);
  return parts.join(' ');
}

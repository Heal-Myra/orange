// Spaces (founder, 10 Nov 2026; decision 0055): a home set up to help you. Snap a space (kitchen, bedroom, work desk,
// quiet corner); Myra says in one line what she sees and gives three small changes, each one line of at most 10 words.
// Seven days later, snap it again: before and after side by side, and what changed.
// The words (Myra's line, the changes, the ticks) are kept with About you, so they sync. The photos stay on this phone.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { shiftISO } from './dates';

export type SpaceId = 'kitchen' | 'bedroom' | 'living' | 'washroom' | 'desk' | 'corner';
/** Which part of you each space helps, and the specialist who reads it (decision 0052). */
export const SPACES: { id: SpaceId; name: string; helps: string; specialist: string }[] = [
  { id: 'kitchen', name: 'Kitchen', helps: 'Helps Food · Body', specialist: 'food' },
  { id: 'bedroom', name: 'Bedroom', helps: 'Helps Sleep · Body', specialist: 'sleep' },
  { id: 'living', name: 'Living room', helps: 'Helps family time · Soul', specialist: 'soul' },
  { id: 'washroom', name: 'Washroom', helps: 'Helps your morning · Body', specialist: 'body' },
  { id: 'desk', name: 'Work desk', helps: 'Helps focus · Mind', specialist: 'mind' },
  { id: 'corner', name: 'Quiet corner', helps: 'Helps meditation · Soul', specialist: 'soul' },
];

/** The Space score (founder, 10 Nov 2026): five fixed checks per space, 20 points each, marked by Myra from the photo.
 *  Fixed checks keep it fair: it only rises when a change can be seen. Kept on its own; not part of My day (yet). */
export const CHECKS: Record<SpaceId, string[]> = {
  kitchen: ['Fruit or vegetables in sight', 'Packaged snacks out of sight', 'Water within reach', 'Clear space to cook', 'Light and fresh air'],
  bedroom: ['Phone charges away from the bed', 'Dark at night', 'No work or TV facing the bed', 'Calm, clear bedside', 'Fresh air'],
  living: ['Seats face each other', 'TV is not the centre', 'Phones charge away from the sofa', 'Room to stretch or play', 'Daylight and fresh air'],
  washroom: ['Phone kept out', 'Scale in a fixed spot', 'Toothbrush and tongue cleaner at hand', 'Dry, safe floor', 'Light and fresh air'],
  desk: ['Phone out of reach', 'Clear desk', 'Water bottle at hand', 'Screen at eye level', 'Good light'],
  corner: ['A clear seat or mat', 'Calm, little clutter', 'Soft light', 'Journal or book at hand', 'Away from screens'],
};
export const CHECK_MAX = 20;

/** The five points (0, 10 or 20 each) as Myra gave them; anything else is rounded to the nearest. */
export function checkPoints(v: unknown): number[] | undefined {
  if (!Array.isArray(v) || v.length !== 5) return undefined;
  return v.map(x => { const n = Number(x); return !Number.isFinite(n) ? 0 : n >= 15 ? 20 : n >= 5 ? 10 : 0; });
}
export const scoreOf = (s?: SpaceState) => (s?.round.checks ? s.round.checks.reduce((a, b) => a + b, 0) : null);
/** All snapped spaces together: the average of their scores (spaces not yet snapped do not count). */
export function spacesScore(all: SpacesState, ids: SpaceId[] = SPACES.map(x => x.id)): number | null {
  const v = ids.map(id => scoreOf(all[id])).filter((n): n is number => n != null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
export const HOME: SpaceId[] = ['kitchen', 'bedroom', 'living', 'washroom', 'corner'];

/** The weekend (home) and Friday (office desk) nudge: which space and what to say. */
export function weekNudge(all: SpacesState, day: number /* 0 Sunday … 6 Saturday */): null | { kind: 'home' | 'office'; id: SpaceId; score: number | null; tip?: string } {
  if (day === 5) { const s = all.desk; return { kind: 'office', id: 'desk', score: scoreOf(s), tip: s?.round.changes.find(c => !c.done)?.text }; }
  if (day !== 0 && day !== 6) return null;
  const snapped = HOME.filter(id => scoreOf(all[id]) != null).sort((a, b) => (scoreOf(all[a]) ?? 0) - (scoreOf(all[b]) ?? 0));
  const low = snapped.find(id => (scoreOf(all[id]) ?? 100) < 100);
  if (low) return { kind: 'home', id: low, score: scoreOf(all[low]), tip: all[low]!.round.changes.find(c => !c.done)?.text };
  const fresh = HOME.find(id => !all[id] || scoreOf(all[id]) == null);
  return fresh ? { kind: 'home', id: fresh, score: null } : null;
}

/** Myra's one move for the Spaces page (founder, 10 Nov 2026): the change that lifts the Spaces score most. An after photo
 *  that is due comes first (it is how points are earned); then the space with the biggest gap to its potential; then
 *  the first space not snapped yet. `gain` = points that space can still add, shared across its changes not done. */
export function bestMove(all: SpacesState, today: string): null | { id: SpaceId; kind: 'after' | 'change' | 'snap'; text?: string; gain?: number } {
  const due = SPACES.find(x => afterDue(all[x.id], today) && scoreOf(all[x.id]) != null);
  if (due) return { id: due.id, kind: 'after' };
  let best: { id: SpaceId; gap: number; text: string; open: number } | null = null;
  for (const x of SPACES) {
    const st = all[x.id], sc = scoreOf(st);
    if (!st || sc == null || st.round.potential == null) continue;
    const open = st.round.changes.filter(c => !c.done);
    const gap = st.round.potential - sc;
    if (gap > 0 && open.length && (!best || gap > best.gap)) best = { id: x.id, gap, text: open[0].text, open: open.length };
  }
  if (best) return { id: best.id, kind: 'change', text: best.text, gain: Math.max(10, Math.round(best.gap / best.open / 10) * 10) };
  const fresh = SPACES.find(x => scoreOf(all[x.id]) == null);
  return fresh ? { id: fresh.id, kind: 'snap' } : null;
}

export const AGAIN_AFTER = 7; // days until the after photo

/** spot: where the change goes on the photo, 0–1 from the left and from the top (Myra's pins; build 14 quick update). */
export interface SpaceChange { text: string; why: string; where?: string; spot?: { x: number; y: number } | null; done?: string } // done = ISO date ticked
export interface SpaceRound { at: string; seen: string; changes: SpaceChange[]; checks?: number[]; potential?: number } // checks: the five points; potential: the score with the 3 changes
export interface SpaceState {
  round: SpaceRound; // the latest photo and its three changes
  last?: { at: string; seen: string; kept: number; of: number }; // what changed since the photo before it
}
export type SpacesState = Partial<Record<SpaceId, SpaceState>>;

export const doneCount = (s?: SpaceState) => s?.round.changes.filter(c => c.done).length ?? 0;
/** The day the after photo is due. */
export const againOn = (s: SpaceState) => shiftISO(s.round.at, AGAIN_AFTER);
export const afterDue = (s: SpaceState | undefined, today: string) => !!s && today >= againOn(s);

/** The one-line status on the spaces list. */
export function statusOf(s: SpaceState | undefined, today: string): { key: string; vars?: Record<string, number> } {
  if (!s) return { key: 'Add a photo' };
  if (afterDue(s, today)) return { key: 'Time for an after photo' };
  const sc = scoreOf(s);
  if (sc != null) return { key: 'Score {n}', vars: { n: sc } };
  return { key: '{n} of {m} done', vars: { n: doneCount(s), m: s.round.changes.length } };
}

/** The next space to suggest: one whose after photo is due, else the first never photographed. */
export function nextSpace(all: SpacesState, today: string): { id: SpaceId; due: boolean } | null {
  const due = SPACES.find(x => afterDue(all[x.id], today));
  if (due) return { id: due.id, due: true };
  const fresh = SPACES.find(x => !all[x.id]);
  return fresh ? { id: fresh.id, due: false } : null;
}

type ReadChange = { text: string; why: string; where?: string; spot?: unknown };
/** A pin's place, kept inside the picture; anything unreadable means no pin. */
export function spotOf(v: unknown): { x: number; y: number } | null {
  const o = v as { x?: unknown; y?: unknown } | null | undefined;
  const x = Number(o?.x), y = Number(o?.y);
  if (!o || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const clamp = (n: number) => Math.min(0.97, Math.max(0.03, n));
  return { x: clamp(x), y: clamp(y) };
}

/** The space after a new photo. `kept`: the earlier changes Myra could see were made; ticked ones count too. */
export function afterPhoto(prev: SpaceState | undefined, read: { seen: string; changes: ReadChange[]; kept?: number[]; points?: unknown; potential?: unknown }, today: string): SpaceState {
  const checks = checkPoints(read.points);
  const total = checks ? checks.reduce((a, b) => a + b, 0) : null;
  const pot = Number(read.potential);
  const round: SpaceRound = { at: today, seen: read.seen, changes: read.changes.slice(0, 3).map(c => ({ text: c.text, why: c.why, ...(c.where ? { where: c.where } : {}), spot: spotOf(c.spot) })),
    ...(checks ? { checks, potential: Number.isFinite(pot) ? Math.round(Math.min(100, Math.max(total ?? 0, pot)) / 10) * 10 : undefined } : {}) };
  if (!prev) return { round };
  const of = prev.round.changes.length;
  const kept = new Set([...(read.kept ?? []).filter(i => i >= 0 && i < of), ...prev.round.changes.map((c, i) => (c.done ? i : -1)).filter(i => i >= 0)]);
  return { round, last: { at: prev.round.at, seen: read.seen, kept: kept.size, of } };
}

// ---- Photos, on this phone only ----
const key = (id: SpaceId) => `spaces.photo.${id}`;
export interface SpacePhoto { uri: string; at: string; ratio?: number } // ratio = width ÷ height, so pins land in the right place
export interface SpacePhotos { before?: SpacePhoto; after?: SpacePhoto } // small JPEG data URIs

/** A new photo: the first is "before"; later ones become "after", and the last after becomes the new before. */
export const nextPhotos = (p: SpacePhotos, uri: string, at: string, ratio?: number): SpacePhotos => {
  const now: SpacePhoto = ratio ? { uri, at, ratio } : { uri, at };
  return p.before ? { before: p.after ?? p.before, after: now } : { before: now };
};
/** The photo the current changes (and their pins) belong to. */
export const latestPhoto = (p: SpacePhotos) => p.after ?? p.before;

export async function loadPhotos(id: SpaceId): Promise<SpacePhotos> {
  try { return JSON.parse((await AsyncStorage.getItem(key(id))) ?? '{}'); } catch { return {}; }
}
export async function savePhotos(id: SpaceId, p: SpacePhotos) {
  try { await AsyncStorage.setItem(key(id), JSON.stringify(p)); } catch { /* photos are a bonus; the words are kept */ }
}

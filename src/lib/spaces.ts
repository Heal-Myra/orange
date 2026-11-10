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

export const AGAIN_AFTER = 7; // days until the after photo

export interface SpaceChange { text: string; why: string; done?: string } // done = ISO date ticked
export interface SpaceRound { at: string; seen: string; changes: SpaceChange[] }
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
  return { key: '{n} of {m} done', vars: { n: doneCount(s), m: s.round.changes.length } };
}

/** The next space to suggest: one whose after photo is due, else the first never photographed. */
export function nextSpace(all: SpacesState, today: string): { id: SpaceId; due: boolean } | null {
  const due = SPACES.find(x => afterDue(all[x.id], today));
  if (due) return { id: due.id, due: true };
  const fresh = SPACES.find(x => !all[x.id]);
  return fresh ? { id: fresh.id, due: false } : null;
}

/** The space after a new photo. `kept`: the earlier changes Myra could see were made; ticked ones count too. */
export function afterPhoto(prev: SpaceState | undefined, read: { seen: string; changes: { text: string; why: string }[]; kept?: number[] }, today: string): SpaceState {
  const round = { at: today, seen: read.seen, changes: read.changes.slice(0, 3).map(c => ({ text: c.text, why: c.why })) };
  if (!prev) return { round };
  const of = prev.round.changes.length;
  const kept = new Set([...(read.kept ?? []).filter(i => i >= 0 && i < of), ...prev.round.changes.map((c, i) => (c.done ? i : -1)).filter(i => i >= 0)]);
  return { round, last: { at: prev.round.at, seen: read.seen, kept: kept.size, of } };
}

// ---- Photos, on this phone only ----
const key = (id: SpaceId) => `spaces.photo.${id}`;
export interface SpacePhotos { before?: { uri: string; at: string }; after?: { uri: string; at: string } } // small JPEG data URIs

/** A new photo: the first is "before"; later ones become "after", and the last after becomes the new before. */
export const nextPhotos = (p: SpacePhotos, uri: string, at: string): SpacePhotos => (p.before ? { before: p.after ?? p.before, after: { uri, at } } : { before: { uri, at } });

export async function loadPhotos(id: SpaceId): Promise<SpacePhotos> {
  try { return JSON.parse((await AsyncStorage.getItem(key(id))) ?? '{}'); } catch { return {}; }
}
export async function savePhotos(id: SpaceId, p: SpacePhotos) {
  try { await AsyncStorage.setItem(key(id), JSON.stringify(p)); } catch { /* photos are a bonus; the words are kept */ }
}

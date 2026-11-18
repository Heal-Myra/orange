// NeoSapien (Neo 1) in Happy Orange (founder, 6 Nov 2026; decision 0050). Anyone with a NeoSapien account can connect
// it here, straight from Profile: Happy Orange's own server signs in to NeoSapien (no Claude or other AI account needed).
// The app only ever receives short suggestions for the day; it applies them only after the person says yes.

import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { supabase } from './supabase';
import { lang } from './i18n';
import type { DayLog } from './types';

export interface FromDay {
  date: string; fetchedAt: string; connected?: boolean; empty?: boolean;
  tone?: { talkMin: number; workMin: number; tense: number; tenseLate: number; calm: number; count: number; line: string };
  journal?: { thankful: string[]; laugh: string | null; kind: string | null; best: string | null };
  todos?: { title: string; area: 'work' | 'family' | 'self' }[];
  decided?: Record<string, 'yes' | 'no'>; // per suggestion key: thankful.0, laugh, kind, best, todo.0 …
  // Founder, 18 Nov 2026 (decision 0060): NeoSapien fills the day: meals said aloud, a fast, how a teaching was lived,
  // measures and fitness numbers. Added at once (decided 'yes'), changed or removed in details.
  meals?: { when: 'breakfast' | 'lunch' | 'dinner' | 'snack'; text: string; at: string | null }[];
  fasting?: true | null;
  lived?: { gita: string | null; tao: string | null };
  measure?: { waist: number | null; hips: number | null } | null;
  fitness?: { pushups: number | null; plank: number | null; sitStand: number | null; reach: number | null } | null;
}

async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('NeoSapien needs the online version of the app.');
  const { data, error } = await supabase.functions.invoke('neosapien', { body: { action, uiLang: lang(), ...extra } });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

let known: boolean | null = null;
const listeners = new Set<(c: boolean) => void>();
const tell = (c: boolean) => { known = c; listeners.forEach(f => f(c)); };
export const refreshStatus = () => call<{ connected: boolean }>('status').then(r => tell(!!r.connected)).catch(() => {});

/** Connected or not, kept fresh when the person comes back from the NeoSapien sign-in page. */
export function useNeoSapien() {
  const [connected, setConnected] = useState<boolean | null>(known);
  useEffect(() => {
    listeners.add(setConnected);
    if (known == null) refreshStatus();
    const a = AppState.addEventListener('change', s => { if (s === 'active') refreshStatus(); });
    const l = Linking.addEventListener('url', e => { if (e.url.includes('neosapien')) refreshStatus(); });
    return () => { listeners.delete(setConnected); a.remove(); l.remove(); };
  }, []);
  return {
    connected,
    connect: async () => { const r = await call<{ url: string }>('start'); await Linking.openURL(r.url); },
    disconnect: async () => { await call('disconnect'); tell(false); },
  };
}

/** The day's suggestions from NeoSapien (the server keeps them for 30 minutes). */
export async function fetchDay(date: string, name?: string, teach?: { gita?: string; tao?: string }): Promise<FromDay | null> {
  const r = await call<FromDay & { connected: boolean }>('day', { date, name: name ?? '', teach: teach ?? {} });
  if (r.connected === false) { tell(false); return null; }
  return { ...r, fetchedAt: new Date().toISOString() };
}

/** Every suggestion with its key, for the review screen and the journal. */
export function suggestions(f?: FromDay) {
  const out: { key: string; kind: 'thankful' | 'laugh' | 'kind' | 'best' | 'todo'; text: string; area?: string }[] = [];
  if (!f?.journal && !f?.todos) return out;
  (f.journal?.thankful ?? []).forEach((t, i) => out.push({ key: `thankful.${i}`, kind: 'thankful', text: t }));
  if (f.journal?.laugh) out.push({ key: 'laugh', kind: 'laugh', text: f.journal.laugh });
  if (f.journal?.kind) out.push({ key: 'kind', kind: 'kind', text: f.journal.kind });
  if (f.journal?.best) out.push({ key: 'best', kind: 'best', text: f.journal.best });
  (f.todos ?? []).forEach((t, i) => out.push({ key: `todo.${i}`, kind: 'todo', text: t.title, area: t.area }));
  return out;
}

export const pending = (f?: FromDay) => suggestions(f).filter(s => !f?.decided?.[s.key]);

/** Put a journal suggestion into the day, only where the box is still empty; your own words are never replaced. */
export function applyJournal(d: DayLog, kind: 'thankful' | 'laugh' | 'kind' | 'best', text: string) {
  if (kind === 'thankful') {
    const g = Array.from({ length: Math.max(3, d.soul?.gratitude?.length ?? 0) }, (_, k) => d.soul?.gratitude?.[k] ?? '');
    const i = g.findIndex(x => !x?.trim());
    if (i >= 0 && i < 3) g[i] = text;
    d.soul = { ...d.soul, gratitude: g };
  } else if (kind === 'kind') {
    if (!d.love?.kindTo?.trim()) d.love = { ...(d.love ?? {}), kindTo: text };
  } else if (!d.soul?.[kind]?.trim()) d.soul = { ...d.soul, [kind]: text };
}

/** Everything NeoSapien heard that is not yet in the day, with its key (decision 0060: added without asking). */
export function extras(f?: FromDay) {
  const out: ({ key: string } & (
    | { kind: 'meal'; text: string; when: string; at: string | null }
    | { kind: 'fasting' } | { kind: 'gita' | 'tao'; text: string }
    | { kind: 'measure'; waist: number | null; hips: number | null }
    | { kind: 'fitness'; v: NonNullable<FromDay['fitness']> }))[] = [];
  if (!f) return out;
  (f.meals ?? []).forEach((m, i) => out.push({ key: `meal.${i}`, kind: 'meal', text: m.text, when: m.when, at: m.at }));
  if (f.fasting) out.push({ key: 'fasting', kind: 'fasting' });
  if (f.lived?.gita) out.push({ key: 'lived.gita', kind: 'gita', text: f.lived.gita });
  if (f.lived?.tao) out.push({ key: 'lived.tao', kind: 'tao', text: f.lived.tao });
  if (f.measure && (f.measure.waist || f.measure.hips)) out.push({ key: 'measure', kind: 'measure', waist: f.measure.waist, hips: f.measure.hips });
  if (f.fitness) out.push({ key: 'fitness', kind: 'fitness', v: f.fitness });
  return out.filter(x => !f.decided?.[x.key]);
}

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
export async function fetchDay(date: string, name?: string): Promise<FromDay | null> {
  const r = await call<FromDay & { connected: boolean }>('day', { date, name: name ?? '' });
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

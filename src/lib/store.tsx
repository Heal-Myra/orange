// App state: the selected day, every logged day and the person's targets.
// Always saves on the device first (works offline). When the person is signed in and has
// given consent, each change is also saved to their own rows in Supabase (Mumbai).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { shiftISO, todayISO } from './dates';
import { bodyScore, mindScore, soulScore } from './scoring';
import { supabase } from './supabase';
import { DEFAULT_PROFILE, emptyDay, type DayLog, type Profile } from './types';

const STORAGE_KEY = 'heal.v1';

export type SyncStatus = 'device' | 'syncing' | 'saved' | 'error';

interface Saved { days: Record<string, DayLog>; profile: Profile }

interface HealState {
  ready: boolean;
  date: string;
  day: DayLog;
  days: Record<string, DayLog>;
  profile: Profile;
  sync: SyncStatus;
  syncError: string | null;
  setDate: (iso: string) => void;
  goDay: (delta: number) => void;
  update: (change: (d: DayLog) => void) => void;
  setProfile: (p: Profile) => void;
  clearDevice: () => Promise<void>;
}

const HealContext = createContext<HealState | null>(null);

const round2 = (v: number | undefined) => (v == null ? null : Math.round(v * 100) / 100);

function toRow(userId: string, d: DayLog, p: Profile) {
  return {
    user_id: userId,
    day: d.date,
    log: d,
    body_score: round2(bodyScore(d, p)?.total),
    mind_score: round2(mindScore(d, p)?.total),
    soul_score: round2(soulScore(d)?.total),
    updated_at: new Date().toISOString(),
  };
}

const profileRow = (userId: string, p: Profile) => ({
  user_id: userId, kcal: p.kcal, protein: p.protein, steps: p.steps, active: p.active,
  meditation: p.meditation, media_limit: p.mediaLimit, updated_at: new Date().toISOString(),
});

export function HealProvider({ children }: { children: ReactNode }) {
  const { session, consented } = useAuth();
  const userId = session && consented ? session.user.id : null;

  const [ready, setReady] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [days, setDays] = useState<Record<string, DayLog>>({});
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [sync, setSync] = useState<SyncStatus>('device');
  const [syncError, setSyncError] = useState<string | null>(null);
  const fail = useCallback((where: string, e: unknown) => {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    setSyncError(`${where}: ${msg}`);
    setSync('error');
  }, []);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 1. Load what is saved on this device.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(text => {
        if (!text) return;
        const saved = JSON.parse(text) as Partial<Saved>;
        if (saved.days) setDays(saved.days);
        if (saved.profile) setProfileState({ ...DEFAULT_PROFILE, ...saved.profile });
      })
      .catch(() => { /* start fresh if storage is unreadable */ })
      .finally(() => setReady(true));
  }, []);

  const persistLocal = useCallback((next: Saved) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {}); }, 400);
  }, []);

  // 2. After sign-in: bring down the person's saved days, and send up any days that exist only on this device.
  useEffect(() => {
    if (!ready || !userId || !supabase) { setSync('device'); return; }
    let cancelled = false;
    (async () => {
      setSync('syncing');
      const [logs, prof] = await Promise.all([
        supabase.from('day_logs').select('day, log').eq('user_id', userId).order('day', { ascending: false }).limit(366),
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (logs.error) { fail('load days', logs.error); return; }
      if (prof.error) { fail('load profile', prof.error); return; }

      const remote: Record<string, DayLog> = {};
      for (const r of logs.data ?? []) remote[r.day as string] = { ...emptyDay(r.day as string), ...(r.log as DayLog) };

      let mergedProfile = profile;
      if (prof.data?.kcal) {
        const d = prof.data;
        mergedProfile = { kcal: d.kcal, protein: d.protein, steps: d.steps, active: d.active, meditation: d.meditation, mediaLimit: d.media_limit };
        setProfileState(mergedProfile);
      }

      const onlyLocal = Object.values(days).filter(d => !remote[d.date]);
      if (onlyLocal.length) {
        const up = await supabase.from('day_logs').upsert(onlyLocal.map(d => toRow(userId, d, mergedProfile)));
        if (up.error) { fail('upload days', up.error); return; }
      }
      const merged = { ...remote };
      for (const d of onlyLocal) merged[d.date] = d;
      if (!cancelled) {
        setDays(merged);
        persistLocal({ days: merged, profile: mergedProfile });
        setSync('saved'); setSyncError(null);
      }
    })().catch(e => !cancelled && fail('sync', e));
    return () => { cancelled = true; };
    // Runs when the person signs in or out, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId]);

  const pushDay = useCallback((d: DayLog, p: Profile) => {
    if (!userId || !supabase) return;
    clearTimeout(pushTimers.current[d.date]);
    setSync('syncing');
    pushTimers.current[d.date] = setTimeout(async () => {
      const { error } = await supabase!.from('day_logs').upsert(toRow(userId, d, p));
      if (error) fail('save day', error); else { setSync('saved'); setSyncError(null); }
    }, 800);
  }, [userId, fail]);

  const update = useCallback((change: (d: DayLog) => void) => {
    setDays(prev => {
      const copy: DayLog = JSON.parse(JSON.stringify(prev[date] ?? emptyDay(date)));
      change(copy);
      const next = { ...prev, [date]: copy };
      persistLocal({ days: next, profile });
      pushDay(copy, profile);
      return next;
    });
  }, [date, profile, persistLocal, pushDay]);

  const setProfile = useCallback((p: Profile) => {
    setProfileState(p);
    persistLocal({ days, profile: p });
    if (userId && supabase) {
      setSync('syncing');
      supabase.from('profiles').upsert(profileRow(userId, p)).then(({ error }) => { if (error) fail('save targets', error); else setSync('saved'); });
    }
  }, [days, persistLocal, userId, fail]);

  const clearDevice = useCallback(async () => {
    setDays({});
    setProfileState(DEFAULT_PROFILE);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<HealState>(() => ({
    ready, date, days, profile, sync, syncError, update, setProfile, setDate, clearDevice,
    day: days[date] ?? emptyDay(date),
    goDay: (delta: number) => setDate(d => { const n = shiftISO(d, delta); return n > todayISO() ? d : n; }),
  }), [ready, date, days, profile, sync, syncError, update, setProfile, clearDevice]);

  return <HealContext.Provider value={value}>{children}</HealContext.Provider>;
}

export function useHeal(): HealState {
  const ctx = useContext(HealContext);
  if (!ctx) throw new Error('useHeal must be used inside HealProvider');
  return ctx;
}
